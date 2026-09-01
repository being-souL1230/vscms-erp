using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Grades endpoints ported from src/app/api/grades/route.ts.
/// Note: the original checks the "exams" permission module for grades.
/// </summary>
public static class GradeEndpoints
{
    public static IEndpointRouteBuilder MapGradeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM grades WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM grades ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<GradeDto>();
        while (reader.Read()) list.Add(GradeDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, GradeRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "exams", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var studentId = body.StudentId ?? 0;
        var courseId = body.CourseId ?? 1;
        var semester = body.Semester is > 0 ? body.Semester.Value : 6;

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO grades (student_id, student_name, course_id, course_name, exam_type, marks_obtained, max_marks, grade_letter, semester, remarks)
            VALUES (@sid, @sname, @cid, @cname, @examType, @marks, @maxMarks, @grade, @semester, @remarks) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", studentId);
        cmd.Parameters.AddWithValue("@sname", body.StudentName ?? "");
        cmd.Parameters.AddWithValue("@cid", courseId);
        cmd.Parameters.AddWithValue("@cname", body.CourseName ?? "");
        cmd.Parameters.AddWithValue("@examType", string.IsNullOrEmpty(body.ExamType) ? "Midterm" : body.ExamType);
        cmd.Parameters.AddWithValue("@marks", body.MarksObtained ?? "");
        cmd.Parameters.AddWithValue("@maxMarks", string.IsNullOrEmpty(body.MaxMarks) ? "100" : body.MaxMarks);
        cmd.Parameters.AddWithValue("@grade", string.IsNullOrEmpty(body.GradeLetter) ? "A" : body.GradeLetter);
        cmd.Parameters.AddWithValue("@semester", semester);
        cmd.Parameters.AddWithValue("@remarks", body.Remarks ?? "");
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadGrade(conn, id));
    }

    private static GradeDto? LoadGrade(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM grades WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? GradeDto.Map(reader) : null;
    }

    public sealed record GradeRequest(
        long? StudentId, string? StudentName, long? CourseId, string? CourseName,
        string? ExamType, string? MarksObtained, string? MaxMarks, string? GradeLetter,
        long? Semester, string? Remarks);
}
