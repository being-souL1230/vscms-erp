using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Course CRUD ported from src/app/api/courses/route.ts.</summary>
public static class CourseEndpoints
{
    public static IEndpointRouteBuilder MapCourseEndpoints(this IEndpointRouteBuilder app)
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
        if (user is not null)
        {
            using var conn = Database.Open();
            if (!Permissions.Can(conn, user, "courses", "view"))
                return Results.Json(new { error = "Access denied" }, statusCode: 403);
        }
        using var read = Database.Open();
        using var cmd = read.CreateCommand();
        cmd.CommandText = "SELECT * FROM courses";
        using var reader = cmd.ExecuteReader();
        var list = new List<CourseDto>();
        while (reader.Read()) list.Add(CourseDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, CourseRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "courses", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Code) || string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Department))
            return Results.Json(new { error = "Course code, name, and department are required" }, statusCode: 400);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO courses (code, name, department, credits, semester, faculty_name, room, schedule, description)
            VALUES (@code, @name, @department, @credits, @semester, @facultyName, @room, @schedule, @description) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@code", body.Code);
        cmd.Parameters.AddWithValue("@name", body.Name);
        cmd.Parameters.AddWithValue("@department", body.Department);
        cmd.Parameters.AddWithValue("@credits", body.Credits is > 0 ? body.Credits.Value : 3);
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@facultyName", string.IsNullOrEmpty(body.FacultyName) ? "Assigned Faculty" : body.FacultyName);
        cmd.Parameters.AddWithValue("@room", string.IsNullOrEmpty(body.Room) ? "LT-Hall 1" : body.Room);
        cmd.Parameters.AddWithValue("@schedule", string.IsNullOrEmpty(body.Schedule) ? "Mon, Wed (10:00 AM - 11:30 AM)" : body.Schedule);
        cmd.Parameters.AddWithValue("@description", body.Description ?? "");
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadCourse(conn, id));
    }

    private static IResult Update(HttpContext ctx, CourseUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Course ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "courses", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadCourse(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        Database.Exec(conn, """
            UPDATE courses SET
              code = @code, name = @name, department = @department,
              credits = @credits, semester = @semester,
              faculty_name = @facultyName, room = @room, schedule = @schedule, description = @description
            WHERE id = @id
            """,
            ("@code", body.Code ?? current.Code),
            ("@name", body.Name ?? current.Name),
            ("@department", body.Department ?? current.Department),
            ("@credits", body.Credits is > 0 ? body.Credits.Value : 3),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : 1),
            ("@facultyName", (object?)(body.FacultyName ?? current.FacultyName) ?? DBNull.Value),
            ("@room", (object?)(body.Room ?? current.Room) ?? DBNull.Value),
            ("@schedule", (object?)(body.Schedule ?? current.Schedule) ?? DBNull.Value),
            ("@description", (object?)(body.Description ?? current.Description) ?? DBNull.Value),
            ("@id", body.Id.Value));

        return Results.Json(LoadCourse(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Course ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "courses", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM courses WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, message = "Course deleted successfully" });
    }

    private static CourseDto? LoadCourse(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM courses WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? CourseDto.Map(reader) : null;
    }

    public sealed record CourseRequest(
        string? Code, string? Name, string? Department, long? Credits, long? Semester,
        string? FacultyName, string? Room, string? Schedule, string? Description);

    public sealed record CourseUpdateRequest(
        long? Id, string? Code, string? Name, string? Department, long? Credits, long? Semester,
        string? FacultyName, string? Room, string? Schedule, string? Description);
}
