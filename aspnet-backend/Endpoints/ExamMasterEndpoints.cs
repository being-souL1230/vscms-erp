using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Exam master CRUD ported from src/app/api/exam-master/route.ts
/// (the exams definition table distinct from exam_schedules).
/// </summary>
public static class ExamMasterEndpoints
{
    public static IEndpointRouteBuilder MapExamMasterEndpoints(this IEndpointRouteBuilder app)
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
        cmd.CommandText = "SELECT * FROM exams ORDER BY id DESC";
        using var reader = cmd.ExecuteReader();
        var list = new List<ExamDefinitionDto>();
        while (reader.Read()) list.Add(ExamDefinitionDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, ExamMasterRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO exams (name, exam_type, department, semester, session, start_date, end_date, status, passing_percent)
            VALUES (@name, @examType, @department, @semester, @session, @startDate, @endDate, @status, @passingPercent) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@name", body.Name ?? "");
        cmd.Parameters.AddWithValue("@examType", string.IsNullOrEmpty(body.ExamType) ? "Mid-Term" : body.ExamType);
        cmd.Parameters.AddWithValue("@department", body.Department ?? "");
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@session", string.IsNullOrEmpty(body.Session) ? "2025-26" : body.Session);
        cmd.Parameters.AddWithValue("@startDate", body.StartDate ?? "");
        cmd.Parameters.AddWithValue("@endDate", body.EndDate ?? "");
        cmd.Parameters.AddWithValue("@status", string.IsNullOrEmpty(body.Status) ? "scheduled" : body.Status);
        cmd.Parameters.AddWithValue("@passingPercent", body.PassingPercent is > 0 ? body.PassingPercent.Value : 40);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadExamDef(conn, id));
    }

    private static IResult Update(HttpContext ctx, ExamMasterUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadExamDef(conn, body.Id.Value);
        if (current is null) return Results.Json(new { error = "Exam not found" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE exams SET
              name = @name, exam_type = @examType, department = @department, semester = @semester,
              session = @session, start_date = @startDate, end_date = @endDate, status = @status, passing_percent = @passingPercent
            WHERE id = @id
            """,
            ("@name", body.Name ?? current.Name),
            ("@examType", body.ExamType ?? current.ExamType),
            ("@department", body.Department ?? current.Department),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : current.Semester),
            ("@session", body.Session ?? current.Session),
            ("@startDate", body.StartDate ?? current.StartDate),
            ("@endDate", body.EndDate ?? current.EndDate),
            ("@status", body.Status ?? current.Status),
            ("@passingPercent", body.PassingPercent is > 0 ? body.PassingPercent.Value : current.PassingPercent),
            ("@id", body.Id.Value));

        return Results.Json(LoadExamDef(conn, body.Id.Value));
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

        Database.Exec(conn, "DELETE FROM exams WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    private static ExamDefinitionDto? LoadExamDef(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM exams WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? ExamDefinitionDto.Map(reader) : null;
    }

    public sealed record ExamMasterRequest(
        string? Name, string? ExamType, string? Department, long? Semester, string? Session,
        string? StartDate, string? EndDate, string? Status, long? PassingPercent);

    public sealed record ExamMasterUpdateRequest(
        long? Id, string? Name, string? ExamType, string? Department, long? Semester, string? Session,
        string? StartDate, string? EndDate, string? Status, long? PassingPercent);
}
