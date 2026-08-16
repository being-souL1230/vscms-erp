using Npgsql;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Auth;

/// <summary>
/// Role-based access check mirroring can() in src/lib/permissions.ts.
/// Admin is always fully allowed; other roles are looked up in the
/// permissions matrix and fail closed when no row exists.
/// </summary>
public static class Permissions
{
    public static bool Can(NpgsqlConnection conn, UserDto user, string module, string action)
    {
        if (user.Role == "admin") return true;

        var column = action switch
        {
            "view" => "can_view",
            "create" => "can_create",
            "edit" => "can_edit",
            "delete" => "can_delete",
            _ => throw new ArgumentOutOfRangeException(nameof(action), action, null),
        };

        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"SELECT {column} FROM permissions WHERE role = @role AND module = @module LIMIT 1";
        cmd.Parameters.AddWithValue("@role", user.Role);
        cmd.Parameters.AddWithValue("@module", module);
        var value = cmd.ExecuteScalar();
        return value is not null && value is not DBNull && Convert.ToInt64(value) == 1;
    }

    /// <summary>
    /// Mirrors ownsCourse() in the Next.js routes: true when the course exists
    /// and is assigned to this user (by faculty id or faculty name).
    /// </summary>
    public static bool OwnsCourse(NpgsqlConnection conn, UserDto user, long courseId)
    {
        if (courseId == 0) return false;
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT faculty_id, faculty_name FROM courses WHERE id = @id LIMIT 1";
        cmd.Parameters.AddWithValue("@id", courseId);
        using var reader = cmd.ExecuteReader();
        if (!reader.Read()) return false;
        var facultyId = reader["faculty_id"] is DBNull ? null : (long?)reader["faculty_id"];
        var facultyName = reader["faculty_name"] is DBNull ? null : (string?)reader["faculty_name"];
        return facultyId == user.Id || facultyName == user.Name;
    }
}
