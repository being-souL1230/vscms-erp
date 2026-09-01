using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Enrollments ported from src/app/api/enrollments/route.ts (admin-only writes).</summary>
public static class EnrollmentEndpoints
{
    public static IEndpointRouteBuilder MapEnrollmentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM enrollments WHERE student_id = @id"
            : "SELECT * FROM enrollments";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<EnrollmentDto>();
        while (reader.Read()) list.Add(EnrollmentDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, EnrollmentRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO enrollments (student_id, student_name, course_id, course_code, course_name, semester, status)
            VALUES (@sid, @sname, @cid, @ccode, @cname, @semester, @status) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", body.StudentId ?? 0);
        cmd.Parameters.AddWithValue("@sname", body.StudentName ?? "");
        cmd.Parameters.AddWithValue("@cid", body.CourseId ?? 0);
        cmd.Parameters.AddWithValue("@ccode", body.CourseCode ?? "");
        cmd.Parameters.AddWithValue("@cname", body.CourseName ?? "");
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@status", string.IsNullOrEmpty(body.Status) ? "active" : body.Status);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadEnrollment(conn, id));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin") return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Enrollment ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM enrollments WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    private static EnrollmentDto? LoadEnrollment(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM enrollments WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? EnrollmentDto.Map(reader) : null;
    }

    public sealed record EnrollmentRequest(
        long? StudentId, string? StudentName, long? CourseId, string? CourseCode,
        string? CourseName, long? Semester, string? Status);
}
