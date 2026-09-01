using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Assignments ported from src/app/api/assignments/route.ts:
/// faculty create assignments, students submit, faculty grade submissions.
/// </summary>
public static class AssignmentEndpoints
{
    public static IEndpointRouteBuilder MapAssignmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapPut("/", Grade);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "assignments", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var assignments = QueryAll(conn, "SELECT * FROM assignments ORDER BY id DESC", AssignmentDto.Map);
        var submissions = QueryAll(conn,
            user.Role == "student"
                ? "SELECT * FROM assignment_submissions WHERE student_id = @id ORDER BY id DESC"
                : "SELECT * FROM assignment_submissions ORDER BY id DESC",
            AssignmentSubmissionDto.Map,
            user.Role == "student" ? ("@id", (object?)user.Id) : null);
        return Results.Json(new { assignments, submissions });
    }

    private static IResult Create(HttpContext ctx, AssignmentPostRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();

        if (body.Type == "submission")
        {
            if (user.Role != "student" || !Permissions.Can(conn, user, "assignments", "create"))
                return Results.Json(new { error = "Only students can submit assignments" }, statusCode: 403);

            using var cmd = conn.CreateCommand();
            cmd.CommandText = """
                INSERT INTO assignment_submissions (assignment_id, student_id, student_name, submission_text, file_url, status)
                VALUES (@aid, @sid, @sname, @text, @fileUrl, 'submitted') RETURNING id;
                """;
            cmd.Parameters.AddWithValue("@aid", body.AssignmentId ?? 0);
            cmd.Parameters.AddWithValue("@sid", user.Id);
            cmd.Parameters.AddWithValue("@sname", user.Name);
            cmd.Parameters.AddWithValue("@text", string.IsNullOrEmpty(body.SubmissionText) ? "Submitted through online student portal." : body.SubmissionText);
            cmd.Parameters.AddWithValue("@fileUrl", string.IsNullOrEmpty(body.FileUrl) ? "https://vscms.edu/drive/submission-doc.pdf" : body.FileUrl);
            var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
            return Results.Json(LoadSubmission(conn, id));
        }

        if ((user.Role != "faculty" && user.Role != "admin") || !Permissions.Can(conn, user, "assignments", "create"))
            return Results.Json(new { error = "Faculty or admin access required" }, statusCode: 403);

        using var insert = conn.CreateCommand();
        insert.CommandText = """
            INSERT INTO assignments (course_id, course_name, title, description, due_date, max_marks, faculty_name)
            VALUES (@cid, @cname, @title, @description, @dueDate, @maxMarks, @facultyName) RETURNING id;
            """;
        insert.Parameters.AddWithValue("@cid", body.CourseId is > 0 ? body.CourseId.Value : 1);
        insert.Parameters.AddWithValue("@cname", string.IsNullOrEmpty(body.CourseName) ? "Computer Science" : body.CourseName);
        insert.Parameters.AddWithValue("@title", body.Title ?? "");
        insert.Parameters.AddWithValue("@description", body.Description ?? "");
        insert.Parameters.AddWithValue("@dueDate", string.IsNullOrEmpty(body.DueDate) ? "2026-04-10" : body.DueDate);
        insert.Parameters.AddWithValue("@maxMarks", body.MaxMarks is > 0 ? body.MaxMarks.Value : 50);
        insert.Parameters.AddWithValue("@facultyName", user.Name);
        var id2 = (long)(insert.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return Results.Json(LoadAssignment(conn, id2));
    }

    private static IResult Grade(HttpContext ctx, GradeSubmissionRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || (user.Role != "faculty" && user.Role != "admin"))
            return Results.Json(new { error = "Faculty or admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "assignments", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (body.SubmissionId is null)
            return Results.Json(new { error = "Submission ID is required" }, statusCode: 400);

        var hasMarks = !string.IsNullOrEmpty(body.Marks);
        if (hasMarks)
        {
            var valid = double.TryParse(body.Marks, out var numeric) && numeric >= 0;
            if (!valid)
                return Results.Json(new { error = "Marks must be a non-negative number" }, statusCode: 400);
        }

        var status = "graded";
        var sql = "UPDATE assignment_submissions SET status = @status";
        var parameters = new List<(string Name, object? Value)> { ("@status", status), ("@id", body.SubmissionId.Value) };
        if (hasMarks) parameters.Add(("@marks", body.Marks));
        if (!string.IsNullOrEmpty(body.Feedback)) parameters.Add(("@feedback", body.Feedback));
        sql += hasMarks ? ", marks = @marks" : "";
        sql += !string.IsNullOrEmpty(body.Feedback) ? ", feedback = @feedback" : "";
        sql += " WHERE id = @id";
        Database.Exec(conn, sql, parameters.ToArray());

        var updated = LoadSubmission(conn, body.SubmissionId.Value);
        if (updated is null) return Results.Json(new { error = "Submission not found" }, statusCode: 404);
        return Results.Json(updated);
    }

    private static List<T> QueryAll<T>(MySqlConnection conn, string sql, Func<MySqlDataReader, T> map, (string Name, object? Value)? parameter = null)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        if (parameter is { } p) cmd.Parameters.AddWithValue(p.Name, p.Value ?? DBNull.Value);
        using var reader = cmd.ExecuteReader();
        var list = new List<T>();
        while (reader.Read()) list.Add(map(reader));
        return list;
    }

    private static AssignmentDto? LoadAssignment(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM assignments WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? AssignmentDto.Map(reader) : null;
    }

    private static AssignmentSubmissionDto? LoadSubmission(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM assignment_submissions WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? AssignmentSubmissionDto.Map(reader) : null;
    }

    public sealed record AssignmentPostRequest(
        string? Type, long? AssignmentId, string? SubmissionText, string? FileUrl,
        long? CourseId, string? CourseName, string? Title, string? Description,
        string? DueDate, long? MaxMarks);

    public sealed record GradeSubmissionRequest(long? SubmissionId, string? Marks, string? Feedback);
}
