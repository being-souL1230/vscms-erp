using static BCrypt.Net.BCrypt;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Student CRUD ported from src/app/api/students/route.ts.
/// Faithful to the original JSON contract and quirks (e.g. PUT sets the
/// roll number to "undefined" when the field is omitted, semester resets to 1).
/// </summary>
public static class StudentEndpoints
{
    public static IEndpointRouteBuilder MapStudentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListStudents);
        app.MapPost("/", CreateStudent);
        app.MapPut("/", UpdateStudent);
        app.MapDelete("/", DeleteStudent);
        return app;
    }

    private static IResult ListStudents(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "students", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        if (user.Role == "student")
        {
            cmd.CommandText = "SELECT * FROM users WHERE id = @id";
            cmd.Parameters.AddWithValue("@id", user.Id);
        }
        else
        {
            cmd.CommandText = "SELECT * FROM users WHERE role = 'student'";
        }
        using var reader = cmd.ExecuteReader();
        var list = new List<UserDto>();
        while (reader.Read()) list.Add(UserDto.MapUser(reader));
        return Results.Json(list);
    }

    private static IResult CreateStudent(HttpContext ctx, StudentRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "students", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Email)
            || string.IsNullOrWhiteSpace(body.RollNoOrEmpId) || string.IsNullOrWhiteSpace(body.Department))
            return Results.Json(new { error = "Name, email, roll number, and department are required" }, statusCode: 400);

        var passwordHash = HashPassword(string.IsNullOrEmpty(body.Password) ? "demo12345" : body.Password, 12);
        var avatarUrl = body.AvatarUrl
            ?? $"https://images.unsplash.com/photo-{1534528741775 + Random.Shared.Next(1000)}?w=150&auto=format&fit=crop&q=80";

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO users (name, email, role, roll_no_or_emp_id, department, semester, phone, gpa, status, password_hash, avatar_url)
            VALUES (@name, @email, 'student', @rollNo, @department, @semester, @phone, @gpa, @status, @passwordHash, @avatarUrl) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@name", body.Name);
        cmd.Parameters.AddWithValue("@email", body.Email);
        cmd.Parameters.AddWithValue("@rollNo", body.RollNoOrEmpId.Trim());
        cmd.Parameters.AddWithValue("@department", body.Department);
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@phone", body.Phone ?? "");
        cmd.Parameters.AddWithValue("@gpa", string.IsNullOrEmpty(body.Gpa) ? "3.50" : body.Gpa);
        cmd.Parameters.AddWithValue("@status", string.IsNullOrEmpty(body.Status) ? "active" : body.Status);
        cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
        cmd.Parameters.AddWithValue("@avatarUrl", avatarUrl);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadUser(conn, id));
    }

    private static IResult UpdateStudent(HttpContext ctx, StudentUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Student ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "students", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadStudent(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        // Faithful to the original: rollNo is always clobbered (String(undefined)
        // yields "undefined") and semester resets to 1 when omitted; the other
        // fields keep their current value when not provided.
        var rollNo = body.RollNoOrEmpId is null ? "undefined" : body.RollNoOrEmpId.Trim();
        var semester = body.Semester is > 0 ? body.Semester.Value : 1;

        Database.Exec(conn, """
            UPDATE users SET
              name = @name, email = @email, roll_no_or_emp_id = @rollNo,
              department = @department, semester = @semester, phone = @phone,
              gpa = @gpa, status = @status
            WHERE id = @id AND role = 'student'
            """,
            ("@name", body.Name ?? current.Name),
            ("@email", body.Email ?? current.Email),
            ("@rollNo", rollNo),
            ("@department", body.Department ?? current.Department),
            ("@semester", semester),
            ("@phone", body.Phone ?? current.Phone),
            ("@gpa", body.Gpa ?? current.Gpa),
            ("@status", body.Status ?? current.Status),
            ("@id", body.Id.Value));

        return Results.Json(LoadUser(conn, body.Id.Value));
    }

    private static IResult DeleteStudent(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Student ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "students", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM users WHERE id = @id AND role = 'student'", ("@id", id));
        return Results.Json(new { success = true, message = "Student deleted successfully" });
    }

    // ---- helpers ----

    private static UserDto? LoadUser(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE id = @id LIMIT 1";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? UserDto.MapUser(reader) : null;
    }

    private static UserDto? LoadStudent(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE id = @id AND role = 'student' LIMIT 1";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? UserDto.MapUser(reader) : null;
    }

    // ---- request bodies ----

    public sealed record StudentRequest(
        string? Name, string? Email, string? RollNoOrEmpId, string? Department,
        long? Semester, string? Phone, string? Gpa, string? Status, string? AvatarUrl, string? Password);

    public sealed record StudentUpdateRequest(
        long? Id, string? Name, string? Email, string? RollNoOrEmpId, string? Department,
        long? Semester, string? Phone, string? Gpa, string? Status);
}
