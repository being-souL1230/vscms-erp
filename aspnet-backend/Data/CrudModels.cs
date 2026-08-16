using System.Data.Common;

namespace VscmsErp.Api.Data;

public class CourseDto
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Department { get; set; } = "";
    public long Credits { get; set; } = 3;
    public long Semester { get; set; } = 1;
    public long? FacultyId { get; set; }
    public string? FacultyName { get; set; }
    public string? Room { get; set; }
    public string? Schedule { get; set; }
    public string? Description { get; set; }

    public static CourseDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Code = Row.S(r, "code"),
        Name = Row.S(r, "name"),
        Department = Row.S(r, "department"),
        Credits = Row.L(r, "credits"),
        Semester = Row.L(r, "semester"),
        FacultyId = Row.NL(r, "faculty_id"),
        FacultyName = Row.NS(r, "faculty_name"),
        Room = Row.NS(r, "room"),
        Schedule = Row.NS(r, "schedule"),
        Description = Row.NS(r, "description"),
    };
}

public class DepartmentDto
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string HeadOfDepartment { get; set; } = "";
    public string? Location { get; set; }
    public long StudentCount { get; set; }
    public long FacultyCount { get; set; }

    public static DepartmentDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Code = Row.S(r, "code"),
        Name = Row.S(r, "name"),
        HeadOfDepartment = Row.S(r, "head_of_department"),
        Location = Row.NS(r, "location"),
        StudentCount = Row.L(r, "student_count"),
        FacultyCount = Row.L(r, "faculty_count"),
    };
}

public class NoticeDto
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Category { get; set; } = "Academic";
    public string Priority { get; set; } = "normal";
    public string AuthorName { get; set; } = "Administration Office";
    public string PublishedDate { get; set; } = "";
    public string CreatedAt { get; set; } = "";

    public static NoticeDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Title = Row.S(r, "title"),
        Content = Row.S(r, "content"),
        Category = Row.S(r, "category"),
        Priority = Row.S(r, "priority"),
        AuthorName = Row.S(r, "author_name"),
        PublishedDate = Row.S(r, "published_date"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class TimetableSlotDto
{
    public long Id { get; set; }
    public string CourseCode { get; set; } = "";
    public string CourseName { get; set; } = "";
    public string Department { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string DayOfWeek { get; set; } = "";
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string Room { get; set; } = "";
    public string FacultyName { get; set; } = "";

    public static TimetableSlotDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CourseCode = Row.S(r, "course_code"),
        CourseName = Row.S(r, "course_name"),
        Department = Row.S(r, "department"),
        Semester = Row.L(r, "semester"),
        DayOfWeek = Row.S(r, "day_of_week"),
        StartTime = Row.S(r, "start_time"),
        EndTime = Row.S(r, "end_time"),
        Room = Row.S(r, "room"),
        FacultyName = Row.S(r, "faculty_name"),
    };
}

public class LeaveRequestDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string RollNo { get; set; } = "";
    public string Department { get; set; } = "";
    public string FromDate { get; set; } = "";
    public string ToDate { get; set; } = "";
    public string Reason { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string? ReviewedBy { get; set; }
    public string? ReviewedAt { get; set; }
    public string? Remarks { get; set; }
    public string CreatedAt { get; set; } = "";

    public static LeaveRequestDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        RollNo = Row.S(r, "roll_no"),
        Department = Row.S(r, "department"),
        FromDate = Row.S(r, "from_date"),
        ToDate = Row.S(r, "to_date"),
        Reason = Row.S(r, "reason"),
        Status = Row.S(r, "status"),
        ReviewedBy = Row.NS(r, "reviewed_by"),
        ReviewedAt = Row.NS(r, "reviewed_at"),
        Remarks = Row.NS(r, "remarks"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class SectionDto
{
    public long Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Department { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string? Room { get; set; }

    public static SectionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Code = Row.S(r, "code"),
        Name = Row.S(r, "name"),
        Department = Row.S(r, "department"),
        Semester = Row.L(r, "semester"),
        Room = Row.NS(r, "room"),
    };
}

public class SemesterInfoDto
{
    public long Id { get; set; }
    public long Number { get; set; }
    public string Name { get; set; } = "";
    public string Department { get; set; } = "";
    public string Status { get; set; } = "inactive";
    public string? StartsOn { get; set; }
    public string? EndsOn { get; set; }

    public static SemesterInfoDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Number = Row.L(r, "number"),
        Name = Row.S(r, "name"),
        Department = Row.S(r, "department"),
        Status = Row.S(r, "status"),
        StartsOn = Row.NS(r, "starts_on"),
        EndsOn = Row.NS(r, "ends_on"),
    };
}

public class AcademicSessionDto
{
    public long Id { get; set; }
    public string Name { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public long IsCurrent { get; set; }

    public static AcademicSessionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Name = Row.S(r, "name"),
        StartDate = Row.S(r, "start_date"),
        EndDate = Row.S(r, "end_date"),
        IsCurrent = Row.L(r, "is_current"),
    };
}
