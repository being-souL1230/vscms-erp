using static BCrypt.Net.BCrypt;
using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Admin & profile endpoints ported from:
/// permissions/route.ts (admin-only access matrix),
/// profile/route.ts (self-service contact update),
/// users/route.ts (user role/status/password management).
/// </summary>
public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapPermissionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListPermissions);
        app.MapPut("/", SavePermissions);
        return app;
    }

    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPut("/", UpdateProfile);
        return app;
    }

    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListUsers);
        app.MapPut("/", UpdateUser);
        return app;
    }

    // ---- permissions ----

    private static IResult ListPermissions(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM permissions";
        using var reader = cmd.ExecuteReader();
        var list = new List<PermissionDto>();
        while (reader.Read()) list.Add(PermissionDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult SavePermissions(HttpContext ctx, PermissionRow[] rows)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        if (rows is not { Length: > 0 })
            return Results.Json(new { error = "Permission rows are required" }, statusCode: 400);

        using var conn = Database.Open();
        using var tx = conn.BeginTransaction();
        using (var del = conn.CreateCommand())
        {
            del.Transaction = tx;
            del.CommandText = "DELETE FROM permissions";
            del.ExecuteNonQuery();
        }
        foreach (var r in rows)
        {
            using var ins = conn.CreateCommand();
            ins.Transaction = tx;
            ins.CommandText = """
                INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete)
                VALUES (@role, @module, @view, @create, @edit, @delete)
                """;
            ins.Parameters.AddWithValue("@role", r.Role ?? "");
            ins.Parameters.AddWithValue("@module", r.Module ?? "");
            ins.Parameters.AddWithValue("@view", r.CanView is > 0 ? 1 : 0);
            ins.Parameters.AddWithValue("@create", r.CanCreate is > 0 ? 1 : 0);
            ins.Parameters.AddWithValue("@edit", r.CanEdit is > 0 ? 1 : 0);
            ins.Parameters.AddWithValue("@delete", r.CanDelete is > 0 ? 1 : 0);
            ins.ExecuteNonQuery();
        }
        tx.Commit();
        return Results.Json(new { success = true });
    }

    // ---- profile ----

    private static IResult UpdateProfile(HttpContext ctx, ProfileRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        var sets = new List<(string Column, string Param, object? Value)>();
        if (body.Phone is not null) sets.Add(("phone", "@phone", (object?)body.Phone));
        if (body.AvatarUrl is not null) sets.Add(("avatar_url", "@avatarUrl", (object?)body.AvatarUrl));
        if (body.Designation is not null && user.Role == "faculty") sets.Add(("designation", "@designation", (object?)body.Designation));
        if (sets.Count == 0)
            return Results.Json(new { error = "Nothing to update" }, statusCode: 400);

        string table = user.Role switch { "admin" => "admins", "faculty" => "faculty", _ => "students" };
        var sql = $"UPDATE {table} SET " + string.Join(", ", sets.Select(s => $"{s.Column} = {s.Param}")) + " WHERE id = @id";
        var parameters = sets.Select(s => (s.Param, s.Value)).Append(("@id", (object?)user.Id)).ToArray();
        Database.Exec(conn, sql, parameters);

        return Results.Json(LoadUser(conn, user.Id, user.Role));
    }

    // ---- users ----

    private static IResult ListUsers(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "users", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var list = new List<UserDto>();

        // 1. Admins
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM admins";
            using var r = cmd.ExecuteReader();
            while (r.Read()) list.Add(UserDto.MapAdmin(r));
        }
        catch { }

        // 2. Faculty
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM faculty";
            using var r = cmd.ExecuteReader();
            while (r.Read()) list.Add(UserDto.MapFaculty(r));
        }
        catch { }

        // 3. Students
        try
        {
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "SELECT * FROM students";
            using var r = cmd.ExecuteReader();
            while (r.Read()) list.Add(UserDto.MapStudent(r));
        }
        catch { }

        return Results.Json(list);
    }

    private static IResult UpdateUser(HttpContext ctx, UserUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "User ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "users", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var sets = new List<(string Column, string Param, object? Value)>();
        if (body.Status is "active" or "inactive") sets.Add(("status", "@status", (object?)body.Status));
        if (!string.IsNullOrEmpty(body.Password) && body.Password.Length >= 6)
            sets.Add(("password_hash", "@passwordHash", (object?)HashPassword(body.Password, 12)));
        if (sets.Count == 0)
            return Results.Json(new { error = "Nothing to update" }, statusCode: 400);

        string targetTable = (body.Role ?? "student") switch
        {
            "admin" => "admins",
            "faculty" => "faculty",
            _ => "students"
        };

        var sql = $"UPDATE {targetTable} SET " + string.Join(", ", sets.Select(s => $"{s.Column} = {s.Param}")) + " WHERE id = @id";
        var parameters = sets.Select(s => (s.Param, s.Value)).Append(("@id", (object?)body.Id.Value)).ToArray();
        Database.Exec(conn, sql, parameters);

        var updated = LoadUser(conn, body.Id.Value, body.Role ?? "student");
        if (updated is null) return Results.Json(new { error = "User not found" }, statusCode: 404);
        return Results.Json(updated);
    }

    // ---- helpers ----

    private static UserDto? LoadUser(MySqlConnection conn, long id, string role = "student")
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

        return null;
    }

    // ---- request bodies ----

    public sealed record PermissionRow(string? Role, string? Module, long? CanView, long? CanCreate, long? CanEdit, long? CanDelete);
    public sealed record ProfileRequest(string? Phone, string? AvatarUrl, string? Designation);
    public sealed record UserUpdateRequest(long? Id, string? Role, string? Status, string? Password);
}
