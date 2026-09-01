using static BCrypt.Net.BCrypt;
using MySqlConnector;
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

        var (token, expiresAt) = AuthService.CreateSession(conn, user.Id, user.Role);
        AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
        return Results.Json(new { user = LoadUserDto(conn, user.Id, user.Role) });
    }

    private static IResult DemoLogin(HttpContext ctx, DemoRequest body)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var isProduction = string.Equals(environment, "Production", StringComparison.OrdinalIgnoreCase);
        var explicitlyEnabled = Environment.GetEnvironmentVariable("DEMO_LOGIN_ENABLED") == "1";
        if (Environment.GetEnvironmentVariable("DEMO_LOGIN_DISABLED") == "1"
            || (isProduction && !explicitlyEnabled))
            return Results.Json(new { error = "Demo login is disabled" }, statusCode: 403);

        Database.EnsureDatabase();
        using var conn = Database.Open();

        long? userId = null;
        string userRole = "student";

        string targetRole = body.Role ?? (body.SubRole != null ? "faculty" : "admin");

        if (targetRole == "admin")
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id FROM admins ORDER BY id LIMIT 1";
            var res = cmd.ExecuteScalar();
            if (res != null && res != DBNull.Value) { userId = Convert.ToInt64(res); userRole = "admin"; }
        }
        else if (targetRole == "faculty" || body.SubRole != null)
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = !string.IsNullOrEmpty(body.SubRole)
                ? "SELECT id FROM faculty WHERE sub_role = @subRole ORDER BY id LIMIT 1"
                : "SELECT id FROM faculty ORDER BY id LIMIT 1";
            if (!string.IsNullOrEmpty(body.SubRole)) cmd.Parameters.AddWithValue("@subRole", body.SubRole);
            var res = cmd.ExecuteScalar();
            if (res != null && res != DBNull.Value) { userId = Convert.ToInt64(res); userRole = "faculty"; }
        }
        else
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT id FROM students ORDER BY id LIMIT 1";
            var res = cmd.ExecuteScalar();
            if (res != null && res != DBNull.Value) { userId = Convert.ToInt64(res); userRole = "student"; }
        }

        if (userId is null)
            return Results.Json(new { error = "Demo user not found" }, statusCode: 404);

        var (token, expiresAt) = AuthService.CreateSession(conn, userId.Value, userRole);
        AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
        return Results.Json(new { user = LoadUserDto(conn, userId.Value, userRole) });
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
                INSERT INTO students (name, email, password_hash, roll_no, department, semester, status)
                VALUES (@name, @email, @passwordHash, @rollNo, @department, @semester, 'active') RETURNING id;
                """;
            cmd.Parameters.AddWithValue("@name", body.Name.Trim());
            cmd.Parameters.AddWithValue("@email", body.Email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@passwordHash", passwordHash);
            cmd.Parameters.AddWithValue("@rollNo", body.RollNoOrEmpId.Trim());
            cmd.Parameters.AddWithValue("@department", body.Department.Trim());
            cmd.Parameters.AddWithValue("@semester", semester);
            var userId = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

            var (token, expiresAt) = AuthService.CreateSession(conn, userId, "student");
            AuthService.SetSessionCookie(ctx.Response, token, expiresAt);
            return Results.Json(new { user = LoadUserDto(conn, userId, "student") }, statusCode: 201);
        }
        catch (MySqlException)
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
        var record = AuthService.GetUserRow(conn, user.Id, user.Role);
        if (record is null || string.IsNullOrEmpty(record.PasswordHash) || !Verify(body.CurrentPassword, record.PasswordHash))
            return Results.Json(new { error = "Current password is incorrect" }, statusCode: 401);

        var passwordHash = HashPassword(body.NewPassword, 12);
        string table = user.Role switch { "admin" => "admins", "faculty" => "faculty", _ => "students" };
        Database.Exec(conn, $"UPDATE {table} SET password_hash = @hash WHERE id = @id",
            ("@hash", passwordHash), ("@id", user.Id));
        return Results.Json(new { success = true, message = "Password updated successfully" });
    }

    // ---- helpers ----

    private static UserRow? FindUserByEmail(MySqlConnection conn, string email)
    {
        // 1. Check admins
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT id, name, email, 'admin' AS role, password_hash, status FROM admins WHERE LOWER(email) = LOWER(@email) LIMIT 1";
            cmd.Parameters.AddWithValue("@email", email);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return new UserRow { Id = (long)r["id"], Name = (string)r["name"], Email = (string)r["email"], Role = "admin", PasswordHash = (string)r["password_hash"], Status = (string)r["status"] };
        }
        // 2. Check faculty
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT id, name, email, 'faculty' AS role, password_hash, status FROM faculty WHERE LOWER(email) = LOWER(@email) LIMIT 1";
            cmd.Parameters.AddWithValue("@email", email);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return new UserRow { Id = (long)r["id"], Name = (string)r["name"], Email = (string)r["email"], Role = "faculty", PasswordHash = (string)r["password_hash"], Status = (string)r["status"] };
        }
        // 3. Check students
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT id, name, email, 'student' AS role, password_hash, status FROM students WHERE LOWER(email) = LOWER(@email) LIMIT 1";
            cmd.Parameters.AddWithValue("@email", email);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return new UserRow { Id = (long)r["id"], Name = (string)r["name"], Email = (string)r["email"], Role = "student", PasswordHash = (string)r["password_hash"], Status = (string)r["status"] };
        }
        return null;
    }

    private static UserDto LoadUserDto(MySqlConnection conn, long id, string role = "student")
    {
        if (role == "admin")
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM admins WHERE id = @id LIMIT 1";
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapAdmin(r);
        }
        else if (role == "faculty")
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM faculty WHERE id = @id LIMIT 1";
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapFaculty(r);
        }
        else if (role == "student")
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM students WHERE id = @id LIMIT 1";
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapStudent(r);
        }

        throw new InvalidOperationException($"User {id} ({role}) not found");
    }

    // ---- request bodies ----

    public sealed record LoginRequest(string? Email, string? Password);
    public sealed record DemoRequest(string? Role, string? SubRole = null, string? Email = null);
    public sealed record RegisterRequest(string? Name, string? Email, string? Password, string? RollNoOrEmpId, string? Department, long? Semester);
    public sealed record ChangePasswordRequest(string? CurrentPassword, string? NewPassword);
}
