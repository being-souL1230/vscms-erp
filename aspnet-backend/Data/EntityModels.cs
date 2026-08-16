using System.Data.Common;
using System.Globalization;
using System.Text.Json;

namespace VscmsErp.Api.Data;

/// <summary>Null-safe row readers for SQLite columns (INTEGER comes back as Int64).</summary>
public static class Row
{
    public static long L(DbDataReader r, string col) => (long)r[col];
    public static long? NL(DbDataReader r, string col) => r[col] is DBNull ? null : (long)r[col];
    public static string S(DbDataReader r, string col) => (string)r[col];
    public static string? NS(DbDataReader r, string col) => r[col] is DBNull ? null : (string)r[col];
}

/// <summary>Lenient JSON helpers for request bodies that arrive as arrays or objects.</summary>
public static class J
{
    public static string? GetString(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) && v.ValueKind is JsonValueKind.String or JsonValueKind.Number
            ? v.ToString()
            : null;

    public static long? GetLong(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) && long.TryParse(v.ToString(), NumberStyles.Any, CultureInfo.InvariantCulture, out var n)
            ? n
            : null;

    public static double? GetDouble(JsonElement el, string name) =>
        el.TryGetProperty(name, out var v) && double.TryParse(v.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var n)
            ? n
            : null;
}

/// <summary>
/// Attendance row, mirroring the JSON shape of src/db/schema.ts (camelCase).
/// </summary>
public class AttendanceDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public long CourseId { get; set; }
    public string CourseCode { get; set; } = "";
    public string Date { get; set; } = "";
    public string Status { get; set; } = "present";
    public string Period { get; set; } = "Lecture 1";
    public string? MarkedBy { get; set; }
    public string CreatedAt { get; set; } = "";

    public static AttendanceDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        CourseId = Row.L(r, "course_id"),
        CourseCode = Row.S(r, "course_code"),
        Date = Row.S(r, "date"),
        Status = Row.S(r, "status"),
        Period = Row.S(r, "period"),
        MarkedBy = Row.NS(r, "marked_by"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

/// <summary>Grade row (src/db/schema.ts grades table).</summary>
public class GradeDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public long CourseId { get; set; }
    public string CourseName { get; set; } = "";
    public string ExamType { get; set; } = "Midterm";
    public string MarksObtained { get; set; } = "";
    public string MaxMarks { get; set; } = "100";
    public string GradeLetter { get; set; } = "A";
    public long Semester { get; set; } = 1;
    public string Remarks { get; set; } = "";
    public string CreatedAt { get; set; } = "";

    public static GradeDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        CourseId = Row.L(r, "course_id"),
        CourseName = Row.S(r, "course_name"),
        ExamType = Row.S(r, "exam_type"),
        MarksObtained = Row.S(r, "marks_obtained"),
        MaxMarks = Row.S(r, "max_marks"),
        GradeLetter = Row.S(r, "grade_letter"),
        Semester = Row.L(r, "semester"),
        Remarks = Row.S(r, "remarks"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

/// <summary>Fee invoice row (src/db/schema.ts fee_records table).</summary>
public class FeeRecordDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string RollNo { get; set; } = "";
    public string FeeType { get; set; } = "";
    public string Amount { get; set; } = "";
    public string DueDate { get; set; } = "";
    public string? PaidDate { get; set; }
    public string Status { get; set; } = "pending";
    public string? ReceiptNumber { get; set; }
    public string? PaymentMethod { get; set; }
    public string? CourseCode { get; set; }
    public string? CourseName { get; set; }
    public long? Semester { get; set; }
    public string PaidAmount { get; set; } = "0";
    public string? CollectedBy { get; set; }
    public string? CollectedAt { get; set; }
    public string CreatedAt { get; set; } = "";

    public static FeeRecordDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        RollNo = Row.S(r, "roll_no"),
        FeeType = Row.S(r, "fee_type"),
        Amount = Row.S(r, "amount"),
        DueDate = Row.S(r, "due_date"),
        PaidDate = Row.NS(r, "paid_date"),
        Status = Row.S(r, "status"),
        ReceiptNumber = Row.NS(r, "receipt_number"),
        PaymentMethod = Row.NS(r, "payment_method"),
        CourseCode = Row.NS(r, "course_code"),
        CourseName = Row.NS(r, "course_name"),
        Semester = Row.NL(r, "semester"),
        PaidAmount = Row.S(r, "paid_amount"),
        CollectedBy = Row.NS(r, "collected_by"),
        CollectedAt = Row.NS(r, "collected_at"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

/// <summary>Payment history row (src/db/schema.ts fee_payments table).</summary>
public class FeePaymentDto
{
    public long Id { get; set; }
    public long FeeRecordId { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string Amount { get; set; } = "";
    public string PaymentMethod { get; set; } = "";
    public string ReceiptNumber { get; set; } = "";
    public string PaidAt { get; set; } = "";
    public string? CollectedBy { get; set; }
    public long? CollectedById { get; set; }
    public string CreatedAt { get; set; } = "";

    public static FeePaymentDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        FeeRecordId = Row.L(r, "fee_record_id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        Amount = Row.S(r, "amount"),
        PaymentMethod = Row.S(r, "payment_method"),
        ReceiptNumber = Row.S(r, "receipt_number"),
        PaidAt = Row.S(r, "paid_at"),
        CollectedBy = Row.NS(r, "collected_by"),
        CollectedById = Row.NL(r, "collected_by_id"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

/// <summary>Internal marks row (src/db/schema.ts internal_marks table).</summary>
public class InternalMarkDto
{
    public long Id { get; set; }
    public long StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public long CourseId { get; set; }
    public string CourseCode { get; set; } = "";
    public string CourseName { get; set; } = "";
    public string ExamType { get; set; } = "Mid-Term";
    public long Semester { get; set; } = 1;
    public string TheoryMarks { get; set; } = "0";
    public string PracticalMarks { get; set; } = "0";
    public string MaxTheory { get; set; } = "30";
    public string MaxPractical { get; set; } = "20";
    public string TotalMarks { get; set; } = "";
    public string MaxTotal { get; set; } = "";
    public string PassMarks { get; set; } = "";
    public string GradeLetter { get; set; } = "";
    public string Result { get; set; } = "pass";
    public string Status { get; set; } = "draft";
    public string? Remarks { get; set; }
    public string CreatedAt { get; set; } = "";

    public static InternalMarkDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        StudentId = Row.L(r, "student_id"),
        StudentName = Row.S(r, "student_name"),
        CourseId = Row.L(r, "course_id"),
        CourseCode = Row.S(r, "course_code"),
        CourseName = Row.S(r, "course_name"),
        ExamType = Row.S(r, "exam_type"),
        Semester = Row.L(r, "semester"),
        TheoryMarks = Row.S(r, "theory_marks"),
        PracticalMarks = Row.S(r, "practical_marks"),
        MaxTheory = Row.S(r, "max_theory"),
        MaxPractical = Row.S(r, "max_practical"),
        TotalMarks = Row.S(r, "total_marks"),
        MaxTotal = Row.S(r, "max_total"),
        PassMarks = Row.S(r, "pass_marks"),
        GradeLetter = Row.S(r, "grade_letter"),
        Result = Row.S(r, "result"),
        Status = Row.S(r, "status"),
        Remarks = Row.NS(r, "remarks"),
        CreatedAt = Row.S(r, "created_at"),
    };
}
