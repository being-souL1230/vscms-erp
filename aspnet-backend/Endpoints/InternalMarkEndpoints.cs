using System.Text.Json;
using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;
using VscmsErp.Api.Lib;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Internal marks endpoints ported from src/app/api/internal-marks/route.ts,
/// including the draft → submitted → approved workflow and auto-grading.
/// </summary>
public static class InternalMarkEndpoints
{
    private static readonly HashSet<string> ValidStatus = ["draft", "submitted", "approved"];

    public static IEndpointRouteBuilder MapInternalMarkEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Save);
        app.MapPatch("/", ChangeStatus);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (user.Role == "student")
        {
            return Results.Json(Query(conn, "SELECT * FROM internal_marks WHERE student_id = @id AND status = 'approved' ORDER BY id DESC", ("@id", user.Id)));
        }
        if (user.Role == "faculty")
        {
            var owned = OwnedCourseIds(conn, user);
            if (owned.Count == 0) return Results.Json(Array.Empty<InternalMarkDto>());
            var (sql, parameters) = BuildInClause("SELECT * FROM internal_marks WHERE course_id IN ({0}) ORDER BY id DESC", owned);
            return Results.Json(Query(conn, sql, parameters));
        }
        return Results.Json(Query(conn, "SELECT * FROM internal_marks ORDER BY id DESC"));
    }

    private static IResult Save(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var doc = JsonDocument.Parse(ctx.Request.BodyReader.AsStream());
        var body = doc.RootElement;
        var rows = ExtractRows(body);
        if (rows.Count == 0)
            return Results.Json(new { error = "No marks provided" }, statusCode: 400);

        // Faculty may only write marks for their own assigned courses.
        if (user.Role != "admin")
        {
            var checkedIds = new HashSet<long>();
            foreach (var row in rows)
            {
                var cid = J.GetLong(row, "courseId") ?? 0;
                if (!checkedIds.Add(cid)) continue;
                if (!Permissions.OwnsCourse(conn, user, cid))
                    return Results.Json(new { error = "You can only enter marks for your assigned courses" }, statusCode: 403);
            }
        }

        var fallbackStatus = body.ValueKind == JsonValueKind.Object
            && body.TryGetProperty("status", out var st)
            && st.ValueKind == JsonValueKind.String
            && ValidStatus.Contains(st.GetString()!)
            ? st.GetString()
            : null;

        // Faculty may only write/publish draft sheets (submitting for approval).
        if (user.Role != "admin" && fallbackStatus is not (null or "draft" or "submitted"))
            return Results.Json(new { error = "Only admin can publish results" }, statusCode: 403);

        var saved = rows.Select(r => SaveRow(conn, r, fallbackStatus)).ToList();
        return Results.Json(saved);
    }

    private static IResult ChangeStatus(HttpContext ctx, StatusPatchRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var target = body.Status ?? "";
        if (!ValidStatus.Contains(target))
            return Results.Json(new { error = "Invalid target status" }, statusCode: 400);

        var courseId = body.CourseId ?? 0;
        var examType = body.ExamType ?? "";
        if (courseId == 0 || string.IsNullOrEmpty(examType))
            return Results.Json(new { error = "courseId and examType are required" }, statusCode: 400);

        // Faculty may only change status on their own assigned courses.
        if (user.Role != "admin" && !Permissions.OwnsCourse(conn, user, courseId))
            return Results.Json(new { error = "You can only manage marks for your assigned courses" }, statusCode: 403);
        // Only admin can publish (submit → approved).
        if (user.Role != "admin" && target == "approved")
            return Results.Json(new { error = "Only admin can approve results" }, statusCode: 403);

        // Precise transitions: only flip rows in a valid from-state.
        string[] from = target switch
        {
            "approved" => ["submitted"],
            "submitted" => ["draft"],
            _ when user.Role == "admin" => ["submitted", "approved"],
            _ => ["submitted"],
        };

        var (inSql, parameters) = BuildInClause("status IN ({0})", from);
        var sql = $"UPDATE internal_marks SET status = @target WHERE course_id = @cid AND exam_type = @examType AND {inSql}";
        var all = parameters
            .Append(("@target", target))
            .Append(("@cid", courseId))
            .Append(("@examType", examType))
            .ToArray();
        var changes = Database.ExecWithCount(conn, sql, all);
        return Results.Json(new { success = true, count = changes });
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM internal_marks WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    // ---- helpers ----

    private static List<JsonElement> ExtractRows(JsonElement body)
    {
        if (body.ValueKind == JsonValueKind.Array)
            return body.EnumerateArray().ToList();
        if (body.TryGetProperty("rows", out var rows) && rows.ValueKind == JsonValueKind.Array)
            return rows.EnumerateArray().ToList();
        return body.ValueKind == JsonValueKind.Object ? [body] : [];
    }

    private static List<long> OwnedCourseIds(MySqlConnection conn, UserDto user)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id FROM courses WHERE faculty_id = @fid OR faculty_name = @fname";
        cmd.Parameters.AddWithValue("@fid", user.Id);
        cmd.Parameters.AddWithValue("@fname", user.Name);
        using var reader = cmd.ExecuteReader();
        var ids = new List<long>();
        while (reader.Read()) ids.Add((long)reader["id"]);
        return ids;
    }

    private static (string Sql, (string Name, object? Value)[] Parameters) BuildInClause(string template, IReadOnlyCollection<string> values)
    {
        var placeholders = values.Select((_, i) => $"@v{i}").ToArray();
        var parameters = values.Select((v, i) => ($"@v{i}", (object?)v)).ToArray();
        return (string.Format(template, string.Join(", ", placeholders)), parameters);
    }

    private static (string Sql, (string Name, object? Value)[] Parameters) BuildInClause(string template, IReadOnlyCollection<long> values)
    {
        var placeholders = values.Select((_, i) => $"@v{i}").ToArray();
        var parameters = values.Select((v, i) => ($"@v{i}", (object?)v)).ToArray();
        return (string.Format(template, string.Join(", ", placeholders)), parameters);
    }

    private static List<InternalMarkDto> Query(MySqlConnection conn, string sql, params (string Name, object? Value)[] parameters)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (name, value) in parameters)
            cmd.Parameters.AddWithValue(name, value ?? DBNull.Value);
        using var reader = cmd.ExecuteReader();
        var list = new List<InternalMarkDto>();
        while (reader.Read()) list.Add(InternalMarkDto.Map(reader));
        return list;
    }

    private static InternalMarkDto SaveRow(MySqlConnection conn, JsonElement body, string? fallbackStatus)
    {
        var examType = J.GetString(body, "examType") ?? "Mid-Term";
        var semester = J.GetLong(body, "semester") ?? 1;
        var maxTheory = J.GetString(body, "maxTheory") ?? "30";
        var maxPractical = J.GetString(body, "maxPractical") ?? "20";
        var passing = J.GetDouble(body, "passingPercent") ?? 40;
        var r = Grading.ComputeInternal(
            J.GetString(body, "theoryMarks") ?? "0",
            J.GetString(body, "practicalMarks") ?? "0",
            maxTheory, maxPractical,
            Grading.Num(passing));

        var studentId = J.GetLong(body, "studentId") ?? 0;
        var courseId = J.GetLong(body, "courseId") ?? 1;

        // Locate an existing row (by id, else by student + course + exam type).
        long? existingId = null;
        var idFromBody = J.GetLong(body, "id");
        if (idFromBody is not null)
        {
            using var byId = conn.CreateCommand();
            byId.CommandText = "SELECT id FROM internal_marks WHERE id = @id LIMIT 1";
            byId.Parameters.AddWithValue("@id", idFromBody.Value);
            var found = byId.ExecuteScalar();
            if (found is not null && found is not DBNull) existingId = (long)found;
        }
        else
        {
            using var byKey = conn.CreateCommand();
            byKey.CommandText = "SELECT id FROM internal_marks WHERE student_id = @sid AND course_id = @cid AND exam_type = @examType LIMIT 1";
            byKey.Parameters.AddWithValue("@sid", studentId);
            byKey.Parameters.AddWithValue("@cid", courseId);
            byKey.Parameters.AddWithValue("@examType", examType);
            var found = byKey.ExecuteScalar();
            if (found is not null && found is not DBNull) existingId = (long)found;
        }

        string? existingStatus = null;
        if (existingId is not null)
        {
            using var st = conn.CreateCommand();
            st.CommandText = "SELECT status FROM internal_marks WHERE id = @id";
            st.Parameters.AddWithValue("@id", existingId.Value);
            var s = st.ExecuteScalar();
            if (s is not null && s is not DBNull) existingStatus = (string)s;
        }

        var explicitStatus = J.GetString(body, "status") is { } bodyStatus && ValidStatus.Contains(bodyStatus) ? bodyStatus : "";
        var status =
            !string.IsNullOrEmpty(explicitStatus) ? explicitStatus
            : fallbackStatus is not null ? fallbackStatus
            : existingStatus ?? "draft";

        var remarks = J.GetString(body, "remarks");
        if (string.IsNullOrEmpty(remarks))
            remarks = r.Result == "fail" ? "Backlog to be cleared in next attempt" : "";

        var studentName = J.GetString(body, "studentName") ?? "";
        var courseCode = J.GetString(body, "courseCode") ?? "";
        var courseName = J.GetString(body, "courseName") ?? "";

        if (existingId is not null)
        {
            Database.Exec(conn, """
                UPDATE internal_marks SET
                  student_id = @sid, student_name = @sname, course_id = @cid, course_code = @ccode,
                  course_name = @cname, exam_type = @examType, semester = @semester,
                  theory_marks = @theory, practical_marks = @practical, max_theory = @maxTheory,
                  max_practical = @maxPractical, total_marks = @total, max_total = @maxTotal,
                  pass_marks = @passMarks, grade_letter = @grade, result = @result, status = @status, remarks = @remarks
                WHERE id = @id
                """,
                ("@sid", studentId), ("@sname", studentName), ("@cid", courseId), ("@ccode", courseCode),
                ("@cname", courseName), ("@examType", examType), ("@semester", semester),
                ("@theory", Grading.Num(r.Theory)), ("@practical", Grading.Num(r.Practical)),
                ("@maxTheory", Grading.Num(r.MaxTheory)), ("@maxPractical", Grading.Num(r.MaxPractical)),
                ("@total", Grading.Num(r.Total)), ("@maxTotal", Grading.Num(r.MaxTotal)),
                ("@passMarks", Grading.Num(r.PassMarks)), ("@grade", r.GradeLetter), ("@result", r.Result),
                ("@status", status), ("@remarks", remarks), ("@id", existingId.Value));
            return LoadById(conn, existingId.Value);
        }

        long id;
        using (var insert = conn.CreateCommand())
        {
            insert.CommandText = """
                INSERT INTO internal_marks (student_id, student_name, course_id, course_code, course_name, exam_type, semester,
                  theory_marks, practical_marks, max_theory, max_practical, total_marks, max_total, pass_marks,
                  grade_letter, result, status, remarks)
                VALUES (@sid, @sname, @cid, @ccode, @cname, @examType, @semester,
                  @theory, @practical, @maxTheory, @maxPractical, @total, @maxTotal, @passMarks,
                  @grade, @result, @status, @remarks) RETURNING id;
                """;
            insert.Parameters.AddWithValue("@sid", studentId);
            insert.Parameters.AddWithValue("@sname", studentName);
            insert.Parameters.AddWithValue("@cid", courseId);
            insert.Parameters.AddWithValue("@ccode", courseCode);
            insert.Parameters.AddWithValue("@cname", courseName);
            insert.Parameters.AddWithValue("@examType", examType);
            insert.Parameters.AddWithValue("@semester", semester);
            insert.Parameters.AddWithValue("@theory", Grading.Num(r.Theory));
            insert.Parameters.AddWithValue("@practical", Grading.Num(r.Practical));
            insert.Parameters.AddWithValue("@maxTheory", Grading.Num(r.MaxTheory));
            insert.Parameters.AddWithValue("@maxPractical", Grading.Num(r.MaxPractical));
            insert.Parameters.AddWithValue("@total", Grading.Num(r.Total));
            insert.Parameters.AddWithValue("@maxTotal", Grading.Num(r.MaxTotal));
            insert.Parameters.AddWithValue("@passMarks", Grading.Num(r.PassMarks));
            insert.Parameters.AddWithValue("@grade", r.GradeLetter);
            insert.Parameters.AddWithValue("@result", r.Result);
            insert.Parameters.AddWithValue("@status", status);
            insert.Parameters.AddWithValue("@remarks", remarks);
            id = (long)(insert.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        }
        return LoadById(conn, id);
    }

    private static InternalMarkDto LoadById(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM internal_marks WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? InternalMarkDto.Map(reader) : throw new InvalidOperationException("Marks row not found");
    }

    public sealed record StatusPatchRequest(long? CourseId, string? ExamType, string? Status);
}
