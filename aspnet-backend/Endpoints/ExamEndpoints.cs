using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Exam schedule CRUD ported from src/app/api/exams/route.ts (exam_schedules table).</summary>
public static class ExamEndpoints
{
    public static IEndpointRouteBuilder MapExamEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapPut("/", Update);
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

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM exam_schedules ORDER BY id DESC";
        using var reader = cmd.ExecuteReader();
        var list = new List<ExamScheduleDto>();
        while (reader.Read()) list.Add(ExamScheduleDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, ExamRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO exam_schedules (exam_type, course_code, course_name, department, semester, exam_date, start_time, end_time, room)
            VALUES (@examType, @courseCode, @courseName, @department, @semester, @examDate, @startTime, @endTime, @room) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@examType", body.ExamType ?? "");
        cmd.Parameters.AddWithValue("@courseCode", body.CourseCode ?? "");
        cmd.Parameters.AddWithValue("@courseName", body.CourseName ?? "");
        cmd.Parameters.AddWithValue("@department", body.Department ?? "");
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@examDate", body.ExamDate ?? "");
        cmd.Parameters.AddWithValue("@startTime", body.StartTime ?? "");
        cmd.Parameters.AddWithValue("@endTime", body.EndTime ?? "");
        cmd.Parameters.AddWithValue("@room", body.Room ?? "");
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadExam(conn, id));
    }

    private static IResult Update(HttpContext ctx, ExamUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadExam(conn, body.Id.Value);
        if (current is null) return Results.Json(new { error = "Record not found" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE exam_schedules SET
              exam_type = @examType, course_code = @courseCode, course_name = @courseName, department = @department,
              semester = @semester, exam_date = @examDate, start_time = @startTime, end_time = @endTime, room = @room
            WHERE id = @id
            """,
            ("@examType", body.ExamType ?? current.ExamType),
            ("@courseCode", body.CourseCode ?? current.CourseCode),
            ("@courseName", body.CourseName ?? current.CourseName),
            ("@department", body.Department ?? current.Department),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : current.Semester),
            ("@examDate", body.ExamDate ?? current.ExamDate),
            ("@startTime", body.StartTime ?? current.StartTime),
            ("@endTime", body.EndTime ?? current.EndTime),
            ("@room", body.Room ?? current.Room),
            ("@id", body.Id.Value));

        return Results.Json(LoadExam(conn, body.Id.Value));
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

        Database.Exec(conn, "DELETE FROM exam_schedules WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    private static ExamScheduleDto? LoadExam(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM exam_schedules WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? ExamScheduleDto.Map(reader) : null;
    }

    public sealed record ExamRequest(
        string? ExamType, string? CourseCode, string? CourseName, string? Department, long? Semester,
        string? ExamDate, string? StartTime, string? EndTime, string? Room);

    public sealed record ExamUpdateRequest(
        long? Id, string? ExamType, string? CourseCode, string? CourseName, string? Department, long? Semester,
        string? ExamDate, string? StartTime, string? EndTime, string? Room);
}
