using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Academic setup CRUD ported from src/app/api/sections, semesters and
/// sessions routes. Reads require login (any role); writes are admin-only.
/// </summary>
public static class SetupEndpoints
{
    public static IEndpointRouteBuilder MapSetupEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGroup("/sections").MapSectionEndpoints();
        app.MapGroup("/semesters").MapSemesterEndpoints();
        app.MapGroup("/sessions").MapSessionEndpoints();
        return app;
    }

    // ---- sections ----

    public static IEndpointRouteBuilder MapSectionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListSections);
        app.MapPost("/", CreateSection);
        app.MapPut("/", UpdateSection);
        app.MapDelete("/", DeleteSection);
        return app;
    }

    private static IResult ListSections(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);
        return Results.Json(QueryAll("sections", "SELECT * FROM sections ORDER BY id DESC", SectionDto.Map));
    }

    private static IResult CreateSection(HttpContext ctx, SectionRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO sections (code, name, department, semester, room)
            VALUES (@code, @name, @department, @semester, @room) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@code", body.Code ?? "");
        cmd.Parameters.AddWithValue("@name", body.Name ?? "");
        cmd.Parameters.AddWithValue("@department", body.Department ?? "");
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@room", (object?)(body.Room ?? null) ?? DBNull.Value);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return Results.Json(LoadOne("sections", "SELECT * FROM sections WHERE id = @id", id, SectionDto.Map));
    }

    private static IResult UpdateSection(HttpContext ctx, SectionUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (body.Id is null) return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        var current = LoadOne("sections", "SELECT * FROM sections WHERE id = @id", body.Id.Value, SectionDto.Map);
        if (current is null) return Results.Json(new { error = "Record not found" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE sections SET code = @code, name = @name, department = @department, semester = @semester, room = @room
            WHERE id = @id
            """,
            ("@code", body.Code ?? current.Code),
            ("@name", body.Name ?? current.Name),
            ("@department", body.Department ?? current.Department),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : current.Semester),
            ("@room", (object?)(body.Room ?? current.Room) ?? DBNull.Value),
            ("@id", body.Id.Value));
        return Results.Json(LoadOne("sections", "SELECT * FROM sections WHERE id = @id", body.Id.Value, SectionDto.Map));
    }

    private static IResult DeleteSection(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (!TryParseId(ctx, out var id)) return Results.Json(new { error = "ID is required" }, statusCode: 400);
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM sections WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    // ---- semesters ----

    public static IEndpointRouteBuilder MapSemesterEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListSemesters);
        app.MapPost("/", CreateSemester);
        app.MapPut("/", UpdateSemester);
        app.MapDelete("/", DeleteSemester);
        return app;
    }

    private static IResult ListSemesters(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);
        return Results.Json(QueryAll("semesters", "SELECT * FROM semesters ORDER BY id DESC", SemesterInfoDto.Map));
    }

    private static IResult CreateSemester(HttpContext ctx, SemesterRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO semesters (number, name, department, status, starts_on, ends_on)
            VALUES (@number, @name, @department, @status, @startsOn, @endsOn) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@number", body.Number ?? 1);
        cmd.Parameters.AddWithValue("@name", body.Name ?? "");
        cmd.Parameters.AddWithValue("@department", body.Department ?? "");
        cmd.Parameters.AddWithValue("@status", body.Status ?? "inactive");
        cmd.Parameters.AddWithValue("@startsOn", (object?)(body.StartsOn ?? null) ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@endsOn", (object?)(body.EndsOn ?? null) ?? DBNull.Value);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return Results.Json(LoadOne("semesters", "SELECT * FROM semesters WHERE id = @id", id, SemesterInfoDto.Map));
    }

    private static IResult UpdateSemester(HttpContext ctx, SemesterUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (body.Id is null) return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        var current = LoadOne("semesters", "SELECT * FROM semesters WHERE id = @id", body.Id.Value, SemesterInfoDto.Map);
        if (current is null) return Results.Json(new { error = "Record not found" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE semesters SET number = @number, name = @name, department = @department, status = @status, starts_on = @startsOn, ends_on = @endsOn
            WHERE id = @id
            """,
            ("@number", body.Number is > 0 ? body.Number.Value : current.Number),
            ("@name", body.Name ?? current.Name),
            ("@department", body.Department ?? current.Department),
            ("@status", body.Status ?? current.Status),
            ("@startsOn", (object?)(body.StartsOn ?? current.StartsOn) ?? DBNull.Value),
            ("@endsOn", (object?)(body.EndsOn ?? current.EndsOn) ?? DBNull.Value),
            ("@id", body.Id.Value));
        return Results.Json(LoadOne("semesters", "SELECT * FROM semesters WHERE id = @id", body.Id.Value, SemesterInfoDto.Map));
    }

    private static IResult DeleteSemester(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (!TryParseId(ctx, out var id)) return Results.Json(new { error = "ID is required" }, statusCode: 400);
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM semesters WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    // ---- academic sessions ----

    public static IEndpointRouteBuilder MapSessionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListSessions);
        app.MapPost("/", CreateSession);
        app.MapPut("/", UpdateSession);
        app.MapDelete("/", DeleteSession);
        return app;
    }

    private static IResult ListSessions(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);
        return Results.Json(QueryAll("sessions", "SELECT * FROM academic_sessions ORDER BY id DESC", AcademicSessionDto.Map));
    }

    private static IResult CreateSession(HttpContext ctx, SessionRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO academic_sessions (name, start_date, end_date, is_current)
            VALUES (@name, @start, @end, @isCurrent) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@name", body.Name ?? "");
        cmd.Parameters.AddWithValue("@start", body.StartDate ?? "");
        cmd.Parameters.AddWithValue("@end", body.EndDate ?? "");
        cmd.Parameters.AddWithValue("@isCurrent", body.IsCurrent ?? 0);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return Results.Json(LoadOne("sessions", "SELECT * FROM academic_sessions WHERE id = @id", id, AcademicSessionDto.Map));
    }

    private static IResult UpdateSession(HttpContext ctx, SessionUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (body.Id is null) return Results.Json(new { error = "ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        var current = LoadOne("sessions", "SELECT * FROM academic_sessions WHERE id = @id", body.Id.Value, AcademicSessionDto.Map);
        if (current is null) return Results.Json(new { error = "Record not found" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE academic_sessions SET name = @name, start_date = @start, end_date = @end, is_current = @isCurrent
            WHERE id = @id
            """,
            ("@name", body.Name ?? current.Name),
            ("@start", body.StartDate ?? current.StartDate),
            ("@end", body.EndDate ?? current.EndDate),
            ("@isCurrent", body.IsCurrent ?? current.IsCurrent),
            ("@id", body.Id.Value));
        return Results.Json(LoadOne("sessions", "SELECT * FROM academic_sessions WHERE id = @id", body.Id.Value, AcademicSessionDto.Map));
    }

    private static IResult DeleteSession(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);
        if (!TryParseId(ctx, out var id)) return Results.Json(new { error = "ID is required" }, statusCode: 400);
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM academic_sessions WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    // ---- shared helpers ----

    private static bool TryParseId(HttpContext ctx, out long id)
    {
        var text = ctx.Request.Query["id"].ToString();
        return long.TryParse(text, out id);
    }

    private static List<T> QueryAll<T>(string label, string sql, Func<NpgsqlDataReader, T> map)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        using var reader = cmd.ExecuteReader();
        var list = new List<T>();
        while (reader.Read()) list.Add(map(reader));
        return list;
    }

    private static T? LoadOne<T>(string label, string sql, long id, Func<NpgsqlDataReader, T> map) where T : class
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? map(reader) : null;
    }

    // ---- request bodies ----

    public sealed record SectionRequest(string? Code, string? Name, string? Department, long? Semester, string? Room);
    public sealed record SectionUpdateRequest(long? Id, string? Code, string? Name, string? Department, long? Semester, string? Room);
    public sealed record SemesterRequest(long? Number, string? Name, string? Department, string? Status, string? StartsOn, string? EndsOn);
    public sealed record SemesterUpdateRequest(long? Id, long? Number, string? Name, string? Department, string? Status, string? StartsOn, string? EndsOn);
    public sealed record SessionRequest(string? Name, string? StartDate, string? EndDate, long? IsCurrent);
    public sealed record SessionUpdateRequest(long? Id, string? Name, string? StartDate, string? EndDate, long? IsCurrent);
}
