using static BCrypt.Net.BCrypt;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Faculty CRUD ported from src/app/api/faculty/route.ts.</summary>
public static class FacultyEndpoints
{
    public static IEndpointRouteBuilder MapFacultyEndpoints(this IEndpointRouteBuilder app)
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
        if (!Permissions.Can(conn, user, "faculty", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE role = 'faculty'";
        using var reader = cmd.ExecuteReader();
        var list = new List<UserDto>();
        while (reader.Read()) list.Add(UserDto.MapUser(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, FacultyRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "faculty", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Department))
            return Results.Json(new { error = "Name, email, and department are required" }, statusCode: 400);

        var passwordHash = HashPassword(string.IsNullOrEmpty(body.Password) ? "demo12345" : body.Password, 12);
        var rollNo = string.IsNullOrEmpty(body.RollNoOrEmpId)
            ? $"FAC-{Random.Shared.Next(100, 1000)}"
            : body.RollNoOrEmpId.Trim();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO users (name, email, role, roll_no_or_emp_id, department, designation, phone, status, password_hash, avatar_url)
            VALUES (@name, @email, 'faculty', @rollNo, @department, @designation, @phone, 'active', @passwordHash, @avatar) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@name", body.Name);
        cmd.Parameters.AddWithValue("@email", body.Email);
        cmd.Parameters.AddWithValue("@rollNo", rollNo);
        cmd.Parameters.AddWithValue("@department", body.Department);
        cmd.Parameters.AddWithValue("@designation", string.IsNullOrEmpty(body.Designation) ? "Assistant Professor" : body.Designation);
        cmd.Parameters.AddWithValue("@phone", string.IsNullOrEmpty(body.Phone) ? "+1 (555) 000-1122" : body.Phone);
        cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
        cmd.Parameters.AddWithValue("@avatar", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80");
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadFaculty(conn, id));
    }

    private static IResult Update(HttpContext ctx, FacultyUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Faculty ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "faculty", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadFaculty(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        Database.Exec(conn, """
            UPDATE users SET name = @name, email = @email, department = @department, designation = @designation, phone = @phone
            WHERE id = @id AND role = 'faculty'
            """,
            ("@name", body.Name ?? current.Name),
            ("@email", body.Email ?? current.Email),
            ("@department", body.Department ?? current.Department),
            ("@designation", (object?)(body.Designation ?? current.Designation) ?? DBNull.Value),
            ("@phone", (object?)(body.Phone ?? current.Phone) ?? DBNull.Value),
            ("@id", body.Id.Value));

        return Results.Json(LoadFaculty(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Faculty ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "faculty", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM users WHERE id = @id AND role = 'faculty'", ("@id", id));
        return Results.Json(new { success = true, message = "Faculty member deleted successfully" });
    }

    private static UserDto? LoadFaculty(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE id = @id AND role = 'faculty'";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? UserDto.MapUser(reader) : null;
    }

    public sealed record FacultyRequest(
        string? Name, string? Email, string? RollNoOrEmpId, string? Department,
        string? Designation, string? Phone, string? Password);

    public sealed record FacultyUpdateRequest(long? Id, string? Name, string? Email, string? Department, string? Designation, string? Phone);
}
