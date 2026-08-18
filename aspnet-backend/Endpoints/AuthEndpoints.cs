using static BCrypt.Net.BCrypt;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;
using VscmsErp.Api.Lib;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Auth endpoints ported from src/app/api/auth/*:
/// login, demo, register, logout, me, change-password.
/// </summary>
public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        // Login routes carry a strict rate limit (10 per 15 min per IP) on top
        // of the per-email brute-force lockout in Security.cs.
        app.MapPost("/login", Login).RequireRateLimiting("login");
        app.MapPost("/demo", DemoLogin).RequireRateLimiting("login");
        app.MapPost("/register", Register).RequireRateLimiting("login");
        app.MapPost("/logout", Logout);
        app.MapGet("/me", Me);
        app.MapPost("/change-password", ChangePassword);
        return app;
    }

    private static IResult Login(HttpContext ctx, LoginRequest body)
    {
        // Self-heal: recreate schema if the DB is missing/empty.
        Database.EnsureDatabase();
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            return Results.Json(new { error = "Email and password are required" }, statusCode: 400);

        // Brute-force guard: lock the email after 5 failed attempts (15 min).
        if (Security.IsLoginLocked(body.Email))
            return Results.Json(new { error = "Too many failed attempts. Try again in 15 minutes." }, statusCode: 429);

        using var conn = Database.Open();
        var user = FindUserByEmail(conn, body.Email.Trim().ToLowerInvariant());
        if (user is null || string.IsNullOrEmpty(user.PasswordHash) || !Verify(body.Password, user.PasswordHash))
        {
            Security.RecordFailedLogin(body.Email);
            return Results.Json(new { error = "Invalid email or password" }, statusCode: 401);
        }
        Security.ClearFailedLogins(body.Email);
        if (user.Status != "active")
            return Results.Json(new { error = "This account is not active" }, statusCode: 403);

        var (token, expiresAt) = AuthService.CreateSession(conn, user.Id);
        AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
        return Results.Json(new { user = LoadUserDto(conn, user.Id) });
    }

    private static IResult DemoLogin(HttpContext ctx, DemoRequest body)
    {
        // Demo login is a convenience for showcasing the system: it hands out a
        // session for the first user of a role with no credentials. Because that
        // is a privilege-escalation hole, production disables it by default.
        // Opt in for a demo/showcase deployment with DEMO_LOGIN_ENABLED=1;
        // DEMO_LOGIN_DISABLED=1 always wins as an emergency kill switch.
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var isProduction = string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase);
        var explicitlyEnabled = Environment.GetEnvironmentVariable("DEMO_LOGIN_ENABLED") == "1";
        if (Environment.GetEnvironmentVariable("DEMO_LOGIN_DISABLED") == "1"
            || (isProduction && !explicitlyEnabled))
            return Results.Json(new { error = "Demo login is disabled" }, statusCode: 403);

        Database.EnsureDatabase();
        var role = body.Role;
        if (role is not ("admin" or "faculty" or "student"))
            return Results.Json(new { error = "Invalid demo role" }, statusCode: 400);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id FROM users WHERE role = @role ORDER BY id LIMIT 1";
        cmd.Parameters.AddWithValue("@role", role);
        var id = cmd.ExecuteScalar();
        if (id is null || id is DBNull)
            return Results.Json(new { error = "Demo data is not ready" }, statusCode: 404);

        var userId = (long)id;
        var (token, expiresAt) = AuthService.CreateSession(conn, userId);
        AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
        return Results.Json(new { user = LoadUserDto(conn, userId) });
    }

    private static IResult Register(HttpContext ctx, RegisterRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.Email)
            || string.IsNullOrWhiteSpace(body.Password) || string.IsNullOrWhiteSpace(body.RollNoOrEmpId)
            || string.IsNullOrWhiteSpace(body.Department))
            return Results.Json(new { error = "Name, email, password, roll number and department are required" }, statusCode: 400);
        if (body.Password!.Length < 8)
            return Results.Json(new { error = "Password must be at least 8 characters" }, statusCode: 400);

        var passwordHash = HashPassword(body.Password, 12);
        var semester = body.Semester is > 0 ? body.Semester.Value : 1;

        try
        {
            using var conn = Database.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = """
                INSERT INTO users (name, email, password_hash, role, roll_no_or_emp_id, department, semester, status)
                VALUES (@name, @email, @passwordHash, 'student', @rollNo, @department, @semester, 'active') RETURNING id;
                """;
            cmd.Parameters.AddWithValue("@name", body.Name.Trim());
            cmd.Parameters.AddWithValue("@email", body.Email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
            cmd.Parameters.AddWithValue("@rollNo", body.RollNoOrEmpId.Trim());
            cmd.Parameters.AddWithValue("@department", body.Department.Trim());
            cmd.Parameters.AddWithValue("@semester", semester);
            var userId = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

            var (token, expiresAt) = AuthService.CreateSession(conn, userId);
            AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
            return Results.Json(new { user = LoadUserDto(conn, userId) }, statusCode: 201);
        }
        catch (PostgresException)
        {
            return Results.Json(new { error = "An account with this email or roll number may already exist" }, statusCode: 409);
        }
    }

    private static IResult Logout(HttpContext ctx)
    {
        AuthService.ClearSession(ctx.Request);
        AuthService.ExpireSessionCookie(ctx.Response);
        return Results.Json(new { success = true });
    }

    private static IResult Me(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        return user is not null
            ? Results.Json(new { user })
            : Results.Json(new { user = (object?)null }, statusCode: 401);
    }

    private static IResult ChangePassword(HttpContext ctx, ChangePasswordRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (string.IsNullOrWhiteSpace(body.CurrentPassword) || string.IsNullOrWhiteSpace(body.NewPassword))
            return Results.Json(new { error = "Current and new passwords are required" }, statusCode: 400);
        if (body.NewPassword.Length < 8)
            return Results.Json(new { error = "New password must be at least 8 characters" }, statusCode: 400);

        using var conn = Database.Open();
        var record = AuthService.GetUserRow(conn, user.Id);
        if (record is null || string.IsNullOrEmpty(record.PasswordHash) || !Verify(body.CurrentPassword, record.PasswordHash))
            return Results.Json(new { error = "Current password is incorrect" }, statusCode: 401);

        var passwordHash = HashPassword(body.NewPassword, 12);
        Database.Exec(conn, "UPDATE users SET password_hash = @hash WHERE id = @id",
            ("@hash", passwordHash), ("@id", user.Id));
        return Results.Json(new { success = true, message = "Password updated successfully" });
    }

    // ---- helpers ----

    private static UserRow? FindUserByEmail(NpgsqlConnection conn, string email)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT id, name, email, role, password_hash, status FROM users WHERE email = @email LIMIT 1";
        cmd.Parameters.AddWithValue("@email", email);
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return null;
        return new UserRow
        {
            Id = (long)reader["id"],
            Name = (string)reader["name"],
            Email = (string)reader["email"],
            Role = (string)reader["role"],
            PasswordHash = (string)reader["password_hash"],
            Status = (string)reader["status"],
        };
    }

    private static UserDto LoadUserDto(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM users WHERE id = @id LIMIT 1";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? UserDto.MapUser(reader) : throw new InvalidOperationException($"User {id} not found");
    }

    // ---- request bodies ----

    public sealed record LoginRequest(string? Email, string? Password);
    public sealed record DemoRequest(string? Role);
    public sealed record RegisterRequest(string? Name, string? Email, string? Password, string? RollNoOrEmpId, string? Department, long? Semester);
    public sealed record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);
}
