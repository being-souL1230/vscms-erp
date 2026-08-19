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
        Id = Convert.ToInt64(r["id"]),
        Name = r["name"]?.ToString() ?? "",
        Email = r["email"]?.ToString() ?? "",
        Role = r["role"]?.ToString() ?? "student",
        SubRole = HasColumn(r, "sub_role") && !(r["sub_role"] is DBNull) ? r["sub_role"]?.ToString() : null,
        RollNo = r["roll_no_or_emp_id"]?.ToString() ?? "",
        RollNoOrEmpId = r["roll_no_or_emp_id"]?.ToString() ?? "",
        Department = r["department"]?.ToString() ?? "",
        Semester = r["semester"] is DBNull || r["semester"] == null ? null : Convert.ToInt64(r["semester"]),
        Designation = r["designation"] is DBNull || r["designation"] == null ? null : r["designation"]?.ToString(),
        Phone = r["phone"] is DBNull || r["phone"] == null ? null : r["phone"]?.ToString(),
        AvatarUrl = r["avatar_url"] is DBNull || r["avatar_url"] == null ? null : r["avatar_url"]?.ToString(),
        Gpa = r["gpa"] is DBNull || r["gpa"] == null ? null : r["gpa"]?.ToString(),
        Status = r["status"]?.ToString() ?? "active",
        CreatedAt = r["created_at"] is DBNull || r["created_at"] == null ? "" : r["created_at"]?.ToString() ?? "",
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
