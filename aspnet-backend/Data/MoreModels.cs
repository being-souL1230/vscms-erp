using System.Data.Common;

namespace VscmsErp.Api.Data;

public class AdmissionDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string AdmissionNumber { get; set; } = "";
    public string AdmissionDate { get; set; } = "";
    public string Category { get; set; } = "General";
    public string? PreviousInstitution { get; set; }
    public string? FatherName { get; set; }
    public string? MotherName { get; set; }
    public string? GuardianPhone { get; set; }
    public string? BloodGroup { get; set; }
    public string? Address { get; set; }
    public long IsHosteler { get; set; }
    public string CreatedAt { get; set; } = "";

    public static AdmissionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        AdmissionNumber = Row.S(r, "admission_number"),
        AdmissionDate = Row.S(r, "admission_date"),
        Category = Row.S(r, "category"),
        PreviousInstitution = Row.NS(r, "previous_institution"),
        FatherName = Row.NS(r, "father_name"),
        MotherName = Row.NS(r, "mother_name"),
        GuardianPhone = Row.NS(r, "guardian_phone"),
        BloodGroup = Row.NS(r, "blood_group"),
        Address = Row.NS(r, "address"),
        IsHosteler = Row.L(r, "is_hosteler"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class DocumentDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string Title { get; set; } = "";
    public string Category { get; set; } = "Other";
    public string FileName { get; set; } = "";
    public string MimeType { get; set; } = "application/octet-stream";
    public long FileSize { get; set; }
    public string Data { get; set; } = "";
    public string Status { get; set; } = "pending";
    public string UploadedAt { get; set; } = "";

    public static DocumentDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        Title = Row.S(r, "title"),
        Category = Row.S(r, "category"),
        FileName = Row.S(r, "file_name"),
        MimeType = Row.S(r, "mime_type"),
        FileSize = Row.L(r, "file_size"),
        Data = Row.S(r, "data"),
        Status = Row.S(r, "status"),
        UploadedAt = Row.S(r, "uploaded_at"),
    };
}

public class ExamScheduleDto
{
    public long Id { get; set; }
    public string ExamType { get; set; } = "";
    public string CourseCode { get; set; } = "";
    public string CourseName { get; set; } = "";
    public string Department { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string ExamDate { get; set; } = "";
    public string StartTime { get; set; } = "";
    public string EndTime { get; set; } = "";
    public string Room { get; set; } = "";

    public static ExamScheduleDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        ExamType = Row.S(r, "exam_type"),
        CourseCode = Row.S(r, "course_code"),
        CourseName = Row.S(r, "course_name"),
        Department = Row.S(r, "department"),
        Semester = Row.L(r, "semester"),
        ExamDate = Row.S(r, "exam_date"),
        StartTime = Row.S(r, "start_time"),
        EndTime = Row.S(r, "end_time"),
        Room = Row.S(r, "room"),
    };
}

public class EnrollmentDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public long CourseId { get; set; }
    public string CourseCode { get; set; } = "";
    public string CourseName { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string Status { get; set; } = "active";

    public static EnrollmentDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        CourseId = Row.L(r, "course_id"),
        CourseCode = Row.S(r, "course_code"),
        CourseName = Row.S(r, "course_name"),
        Semester = Row.L(r, "semester"),
        Status = Row.S(r, "status"),
    };
}

public class FeeStructureDto
{
    public long Id { get; set; }
    public string CourseCode { get; set; } = "";
    public string CourseName { get; set; } = "";
    public long Semester { get; set; } = 1;
    public string FeeType { get; set; } = "";
    public string Amount { get; set; } = "";
    public string DueDate { get; set; } = "";
    public string CreatedAt { get; set; } = "";

    public static FeeStructureDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CourseCode = Row.S(r, "course_code"),
        CourseName = Row.S(r, "course_name"),
        Semester = Row.L(r, "semester"),
        FeeType = Row.S(r, "fee_type"),
        Amount = Row.S(r, "amount"),
        DueDate = Row.S(r, "due_date"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class FacultyAttendanceDto
{
    public long Id { get; set; }
    public long FacultyId { get; set; }
    public string FacultyName { get; set; } = "";
    public string Date { get; set; } = "";
    public string Status { get; set; } = "present";
    public string? MarkedBy { get; set; }
    public string CreatedAt { get; set; } = "";

    public static FacultyAttendanceDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        FacultyId = Row.L(r, "faculty_id"),
        FacultyName = Row.S(r, "faculty_name"),
        Date = Row.S(r, "date"),
        Status = Row.S(r, "status"),
        MarkedBy = Row.NS(r, "marked_by"),
        CreatedAt = Row.S(r, "created_at"),
    };
}
