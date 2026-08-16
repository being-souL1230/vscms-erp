using System.Data.Common;

namespace VscmsErp.Api.Data;

public class AssignmentDto
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public string CourseName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string DueDate { get; set; } = "";
    public long MaxMarks { get; set; } = 50;
    public string FacultyName { get; set; } = "";
    public string CreatedAt { get; set; } = "";

    public static AssignmentDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CourseId = Row.L(r, "course_id"),
        CourseName = Row.S(r, "course_name"),
        Title = Row.S(r, "title"),
        Description = Row.S(r, "description"),
        DueDate = Row.S(r, "due_date"),
        MaxMarks = Row.L(r, "max_marks"),
        FacultyName = Row.S(r, "faculty_name"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class AssignmentSubmissionDto
{
    public long Id { get; set; }
    public long AssignmentId { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string? SubmissionText { get; set; }
    public string? FileUrl { get; set; }
    public string Status { get; set; } = "submitted";
    public string? Marks { get; set; }
    public string? Feedback { get; set; }
    public string SubmittedAt { get; set; } = "";

    public static AssignmentSubmissionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        AssignmentId = Row.L(r, "assignment_id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        SubmissionText = Row.NS(r, "submission_text"),
        FileUrl = Row.NS(r, "file_url"),
        Status = Row.S(r, "status"),
        Marks = Row.NS(r, "marks"),
        Feedback = Row.NS(r, "feedback"),
        SubmittedAt = Row.S(r, "submitted_at"),
    };
}

public class ExamDefinitionDto
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string ExamType { get; set; } = "Mid-Term";
    public string Department { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string Session { get; set; } = "2025-26";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public string Status { get; set; } = "scheduled";
    public long PassingPercent { get; set; } = 40;
    public string CreatedAt { get; set; } = "";

    public static ExamDefinitionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Name = Row.S(r, "name"),
        ExamType = Row.S(r, "exam_type"),
        Department = Row.S(r, "department"),
        Semester = Row.L(r, "semester"),
        Session = Row.S(r, "session"),
        StartDate = Row.S(r, "start_date"),
        EndDate = Row.S(r, "end_date"),
        Status = Row.S(r, "status"),
        PassingPercent = Row.L(r, "passing_percent"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class PermissionDto
{
    public long Id { get; set; }
    public string Role { get; set; } = "";
    public string Module { get; set; } = "";
    public long CanView { get; set; }
    public long CanCreate { get; set; }
    public long CanEdit { get; set; }
    public long CanDelete { get; set; }

    public static PermissionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Role = Row.S(r, "role"),
        Module = Row.S(r, "module"),
        CanView = Row.L(r, "can_view"),
        CanCreate = Row.L(r, "can_create"),
        CanEdit = Row.L(r, "can_edit"),
        CanDelete = Row.L(r, "can_delete"),
    };
}
