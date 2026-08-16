using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Timetable CRUD ported from src/app/api/timetable/route.ts.</summary>
public static class TimetableEndpoints
{
    public static IEndpointRouteBuilder MapTimetableEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapPut("/", Update);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is not null)
        {
            using var conn = Database.Open();
            if (!Permissions.Can(conn, user, "timetable", "view"))
                return Results.Json(new { error = "Access denied" }, statusCode: 403);
        }
        using var read = Database.Open();
        using var cmd = read.CreateCommand();
        cmd.CommandText = "SELECT * FROM timetable ORDER BY day_of_week ASC, start_time ASC";
        using var reader = cmd.ExecuteReader();
        var list = new List<TimetableSlotDto>();
        while (reader.Read()) list.Add(TimetableSlotDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, TimetableRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "timetable", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.CourseCode) || string.IsNullOrWhiteSpace(body.CourseName)
            || string.IsNullOrWhiteSpace(body.DayOfWeek) || string.IsNullOrWhiteSpace(body.StartTime) || string.IsNullOrWhiteSpace(body.EndTime))
            return Results.Json(new { error = "Course code, name, day and timings are required" }, statusCode: 400);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO timetable (course_code, course_name, department, semester, day_of_week, start_time, end_time, room, faculty_name)
            VALUES (@code, @name, @department, @semester, @day, @start, @end, @room, @facultyName) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@code", body.CourseCode);
        cmd.Parameters.AddWithValue("@name", body.CourseName);
        cmd.Parameters.AddWithValue("@department", string.IsNullOrEmpty(body.Department) ? "BCA (CSJM)" : body.Department);
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@day", body.DayOfWeek);
        cmd.Parameters.AddWithValue("@start", body.StartTime);
        cmd.Parameters.AddWithValue("@end", body.EndTime);
        cmd.Parameters.AddWithValue("@room", string.IsNullOrEmpty(body.Room) ? "LT-Hall 1" : body.Room);
        cmd.Parameters.AddWithValue("@facultyName", string.IsNullOrEmpty(body.FacultyName) ? "Assigned Faculty" : body.FacultyName);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadSlot(conn, id));
    }

    private static IResult Update(HttpContext ctx, TimetableUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Slot ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "timetable", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadSlot(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        Database.Exec(conn, """
            UPDATE timetable SET
              course_code = @code, course_name = @name, department = @department, semester = @semester,
              day_of_week = @day, start_time = @start, end_time = @end, room = @room, faculty_name = @facultyName
            WHERE id = @id
            """,
            ("@code", body.CourseCode ?? current.CourseCode),
            ("@name", body.CourseName ?? current.CourseName),
            ("@department", body.Department ?? current.Department),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : 1),
            ("@day", body.DayOfWeek ?? current.DayOfWeek),
            ("@start", body.StartTime ?? current.StartTime),
            ("@end", body.EndTime ?? current.EndTime),
            ("@room", body.Room ?? current.Room),
            ("@facultyName", body.FacultyName ?? current.FacultyName),
            ("@id", body.Id.Value));

        return Results.Json(LoadSlot(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Slot ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "timetable", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM timetable WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, message = "Timetable slot deleted" });
    }

    private static TimetableSlotDto? LoadSlot(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM timetable WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? TimetableSlotDto.Map(reader) : null;
    }

    public sealed record TimetableRequest(
        string? CourseCode, string? CourseName, string? Department, long? Semester,
        string? DayOfWeek, string? StartTime, string? EndTime, string? Room, string? FacultyName);

    public sealed record TimetableUpdateRequest(
        long? Id, string? CourseCode, string? CourseName, string? Department, long? Semester,
        string? DayOfWeek, string? StartTime, string? EndTime, string? Room, string? FacultyName);
}
