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

    public static UserDto MapStudent(DbDataReader r) => new()
    {
        Id = Convert.ToInt64(r["id"]),
        Name = r["name"]?.ToString() ?? "",
        Email = r["email"]?.ToString() ?? "",
        Role = "student",
        SubRole = null,
        RollNo = HasColumn(r, "roll_no") ? r["roll_no"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        RollNoOrEmpId = HasColumn(r, "roll_no") ? r["roll_no"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        Department = r["department"]?.ToString() ?? "",
        Semester = HasColumn(r, "semester") && !(r["semester"] is DBNull) ? Convert.ToInt64(r["semester"]) : null,
        Designation = null,
        Phone = HasColumn(r, "phone") && !(r["phone"] is DBNull) ? r["phone"]?.ToString() : null,
        AvatarUrl = HasColumn(r, "avatar_url") && !(r["avatar_url"] is DBNull) ? r["avatar_url"]?.ToString() : null,
        Gpa = HasColumn(r, "gpa") && !(r["gpa"] is DBNull) ? r["gpa"]?.ToString() : null,
        Status = HasColumn(r, "status") && !(r["status"] is DBNull) ? r["status"]?.ToString() ?? "active" : "active",
        CreatedAt = HasColumn(r, "created_at") && !(r["created_at"] is DBNull) ? r["created_at"]?.ToString() ?? "" : "",
    };

    public static UserDto MapFaculty(DbDataReader r) => new()
    {
        Id = Convert.ToInt64(r["id"]),
        Name = r["name"]?.ToString() ?? "",
        Email = r["email"]?.ToString() ?? "",
        Role = "faculty",
        SubRole = HasColumn(r, "sub_role") && !(r["sub_role"] is DBNull) ? r["sub_role"]?.ToString() : "teacher",
        RollNo = HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        RollNoOrEmpId = HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        Department = r["department"]?.ToString() ?? "",
        Semester = null,
        Designation = HasColumn(r, "designation") && !(r["designation"] is DBNull) ? r["designation"]?.ToString() : null,
        Phone = HasColumn(r, "phone") && !(r["phone"] is DBNull) ? r["phone"]?.ToString() : null,
        AvatarUrl = HasColumn(r, "avatar_url") && !(r["avatar_url"] is DBNull) ? r["avatar_url"]?.ToString() : null,
        Gpa = null,
        Status = HasColumn(r, "status") && !(r["status"] is DBNull) ? r["status"]?.ToString() ?? "active" : "active",
        CreatedAt = HasColumn(r, "created_at") && !(r["created_at"] is DBNull) ? r["created_at"]?.ToString() ?? "" : "",
    };

    public static UserDto MapAdmin(DbDataReader r) => new()
    {
        Id = Convert.ToInt64(r["id"]),
        Name = r["name"]?.ToString() ?? "",
        Email = r["email"]?.ToString() ?? "",
        Role = "admin",
        SubRole = HasColumn(r, "sub_role") && !(r["sub_role"] is DBNull) ? r["sub_role"]?.ToString() : "dean",
        RollNo = HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        RollNoOrEmpId = HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : ""),
        Department = r["department"]?.ToString() ?? "",
        Semester = null,
        Designation = HasColumn(r, "designation") && !(r["designation"] is DBNull) ? r["designation"]?.ToString() : null,
        Phone = HasColumn(r, "phone") && !(r["phone"] is DBNull) ? r["phone"]?.ToString() : null,
        AvatarUrl = HasColumn(r, "avatar_url") && !(r["avatar_url"] is DBNull) ? r["avatar_url"]?.ToString() : null,
        Gpa = null,
        Status = HasColumn(r, "status") && !(r["status"] is DBNull) ? r["status"]?.ToString() ?? "active" : "active",
        CreatedAt = HasColumn(r, "created_at") && !(r["created_at"] is DBNull) ? r["created_at"]?.ToString() ?? "" : "",
    };

    public static UserDto MapUser(DbDataReader r) => new()
    {
        Id = Convert.ToInt64(r["id"]),
        Name = r["name"]?.ToString() ?? "",
        Email = r["email"]?.ToString() ?? "",
        Role = HasColumn(r, "role") ? r["role"]?.ToString() ?? "student" : "student",
        SubRole = HasColumn(r, "sub_role") && !(r["sub_role"] is DBNull) ? r["sub_role"]?.ToString() : null,
        RollNo = HasColumn(r, "roll_no") ? r["roll_no"]?.ToString() ?? "" : (HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : "")),
        RollNoOrEmpId = HasColumn(r, "roll_no") ? r["roll_no"]?.ToString() ?? "" : (HasColumn(r, "emp_id") ? r["emp_id"]?.ToString() ?? "" : (HasColumn(r, "roll_no_or_emp_id") ? r["roll_no_or_emp_id"]?.ToString() ?? "" : "")),
        Department = r["department"]?.ToString() ?? "",
        Semester = HasColumn(r, "semester") && !(r["semester"] is DBNull) ? Convert.ToInt64(r["semester"]) : null,
        Designation = HasColumn(r, "designation") && !(r["designation"] is DBNull) ? r["designation"]?.ToString() : null,
        Phone = HasColumn(r, "phone") && !(r["phone"] is DBNull) ? r["phone"]?.ToString() : null,
        AvatarUrl = HasColumn(r, "avatar_url") && !(r["avatar_url"] is DBNull) ? r["avatar_url"]?.ToString() : null,
        Gpa = HasColumn(r, "gpa") && !(r["gpa"] is DBNull) ? r["gpa"]?.ToString() : null,
        Status = HasColumn(r, "status") && !(r["status"] is DBNull) ? r["status"]?.ToString() ?? "active" : "active",
        CreatedAt = HasColumn(r, "created_at") && !(r["created_at"] is DBNull) ? r["created_at"]?.ToString() ?? "" : "",
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
