using System.Data;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// CMSbot AI Assistant Endpoint powered by Groq API (llama-3.3-70b-versatile).
/// Features Token-Optimized Database Context, Targeted Roll Search, & Strict VSCMS Domain Guardrails.
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
        var msg = !string.IsNullOrWhiteSpace(body.Message) ? body.Message : body.Query;
        if (string.IsNullOrWhiteSpace(msg))
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

        // 1. FETCH TOKEN-OPTIMIZED DATABASE CONTEXT
        var dbContextSummary = FetchLiveDatabaseContext(user, role, msg);

        // 2. Build Role-based System Prompt with Strict VSCMS Domain Scope Rules
        var systemPrompt = BuildSystemPrompt(role, userName, dbContextSummary);

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            try
            {
                var groqResponse = await CallGroqApi(apiKey, systemPrompt, msg);
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

        // 3. Smart Offline Mode using Full Database Facts & Domain Scope Guardrails
        var fallbackReply = BuildOfflineFallback(msg, role, userName, dbContextSummary);
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
                sb.AppendLine($"LOGGED-IN USER: Name: {user.Name}, Role: {user.Role}, Roll/Emp ID: {user.RollNoOrEmpId}, Dept: {user.Department}, Sem: {user.Semester ?? 0}, GPA: {user.Gpa ?? "N/A"}");
            }

            // A. TARGETED ROLL NUMBER & NAME LOOKUP (Compact & Fast)
            var numMatches = Regex.Matches(userQuery, @"\b\d{2,6}\b");
            if (numMatches.Count > 0)
            {
                foreach (Match m in numMatches)
                {
                    try
                    {
                        using var cmd = conn.CreateCommand();
                        cmd.CommandText = "SELECT id, name, roll_no_or_emp_id, department, semester, gpa, email FROM users WHERE roll_no_or_emp_id LIKE @roll AND role = 'student' LIMIT 3";
                        cmd.Parameters.AddWithValue("@roll", $"%{m.Value}%");
                        using var reader = cmd.ExecuteReader();
                        while (reader.Read())
                        {
                            var sid = Convert.ToInt64(reader.GetValue(0));
                            var sname = reader.GetString(1);
                            var sroll = reader.GetString(2);
                            var sdept = reader.GetString(3);
                            var sem = reader.IsDBNull(4) ? "N/A" : reader.GetValue(4).ToString();
                            var gpa = reader.IsDBNull(5) ? "N/A" : reader.GetString(5);
                            var email = reader.IsDBNull(6) ? "" : reader.GetString(6);
                            sb.AppendLine($"TARGETED MATCH ROLL '{m.Value}': {sname} (Roll: {sroll}, Dept: {sdept}, Sem {sem}, GPA: {gpa}, Email: {email})");
                        }
                    }
                    catch (Exception ex) { Console.WriteLine($"[cmsbot] Roll lookup error: {ex.Message}"); }
                }
            }

            // B. STUDENT DIRECTORY (Compact Sample for General Queries)
            if (q.Contains("student") || q.Contains("scholar") || q.Contains("who") || q.Contains("list") || q.Contains("show") || q.Contains("find") || q.Contains("search") || q.Contains("roll") || role == "admin")
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT name, roll_no, department, semester, gpa FROM students ORDER BY roll_no ASC LIMIT 20";
                    using var reader = cmd.ExecuteReader();
                    var students = new List<string>();
                    while (reader.Read())
                    {
                        var name = reader.GetString(0);
                        var roll = reader.GetString(1);
                        var dept = reader.GetString(2);
                        var sem = reader.IsDBNull(3) ? "N/A" : reader.GetValue(3).ToString();
                        var gpa = reader.IsDBNull(4) ? "N/A" : reader.GetString(4);
                        students.Add($"Roll {roll}: {name} ({dept}, Sem {sem}, GPA: {gpa})");
                    }
                    if (students.Count > 0)
                        sb.AppendLine($"STUDENT DIRECTORY SAMPLE (20 of 63 total registered students):\n- " + string.Join("\n- ", students));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Students SQL error: {ex.Message}"); }
            }

            // C. FACULTY & DEPARTMENTS ROSTER
            if (q.Contains("faculty") || q.Contains("teacher") || q.Contains("professor") || q.Contains("hod") || q.Contains("department") || role == "admin")
            {
                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT name, department, designation FROM faculty ORDER BY name LIMIT 10";
                    using var reader = cmd.ExecuteReader();
                    var faculty = new List<string>();
                    while (reader.Read())
                    {
                        var desig = reader.IsDBNull(2) ? "Faculty" : reader.GetString(2);
                        faculty.Add($"{reader.GetString(0)} ({desig}, Dept: {reader.GetString(1)})");
                    }
                    if (faculty.Count > 0)
                        sb.AppendLine($"FACULTY ROSTER:\n- " + string.Join("\n- ", faculty));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Faculty SQL error: {ex.Message}"); }

                try
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT code, name, head_of_department, student_count FROM departments";
                    using var reader = cmd.ExecuteReader();
                    var depts = new List<string>();
                    while (reader.Read())
                    {
                        var hod = reader.IsDBNull(2) ? "Not Assigned" : reader.GetString(2);
                        depts.Add($"{reader.GetString(0)} ({reader.GetString(1)}): HOD is {hod}");
                    }
                    if (depts.Count > 0)
                        sb.AppendLine($"DEPARTMENTS & HODs:\n- " + string.Join("\n- ", depts));
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Depts SQL error: {ex.Message}"); }
            }

            // D. FEE RECORDS DATABASE
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
                        cmd.CommandText = "SELECT student_name, roll_no, fee_type, amount, paid_amount, status FROM fee_records ORDER BY id DESC LIMIT 10";
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
                            fees.Add($"{sname} (Roll {roll}): {ftype} - Invoiced ₹{amt:N0}, Paid ₹{paid:N0}, Balance Due ₹{(amt - paid):N0} [{fstat}]");
                        }
                    }
                    if (fees.Count > 0)
                    {
                        sb.AppendLine($"FEE RECORDS SUMMARY (Total Invoiced: ₹{grandTotal:N0}, Total Collected: ₹{grandPaid:N0}, Total Dues: ₹{(grandTotal - grandPaid):N0}):\n- " + string.Join("\n- ", fees));
                    }
                }
                catch (Exception ex) { Console.WriteLine($"[cmsbot] Fee SQL error: {ex.Message}"); }
            }

            // E. ATTENDANCE DATA
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
                        cmd.CommandText = "SELECT course_code, status, COUNT(*) FROM attendance GROUP BY course_code, status ORDER BY course_code LIMIT 10";
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

            // F. NOTICES
            try
            {
                using var cmd = conn.CreateCommand();
                cmd.CommandText = "SELECT title, category, priority, published_date FROM notices ORDER BY id DESC LIMIT 3";
                using var reader = cmd.ExecuteReader();
                var notices = new List<string>();
                while (reader.Read())
                {
                    var title = reader.IsDBNull(0) ? "" : reader.GetString(0);
                    var cat = reader.IsDBNull(1) ? "General" : reader.GetString(1);
                    var prio = reader.IsDBNull(2) ? "Normal" : reader.GetString(2);
                    var dt = reader.IsDBNull(3) ? "" : reader.GetString(3);
                    notices.Add($"[{prio}] {title} ({cat}) - {dt}");
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
            "admin" => "You are CMSbot, the Executive AI Assistant for VSCMS ERP Director & Admin Office. You have live database access to student records, roll numbers, faculty rosters, fee collections, grade sheets, and campus operations.",
            "faculty" => $"You are CMSbot, the Faculty AI Assistant for {userName}. You assist with class attendance registers, internal exam marks entry, coursework assignments, timetable schedules, and leave reviews.",
            _ => $"You are CMSbot, the Student AI Assistant for {userName}. You provide friendly, concise help regarding student attendance, GPA, fee dues, exam timetable, course schedules, and campus notices."
        };

        return $@"{roleContext}

STRICT DOMAIN BOUNDARY & SCOPE RULES:
- You are strictly an AI assistant for VSCMS ERP.
- You MUST ONLY answer questions related to VSCMS, its students, faculty, departments, courses, attendance, fees, grades, exams, timetable, campus notices, admissions, and university operations.
- If the user asks ANY question outside of college/university operations (e.g. general trivia, coding scripts, world news, cooking recipes, sports, pop culture, entertainment, or irrelevant general knowledge), YOU MUST STRICTLY REFUSE TO ANSWER.
- Standard refusal response for irrelevant questions: ""I am CMSbot, the VSCMS ERP Assistant. I am strictly configured to assist only with college-related queries such as student attendance, fee dues, grades, faculty rosters, course schedules, and campus notices. Please ask an ERP or campus-related question!""

REAL-TIME DATABASE FACTS:
{dbContextSummary}

GUIDELINES:
- Answer strictly based on the real-time database facts provided above.
- Provide exact names, roll numbers, department names, and currency amounts (₹) from the database context.
- If asked for a student by roll number, locate them in the directory and provide their exact details.
- Be concise, accurate, and professional.";
    }

    private static async Task<string?> CallGroqApi(string apiKey, string systemPrompt, string userMessage)
    {
        string[] candidateModels = new[]
        {
            "groq/compound",
            "openai/gpt-oss-120b",
            "qwen/qwen3.8-27b",
            "groq/compound-mini"
        };

        foreach (var modelName in candidateModels)
        {
            try
            {
                var payload = new
                {
                    model = modelName,
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt },
                        new { role = "user", content = userMessage }
                    },
                    temperature = 0.2,
                    max_tokens = 600
                };

                using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
                request.Headers.Add("Authorization", $"Bearer {apiKey}");
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

                var response = await HttpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);
                    var choices = doc.RootElement.GetProperty("choices");
                    if (choices.GetArrayLength() > 0)
                    {
                        var message = choices[0].GetProperty("message").GetProperty("content").GetString();
                        if (!string.IsNullOrWhiteSpace(message)) return message;
                    }
                }
                else
                {
                    var err = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[cmsbot] Groq model '{modelName}' non-success ({response.StatusCode}): {err}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[cmsbot] Groq model '{modelName}' error: {ex.Message}");
            }
        }

        return null;
    }

    private static bool IsCollegeRelatedQuery(string q)
    {
        string[] keywords = new[]
        {
            "student", "roll", "attendance", "fee", "due", "paid", "payment", "grade", "gpa", "mark",
            "faculty", "teacher", "professor", "hod", "department", "course", "subject", "timetable",
            "schedule", "exam", "notice", "announcement", "leave", "vacation", "admission", "document",
            "section", "semester", "session", "user", "college", "university", "campus", "erp", "cms",
            "who", "list", "show", "find", "search", "hi", "hello", "hey", "help", "option", "detail", "vscms"
        };

        return keywords.Any(k => q.Contains(k));
    }

    private static string BuildOfflineFallback(string query, string role, string userName, string dbContextSummary)
    {
        var q = query.ToLowerInvariant();

        if (!IsCollegeRelatedQuery(q))
        {
            return "I am **CMSbot**, the VSCMS ERP Assistant. I am strictly configured to assist only with college-related queries such as student attendance, fee dues, grades, faculty rosters, course schedules, and campus notices. Please ask an ERP or campus-related question!";
        }

        if (dbContextSummary.Contains("TARGETED MATCH ROLL"))
        {
            var section = ExtractSection(dbContextSummary, "TARGETED MATCH ROLL");
            return $"**Real-time Student Record Found in Database**:\n\n{section}";
        }

        if (q.Contains("student") || q.Contains("scholar") || q.Contains("list") || q.Contains("who") || q.Contains("roll"))
        {
            if (dbContextSummary.Contains("STUDENT DIRECTORY SAMPLE"))
            {
                var section = ExtractSection(dbContextSummary, "STUDENT DIRECTORY SAMPLE");
                return $"**Student Directory Sample from Database**:\n\n{section}";
            }
        }

        if (q.Contains("faculty") || q.Contains("teacher") || q.Contains("hod") || q.Contains("department"))
        {
            if (dbContextSummary.Contains("FACULTY ROSTER"))
            {
                var facSection = ExtractSection(dbContextSummary, "FACULTY ROSTER");
                var deptSection = ExtractSection(dbContextSummary, "DEPARTMENTS & HODs");
                return $"**Real-time Faculty & Department Directory**:\n\n{facSection}\n\n{deptSection}";
            }
        }

        if (q.Contains("fee") || q.Contains("due") || q.Contains("paid") || q.Contains("payment") || q.Contains("money"))
        {
            if (dbContextSummary.Contains("FEE RECORDS SUMMARY"))
            {
                var feeSection = ExtractSection(dbContextSummary, "FEE RECORDS SUMMARY");
                return $"**Fee Records Summary from Database**:\n\n{feeSection}\n\nYou can process payments under the **Fees** tab.";
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

    [JsonPropertyName("query")]
    public string? Query { get; set; }

    [JsonPropertyName("role")]
    public string? Role { get; set; }

    [JsonPropertyName("apiKey")]
    public string? ApiKey { get; set; }

    [JsonPropertyName("contextJson")]
    public string? ContextJson { get; set; }
}
