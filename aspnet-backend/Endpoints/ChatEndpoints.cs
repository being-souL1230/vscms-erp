using System.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// CMSbot AI Assistant Endpoint powered by Groq API (llama-3.3-70b-versatile).
/// Features Dynamic Intent SQL Extractor with robust type conversion for PostgreSQL/SQLite.
/// </summary>
public static class ChatEndpoints
{
    private static readonly HttpClient HttpClient = new();
    private static string? AdminCustomApiKey;

    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/", Chat);
        app.MapGet("/status", GetKeyStatus);
        return app;
    }

    private static IResult GetKeyStatus(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        var envKey = Environment.GetEnvironmentVariable("GROQ_API_KEY");
        var hasActiveKey = !string.IsNullOrWhiteSpace(AdminCustomApiKey) || !string.IsNullOrWhiteSpace(envKey);
        
        return Results.Json(new
        {
            hasEnvKey = !string.IsNullOrWhiteSpace(envKey),
            hasCustomKey = !string.IsNullOrWhiteSpace(AdminCustomApiKey),
            hasActiveKey,
            isAdmin = user?.Role == "admin"
        });
    }

    private static async Task<IResult> Chat(HttpContext ctx, ChatRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Message))
            return Results.Json(new { error = "Message is required" }, statusCode: 400);

        var user = AuthService.GetCurrentUser(ctx.Request);
        var role = user?.Role ?? body.Role ?? "student";
        var userName = user?.Name ?? "User";

        // Admin override key update
        if (user?.Role == "admin" && body.ApiKey != null)
        {
            var trimmed = body.ApiKey.Trim();
            AdminCustomApiKey = string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
        }

        // Key Resolution Precedence: Admin Custom Key -> System Env Key
        var apiKey = !string.IsNullOrWhiteSpace(AdminCustomApiKey)
            ? AdminCustomApiKey
            : Environment.GetEnvironmentVariable("GROQ_API_KEY");

        // 1. DYNAMICALLY FETCH REAL DATABASE ROWS BASED ON USER QUERY INTENT
        var dbContextSummary = FetchLiveDatabaseContext(user, role, body.Message);

        // 2. Build Role-based System Prompt with Exact Live Database Context
        var systemPrompt = BuildSystemPrompt(role, userName, dbContextSummary);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var groqResponse = await CallGroqApi(apiKey, systemPrompt, body.Message);
                if (!string.IsNullOrEmpty(groqResponse))
                {
                    return Results.Json(new { reply = groqResponse, mode = "groq" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[cmsbot] Groq API call error: {ex.Message}");
            }
        }

        // 3. Smart Offline Mode using REAL Live Database Facts
        var fallbackReply = BuildOfflineFallback(body.Message, role, userName, dbContextSummary);
        return Results.Json(new { reply = fallbackReply, mode = "offline" });
    }

    private static string FetchLiveDatabaseContext(UserDto? user, string role, string userQuery)
    {
        var sb = new StringBuilder();
        var q = userQuery.ToLowerInvariant();

        try
        {
            using var conn = Database.Open();

            // Always add current session profile
            if (user != null)
            {
                sb.AppendLine($"LOGGED-IN USER PROFILE: Name: {user.Name}, Role: {user.Role}, Roll/Emp ID: {user.RollNoOrEmpId}, Department: {user.Department}, Semester: {user.Semester ?? 0}, GPA: {user.Gpa ?? "N/A"}");
            }

            // DYNAMIC INTENT SQL QUERIES BASED ON USER QUESTION

            // A. Student List / Search Intent
            if (q.Contains("student") || q.Contains("scholar") || q.Contains("who") || q.Contains("list") || q.Contains("show") || q.Contains("find") || q.Contains("search") || role == "admin")
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT name, roll_no_or_emp_id, department, semester, gpa, status FROM users WHERE role = 'student' ORDER BY name LIMIT 15";
                    using var reader = cmd.ExecuteReader();
                    var students = new List<string>();
                    while (reader.Read())
                    {
                        var sem = reader.IsDBNull(3) ? "N/A" : reader.GetValue(3).ToString();
                        var gpa = reader.IsDBNull(4) ? "N/A" : reader.GetString(4);
                        students.Add($"{reader.GetString(0)} (Roll: {reader.GetString(1)}, Dept: {reader.GetString(2)}, Sem {sem}, GPA: {gpa})");
                    }
                    if (students.Count > 0)
                        sb.AppendLine($"STUDENT DIRECTORY ({students.Count} sample records):\n- " + string.Join("\n- ", students));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Students SQL error: {ex.Message}"); }
            }

            // B. Faculty & Departments Intent
            if (q.Contains("faculty") || q.Contains("teacher") || q.Contains("professor") || q.Contains("hod") || q.Contains("department") || role == "admin")
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT name, department, designation, email FROM users WHERE role = 'faculty' ORDER BY name LIMIT 10";
                    using var reader = cmd.ExecuteReader();
                    var faculty = new List<string>();
                    while (reader.Read())
                    {
                        var desig = reader.IsDBNull(2) ? "Faculty" : reader.GetString(2);
                        faculty.Add($"{reader.GetString(0)} ({desig}, Dept: {reader.GetString(1)}, Email: {reader.GetString(3)})");
                    }
                    if (faculty.Count > 0)
                        sb.AppendLine($"FACULTY ROSTER ({faculty.Count} members):\n- " + string.Join("\n- ", faculty));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Faculty SQL error: {ex.Message}"); }

                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT code, name, head_of_department, student_count, faculty_count FROM departments";
                    using var reader = cmd.ExecuteReader();
                    var depts = new List<string>();
                    while (reader.Read())
                    {
                        var hod = reader.IsDBNull(2) ? "Not Assigned" : reader.GetString(2);
                        depts.Add($"{reader.GetString(0)} - {reader.GetString(1)} (HOD: {hod}, Students: {reader.GetValue(3)}, Faculty: {reader.GetValue(4)})");
                    }
                    if (depts.Count > 0)
                        sb.AppendLine($"DEPARTMENTS SNAPSHOT:\n- " + string.Join("\n- ", depts));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Depts SQL error: {ex.Message}"); }
            }

            // C. Fees & Billing Intent
            if (q.Contains("fee") || q.Contains("due") || q.Contains("paid") || q.Contains("payment") || q.Contains("money") || q.Contains("revenue") || q.Contains("invoice"))
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    if (role == "student" && user != null)
                    {
                        cmd.CommandText = "SELECT fee_type, amount, paid_amount, status, due_date FROM fee_records WHERE student_id = @id";
                        cmd.Parameters.AddWithValue("@id", user.Id);
                    }
                    else
                    {
                        cmd.CommandText = "SELECT student_name, roll_no, fee_type, amount, paid_amount, status FROM fee_records ORDER BY id DESC LIMIT 15";
                    }
                    using var reader = cmd.ExecuteReader();
                    var fees = new List<string>();
                    decimal grandTotal = 0, grandPaid = 0;
                    while (reader.Read())
                    {
                        var amtStr = reader.GetValue(1)?.ToString() ?? "0";
                        var paidStr = reader.GetValue(2)?.ToString() ?? "0";
                        decimal.TryParse(amtStr, out var amt);
                        decimal.TryParse(paidStr, out var paid);
                        grandTotal += amt;
                        grandPaid += paid;
                        if (role == "student" && user != null)
                        {
                            fees.Add($"{reader.GetString(0)}: Invoiced ₹{amt:N0}, Paid ₹{paid:N0}, Status: {reader.GetString(3)} (Due: {reader.GetString(4)})");
                        }
                        else
                        {
                            var sname = reader.IsDBNull(0) ? "Student" : reader.GetString(0);
                            var roll = reader.IsDBNull(1) ? "N/A" : reader.GetString(1);
                            var ftype = reader.IsDBNull(2) ? "Fee" : reader.GetString(2);
                            var fstat = reader.IsDBNull(5) ? "pending" : reader.GetString(5);
                            fees.Add($"{sname} ({roll}): {ftype} - Invoiced ₹{amt:N0}, Paid ₹{paid:N0}, Balance Due ₹{(amt - paid):N0} [{fstat}]");
                        }
                    }
                    if (fees.Count > 0)
                    {
                        sb.AppendLine($"FEE RECORDS (Total Invoiced: ₹{grandTotal:N0}, Total Collected: ₹{grandPaid:N0}, Total Dues: ₹{(grandTotal - grandPaid):N0}):\n- " + string.Join("\n- ", fees));
                    }
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Fee SQL error: {ex.Message}"); }
            }

            // D. Attendance Intent
            if (q.Contains("attendance") || q.Contains("absent") || q.Contains("present") || q.Contains("class"))
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    if (role == "student" && user != null)
                    {
                        cmd.CommandText = "SELECT course_code, status, COUNT(*) FROM attendance WHERE student_id = @id GROUP BY course_code, status";
                        cmd.Parameters.AddWithValue("@id", user.Id);
                        using var reader = cmd.ExecuteReader();
                        var attList = new List<string>();
                        while (reader.Read())
                        {
                            var ccode = reader.IsDBNull(0) ? "Course" : reader.GetString(0);
                            var cstat = reader.IsDBNull(1) ? "present" : reader.GetString(1);
                            attList.Add($"{ccode}: Status '{cstat}' = {reader.GetValue(2)} classes");
                        }
                        if (attList.Count > 0)
                            sb.AppendLine($"STUDENT ATTENDANCE BREAKDOWN BY COURSE:\n- " + string.Join("\n- ", attList));
                    }
                    else
                    {
                        cmd.CommandText = "SELECT course_code, status, COUNT(*) FROM attendance GROUP BY course_code, status ORDER BY course_code";
                        using var reader = cmd.ExecuteReader();
                        var attList = new List<string>();
                        while (reader.Read())
                        {
                            var ccode = reader.IsDBNull(0) ? "Course" : reader.GetString(0);
                            var cstat = reader.IsDBNull(1) ? "present" : reader.GetString(1);
                            attList.Add($"Course {ccode}: {cstat} count = {reader.GetValue(2)}");
                        }
                        if (attList.Count > 0)
                            sb.AppendLine($"UNIVERSITY ATTENDANCE SUMMARY:\n- " + string.Join("\n- ", attList));
                    }
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Attendance SQL error: {ex.Message}"); }
            }

            // E. Leaves Intent
            if (q.Contains("leave") || q.Contains("vacation") || q.Contains("request") || q.Contains("approval"))
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT student_name, department, from_date, to_date, reason, status FROM leave_requests ORDER BY id DESC LIMIT 10";
                    using var reader = cmd.ExecuteReader();
                    var leaves = new List<string>();
                    while (reader.Read())
                    {
                        var sname = reader.IsDBNull(0) ? "Student" : reader.GetString(0);
                        var dept = reader.IsDBNull(1) ? "Dept" : reader.GetString(1);
                        var fdate = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        var tdate = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        var rsn = reader.IsDBNull(4) ? "" : reader.GetString(4);
                        var st = reader.IsDBNull(5) ? "Pending" : reader.GetString(5);
                        leaves.Add($"{sname} ({dept}): {fdate} to {tdate} - Reason: '{rsn}' [Status: {st}]");
                    }
                    if (leaves.Count > 0)
                        sb.AppendLine($"LEAVE REQUESTS SNAPSHOT:\n- " + string.Join("\n- ", leaves));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Leaves SQL error: {ex.Message}"); }
            }

            // F. Courses & Timetable Intent
            if (q.Contains("course") || q.Contains("subject") || q.Contains("timetable") || q.Contains("schedule") || q.Contains("exam") || q.Contains("room"))
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT code, name, department, credits, semester, faculty_name, room FROM courses LIMIT 10";
                    using var reader = cmd.ExecuteReader();
                    var courses = new List<string>();
                    while (reader.Read())
                    {
                        var fac = reader.IsDBNull(5) ? "Unassigned" : reader.GetString(5);
                        var rm = reader.IsDBNull(6) ? "TBD" : reader.GetString(6);
                        courses.Add($"{reader.GetString(0)} ({reader.GetString(1)}): Dept {reader.GetString(2)}, {reader.GetValue(3)} Credits, Sem {reader.GetValue(4)}, Faculty: {fac}, Room: {rm}");
                    }
                    if (courses.Count > 0)
                        sb.AppendLine($"ACTIVE COURSE CATALOG:\n- " + string.Join("\n- ", courses));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Courses SQL error: {ex.Message}"); }

                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT course_code, course_name, day_of_week, start_time, room, faculty_name FROM timetable LIMIT 10";
                    using var reader = cmd.ExecuteReader();
                    var slots = new List<string>();
                    while (reader.Read())
                    {
                        var ccode = reader.IsDBNull(0) ? "" : reader.GetString(0);
                        var cname = reader.IsDBNull(1) ? "" : reader.GetString(1);
                        var day = reader.IsDBNull(2) ? "" : reader.GetString(2);
                        var stime = reader.IsDBNull(3) ? "" : reader.GetString(3);
                        var rm = reader.IsDBNull(4) ? "" : reader.GetString(4);
                        var fac = reader.IsDBNull(5) ? "" : reader.GetString(5);
                        slots.Add($"{day} {stime} - {ccode} ({cname}) in {rm} by {fac}");
                    }
                    if (slots.Count > 0)
                        sb.AppendLine($"TIMETABLE SLOTS:\n- " + string.Join("\n- ", slots));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Timetable SQL error: {ex.Message}"); }
            }

            // G. Active Campus Notices
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT title, category, priority, date, content FROM notices ORDER BY id DESC LIMIT 5";
                using var reader = cmd.ExecuteReader();
                var notices = new List<string>();
                while (reader.Read())
                {
                    var title = reader.IsDBNull(0) ? "" : reader.GetString(0);
                    var cat = reader.IsDBNull(1) ? "General" : reader.GetString(1);
                    var prio = reader.IsDBNull(2) ? "Normal" : reader.GetString(2);
                    var dt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                    var cnt = reader.IsDBNull(4) ? "" : reader.GetString(4);
                    notices.Add($"[{prio}] {title} ({cat}): {cnt} (Date: {dt})");
                }
                if (notices.Count > 0)
                    sb.AppendLine($"ACTIVE CAMPUS NOTICES:\n- " + string.Join("\n- ", notices));
            }
            catch (Exception ex) { Console.WriteLine($"[cmsbot] Notices SQL error: {ex.Message}"); }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[cmsbot] DB Context query error: {ex.Message}");
        }

        return sb.ToString();
    }

    private static string BuildSystemPrompt(string role, string userName, string dbContextSummary)
    {
        var roleContext = role switch
        {
            "admin" => "You are CMSbot, the Executive AI Assistant for Apex University ERP Director & Admin Office. You have real-time live database access to all student records, faculty rosters, fee collections, grade sheets, and campus operations.",
            "faculty" => $"You are CMSbot, the Faculty AI Assistant for {userName}. You assist with class attendance registers, internal exam marks entry, coursework assignments, timetable schedules, and leave reviews.",
            _ => $"You are CMSbot, the Student AI Assistant for {userName}. You provide friendly, concise help regarding student attendance, GPA, fee dues, exam timetable, course schedules, and campus notices."
        };

        return $"{roleContext}\n\nREAL-TIME DATABASE FACTS:\n{dbContextSummary}\n\nGUIDELINES:\n- Answer strictly based on the real-time database facts provided above.\n- Provide exact names, numbers, roll numbers, and currency amounts (₹) from the database context.\n- Be concise, accurate, and professional.\n- Use bullet points for lists.";
    }

    private static async Task<string?> CallGroqApi(string apiKey, string systemPrompt, string userMessage)
    {
        var payload = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.3,
            max_tokens = 800
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Add("Authorization", $"Bearer {apiKey}");
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await HttpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[cmsbot] Groq API non-success {response.StatusCode}: {err}");
            return null;
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var choices = doc.RootElement.GetProperty("choices");
        if (choices.GetArrayLength() > 0)
        {
            var message = choices[0].GetProperty("message").GetProperty("content").GetString();
            return message;
        }
        return null;
    }

    private static string BuildOfflineFallback(string query, string role, string userName, string dbContextSummary)
    {
        var q = query.ToLowerInvariant();

        if (q.Contains("student") || q.Contains("scholar") || q.Contains("list") || q.Contains("who"))
        {
            if (dbContextSummary.Contains("STUDENT DIRECTORY"))
            {
                var section = ExtractSection(dbContextSummary, "STUDENT DIRECTORY");
                return $"**Real-time Student Directory from Database**:\n\n{section}";
            }
        }

        if (q.Contains("faculty") || q.Contains("teacher") || q.Contains("hod") || q.Contains("department"))
        {
            if (dbContextSummary.Contains("FACULTY ROSTER"))
            {
                var facSection = ExtractSection(dbContextSummary, "FACULTY ROSTER");
                var deptSection = ExtractSection(dbContextSummary, "DEPARTMENTS SNAPSHOT");
                return $"**Real-time Faculty & Department Directory**:\n\n{facSection}\n\n{deptSection}";
            }
        }

        if (q.Contains("fee") || q.Contains("due") || q.Contains("paid") || q.Contains("payment") || q.Contains("money"))
        {
            if (dbContextSummary.Contains("FEE RECORDS"))
            {
                var feeSection = ExtractSection(dbContextSummary, "FEE RECORDS");
                return $"**Real-time Fee Records from Database**:\n\n{feeSection}\n\nYou can process payments under the **Fees** tab.";
            }
        }

        if (q.Contains("attendance") || q.Contains("absent") || q.Contains("present"))
        {
            if (dbContextSummary.Contains("STUDENT ATTENDANCE BREAKDOWN"))
            {
                var section = ExtractSection(dbContextSummary, "STUDENT ATTENDANCE BREAKDOWN");
                return $"**Real-time Attendance Data**:\n\n{section}";
            }
            if (dbContextSummary.Contains("UNIVERSITY ATTENDANCE SUMMARY"))
            {
                var section = ExtractSection(dbContextSummary, "UNIVERSITY ATTENDANCE SUMMARY");
                return $"**University Attendance Summary**:\n\n{section}";
            }
        }

        if (q.Contains("leave") || q.Contains("request"))
        {
            if (dbContextSummary.Contains("LEAVE REQUESTS SNAPSHOT"))
            {
                var section = ExtractSection(dbContextSummary, "LEAVE REQUESTS SNAPSHOT");
                return $"**Leave Requests Register**:\n\n{section}";
            }
        }

        if (q.Contains("notice") || q.Contains("announcement"))
        {
            if (dbContextSummary.Contains("ACTIVE CAMPUS NOTICES"))
            {
                var section = ExtractSection(dbContextSummary, "ACTIVE CAMPUS NOTICES");
                return $"**Active Campus Notices**:\n\n{section}";
            }
        }

        return $"Hello **{userName}**! Here are the real-time database facts retrieved for your query:\n\n{dbContextSummary}";
    }

    private static string ExtractSection(string fullText, string headerTitle)
    {
        var lines = fullText.Split('\n');
        var inSection = false;
        var sb = new StringBuilder();
        foreach (var line in lines)
        {
            if (line.StartsWith(headerTitle))
            {
                inSection = true;
                sb.AppendLine(line);
                continue;
            }
            if (inSection)
            {
                if (line.Contains(":") && line.ToUpperInvariant() == line && !line.StartsWith("- "))
                    break;
                sb.AppendLine(line);
            }
        }
        return sb.Length > 0 ? sb.ToString().Trim() : fullText;
    }
}

public class ChatRequest
{
    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("apiKey")]
    public string? ApiKey { get; set; }

    [JsonPropertyName("contextJson")]
    public string? ContextJson { get; set; }
}
