using System.Data.Common;

namespace VscmsErp.Api.Data;

/// <summary>
/// Public user shape, mirroring publicUser() in src/lib/auth.ts.
/// Property names are PascalCase here; ASP.NET Core serializes them as
/// camelCase, which is exactly what the Next.js frontend expects
/// (rollNo, rollNoOrEmpId, avatarUrl, createdAt, ...). passwordHash is never exposed.
/// </summary>
public class UserDto
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "student";
    public string? SubRole { get; set; }
    public string RollNo { get; set; } = "";
    public string RollNoOrEmpId { get; set; } = "";
    public string Department { get; set; } = "";
    public long? Semester { get; set; }
    public string? Designation { get; set; }
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Gpa { get; set; }
    public string Status { get; set; } = "active";
    public string CreatedAt { get; set; } = "";

    public static UserDto MapUser(DbDataReader r) => new()
    {
        Id = (long)r["id"],
        Name = (string)r["name"],
        Email = (string)r["email"],
        Role = (string)r["role"],
        SubRole = HasColumn(r, "sub_role") && !(r["sub_role"] is DBNull) ? (string)r["sub_role"] : null,
        RollNo = (string)r["roll_no_or_emp_id"],
        RollNoOrEmpId = (string)r["roll_no_or_emp_id"],
        Department = (string)r["department"],
        Semester = r["semester"] is DBNull ? null : (long)r["semester"],
        Designation = r["designation"] is DBNull ? null : (string)r["designation"],
        Phone = r["phone"] is DBNull ? null : (string)r["phone"],
        AvatarUrl = r["avatar_url"] is DBNull ? null : (string)r["avatar_url"],
        Gpa = r["gpa"] is DBNull ? null : (string)r["gpa"],
        Status = (string)r["status"],
        CreatedAt = (string)r["created_at"],
    };

    private static bool HasColumn(DbDataReader r, string columnName)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (r.GetName(i).Equals(columnName, StringComparison.OrdinalIgnoreCase))
                return true;
        return false;
    }
}

/// <summary>Minimal user row (id, password hash) used by the auth service.</summary>
public class UserRow
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "student";
    public string PasswordHash { get; set; } = "";
    public string Status { get; set; } = "active";
}
