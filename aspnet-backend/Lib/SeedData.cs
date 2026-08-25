namespace VscmsErp.Api.Lib;

/// <summary>
/// Clean database seed configuration with strictly 1 Admin user and no dummy data.
/// </summary>
public static class SeedData
{
    public sealed record SeedUser(
        string Name, string Email, string Role, string RollNo, string Department,
        long? Semester, string? Designation, string Phone, string AvatarUrl, string? Gpa, string Status, string? SubRole = null);

    public static readonly SeedUser[] InitialUsers =
    [
        new("Prof. (Dr.) Gauri Singh Gaur", "director@vscms.edu", "admin", "1", "Office of the Director", null,
            "Director & Dean, VSCMS", "+91 11 4011 9001",
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80", null, "active", "dean")
    ];

    public sealed record SeedDepartment(string Code, string Name, string Head, string Location, long Students, long Faculty);

    public static readonly SeedDepartment[] InitialDepartments = [];

    public sealed record SeedCourse(
        string Code, string Name, string Department, long Credits, long Semester,
        string FacultyName, string Room, string Schedule, string Description);

    public static readonly SeedCourse[] InitialCourses = [];

    public sealed record SeedNotice(string Title, string Content, string Category, string Priority, string Author, string PublishedDate);

    public static readonly SeedNotice[] InitialNotices = [];
}
