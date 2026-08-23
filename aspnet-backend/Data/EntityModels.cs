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
    public static double D(DbDataReader r, string col) => Convert.ToDouble(r[col]);
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

public class CompetitionDto
{
    public long Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Type { get; set; } = "Hackathon";
    public string RegStart { get; set; } = "";
    public string RegEnd { get; set; } = "";
    public string CompDate { get; set; } = "";
    public long TeamSizeMin { get; set; } = 1;
    public long TeamSizeMax { get; set; } = 4;
    public string EligibilityDept { get; set; } = "All Departments";
    public string? Rules { get; set; }
    public string? ProblemStatements { get; set; }
    public string SubmissionDeadline { get; set; } = "";
    public string? EvaluationCriteria { get; set; }
    public string? Prizes { get; set; }
    public long IsLeaderboardPublished { get; set; } = 0;
    public string Status { get; set; } = "open";
    public string CreatedAt { get; set; } = "";

    public static CompetitionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        Title = Row.S(r, "title"),
        Description = Row.S(r, "description"),
        Type = Row.S(r, "type"),
        RegStart = Row.S(r, "reg_start"),
        RegEnd = Row.S(r, "reg_end"),
        CompDate = Row.S(r, "comp_date"),
        TeamSizeMin = Row.L(r, "team_size_min"),
        TeamSizeMax = Row.L(r, "team_size_max"),
        EligibilityDept = Row.S(r, "eligibility_dept"),
        Rules = Row.NS(r, "rules"),
        ProblemStatements = Row.NS(r, "problem_statements"),
        SubmissionDeadline = Row.S(r, "submission_deadline"),
        EvaluationCriteria = Row.NS(r, "evaluation_criteria"),
        Prizes = Row.NS(r, "prizes"),
        IsLeaderboardPublished = Row.L(r, "is_leaderboard_published"),
        Status = Row.S(r, "status"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class CompetitionTeamDto
{
    public long Id { get; set; }
    public long CompetitionId { get; set; }
    public string TeamName { get; set; } = "";
    public long CaptainId { get; set; }
    public string CaptainName { get; set; } = "";
    public long IsLocked { get; set; } = 0;
    public string CreatedAt { get; set; } = "";
    public List<CompetitionTeamMemberDto> Members { get; set; } = new();

    public static CompetitionTeamDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CompetitionId = Row.L(r, "competition_id"),
        TeamName = Row.S(r, "team_name"),
        CaptainId = Row.L(r, "captain_id"),
        CaptainName = Row.S(r, "captain_name"),
        IsLocked = Row.L(r, "is_locked"),
        CreatedAt = Row.S(r, "created_at"),
    };
}

public class CompetitionTeamMemberDto
{
    public long Id { get; set; }
    public long TeamId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = "";
    public string Email { get; set; } = "";
    public string RoleInTeam { get; set; } = "member";
    public string Status { get; set; } = "accepted";
    public string JoinedAt { get; set; } = "";

    public static CompetitionTeamMemberDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        TeamId = Row.L(r, "team_id"),
        UserId = Row.L(r, "user_id"),
        UserName = Row.S(r, "user_name"),
        Email = Row.S(r, "email"),
        RoleInTeam = Row.S(r, "role_in_team"),
        Status = Row.S(r, "status"),
        JoinedAt = Row.S(r, "joined_at"),
    };
}

public class CompetitionSubmissionDto
{
    public long Id { get; set; }
    public long CompetitionId { get; set; }
    public long TeamId { get; set; }
    public string TeamName { get; set; } = "";
    public string ProjectTitle { get; set; } = "";
    public string Description { get; set; } = "";
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? PptUrl { get; set; }
    public string? ScreenshotsUrl { get; set; }
    public string? VideoUrl { get; set; }
    public long IsLocked { get; set; } = 0;
    public string SubmittedAt { get; set; } = "";

    public static CompetitionSubmissionDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CompetitionId = Row.L(r, "competition_id"),
        TeamId = Row.L(r, "team_id"),
        TeamName = Row.S(r, "team_name"),
        ProjectTitle = Row.S(r, "project_title"),
        Description = Row.S(r, "description"),
        GithubUrl = Row.NS(r, "github_url"),
        DemoUrl = Row.NS(r, "demo_url"),
        PptUrl = Row.NS(r, "ppt_url"),
        ScreenshotsUrl = Row.NS(r, "screenshots_url"),
        VideoUrl = Row.NS(r, "video_url"),
        IsLocked = Row.L(r, "is_locked"),
        SubmittedAt = Row.S(r, "submitted_at"),
    };
}

public class CompetitionEvaluationDto
{
    public long Id { get; set; }
    public long CompetitionId { get; set; }
    public long TeamId { get; set; }
    public long JudgeId { get; set; }
    public string JudgeName { get; set; } = "";
    public long ScoreInnovation { get; set; }
    public long ScoreTech { get; set; }
    public long ScoreUiUx { get; set; }
    public long ScoreImpact { get; set; }
    public long ScorePresentation { get; set; }
    public double TotalScore { get; set; }
    public string? Remarks { get; set; }
    public string EvaluatedAt { get; set; } = "";

    public static CompetitionEvaluationDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CompetitionId = Row.L(r, "competition_id"),
        TeamId = Row.L(r, "team_id"),
        JudgeId = Row.L(r, "judge_id"),
        JudgeName = Row.S(r, "judge_name"),
        ScoreInnovation = Row.L(r, "score_innovation"),
        ScoreTech = Row.L(r, "score_tech"),
        ScoreUiUx = Row.L(r, "score_uiux"),
        ScoreImpact = Row.L(r, "score_impact"),
        ScorePresentation = Row.L(r, "score_presentation"),
        TotalScore = Row.D(r, "total_score"),
        Remarks = Row.NS(r, "remarks"),
        EvaluatedAt = Row.S(r, "evaluated_at"),
    };
}

public class CompetitionCertificateDto
{
    public long Id { get; set; }
    public long CompetitionId { get; set; }
    public string CompetitionTitle { get; set; } = "";
    public long UserId { get; set; }
    public string UserName { get; set; } = "";
    public string? TeamName { get; set; }
    public string CertType { get; set; } = "participant";
    public string CertCode { get; set; } = "";
    public string QrPayload { get; set; } = "";
    public string IssuedAt { get; set; } = "";

    public static CompetitionCertificateDto Map(DbDataReader r) => new()
    {
        Id = Row.L(r, "id"),
        CompetitionId = Row.L(r, "competition_id"),
        CompetitionTitle = Row.S(r, "competition_title"),
        UserId = Row.L(r, "user_id"),
        UserName = Row.S(r, "user_name"),
        TeamName = Row.NS(r, "team_name"),
        CertType = Row.S(r, "cert_type"),
        CertCode = Row.S(r, "cert_code"),
        QrPayload = Row.S(r, "qr_payload"),
        IssuedAt = Row.S(r, "issued_at"),
    };
}
