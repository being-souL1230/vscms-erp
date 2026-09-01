using System.Security.Cryptography;
using MySqlConnector;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Auth;

/// <summary>
/// Cookie-session auth mirroring src/lib/auth.ts:
/// cookie "vscms_erp_session" holds a 64-char hex token stored in the
/// sessions table with a 7-day expiry; HttpOnly + SameSite=Lax.
/// </summary>
public static class AuthService
{
    public const string SessionCookie = "vscms_erp_session";
    private static readonly TimeSpan SessionDuration = TimeSpan.FromDays(7);

    public static (string Token, long ExpiresAt) CreateSession(MySqlConnection conn, long userId, string role = "student")
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var expiresAt = DateTimeOffset.UtcNow.Add(SessionDuration).ToUnixTimeMilliseconds();
        Database.Exec(conn,
            "INSERT INTO sessions (token, user_id, user_role, expires_at) VALUES (@token, @userId, @role, @expiresAt)",
            ("@token", token), ("@userId", userId), ("@role", role), ("@expiresAt", expiresAt));
        return (token, expiresAt);
    }

    public static void SetSessionCookie(HttpResponse response, string token, long expiresAt)
    {
        var maxAge = (int)Math.Max(0, (expiresAt - DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()) / 1000);
        var secure = response.HttpContext.Request.IsHttps ? "; Secure" : "";
        response.Headers.Append("Set-Cookie",
            $"{SessionCookie}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={maxAge}{secure}");
    }

    public static void ExpireSessionCookie(HttpResponse response)
    {
        var secure = response.HttpContext.Request.IsHttps ? "; Secure" : "";
        response.Headers.Append("Set-Cookie",
            $"{SessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0{secure}");
    }

    public static UserDto? GetCurrentUser(HttpRequest request)
    {
        if (!request.Cookies.TryGetValue(SessionCookie, out var token) || string.IsNullOrEmpty(token))
            return null;
        using var conn = Database.Open();
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // 1. Try admins
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
                SELECT a.* FROM sessions s
                INNER JOIN admins a ON a.id = s.user_id
                WHERE s.token = @token AND s.expires_at > @now
                LIMIT 1
                """;
            cmd.Parameters.AddWithValue("@token", token);
            cmd.Parameters.AddWithValue("@now", now);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapAdmin(r);
        }

        // 2. Try faculty
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
                SELECT f.* FROM sessions s
                INNER JOIN faculty f ON f.id = s.user_id
                WHERE s.token = @token AND s.expires_at > @now
                LIMIT 1
                """;
            cmd.Parameters.AddWithValue("@token", token);
            cmd.Parameters.AddWithValue("@now", now);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapFaculty(r);
        }

        // 3. Try students
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
                SELECT st.* FROM sessions s
                INNER JOIN students st ON st.id = s.user_id
                WHERE s.token = @token AND s.expires_at > @now
                LIMIT 1
                """;
            cmd.Parameters.AddWithValue("@token", token);
            cmd.Parameters.AddWithValue("@now", now);
            using var r = cmd.ExecuteReader();
            if (r.Read()) return UserDto.MapStudent(r);
        }

        return null;
    }

    public static void ClearSession(HttpRequest request)
    {
        if (!request.Cookies.TryGetValue(SessionCookie, out var token) || string.IsNullOrEmpty(token))
            return;
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM sessions WHERE token = @token", ("@token", token));
    }

    /// <summary>Fetches a user row by id and role across admins, faculty, and students tables.</summary>
    public static UserRow? GetUserRow(MySqlConnection conn, long id, string role = "student")
    {
        string table = role switch
        {
            "admin" => "admins",
            "faculty" => "faculty",
            _ => "students"
        };

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = $"SELECT id, name, email, '{role}' AS role, password_hash, status FROM {table} WHERE id = @id LIMIT 1";
            cmd.Parameters.AddWithValue("@id", id);
            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
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
        }

        return null;
    }
}
