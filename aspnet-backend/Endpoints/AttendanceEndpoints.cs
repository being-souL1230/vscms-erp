using System.Text.Json;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Attendance endpoints ported from src/app/api/attendance/route.ts:
/// GET (list, student-scoped) and POST (upsert by student + course + date + period).
/// </summary>
public static class AttendanceEndpoints
{
    public static IEndpointRouteBuilder MapAttendanceEndpoints(this IEndpointRouteBuilder app)
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
        if (!Permissions.Can(conn, user, "attendance", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM attendance WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM attendance ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<AttendanceDto>();
        while (reader.Read()) list.Add(AttendanceDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "attendance", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var doc = JsonDocument.Parse(ctx.Request.BodyReader.AsStream());
        var body = doc.RootElement;
        var items = ExtractRows(body);
        if (items.Count == 0)
            return Results.Json(new { error = "No attendance records provided" }, statusCode: 400);

        // Faculty may only mark attendance for their assigned courses.
        if (user.Role != "admin")
        {
            var checkedIds = new HashSet<long>();
            foreach (var item in items)
            {
                var cid = J.GetLong(item, "courseId") ?? 0;
                if (!checkedIds.Add(cid)) continue;
                if (!Permissions.OwnsCourse(conn, user, cid))
                    return Results.Json(new { error = "You can only mark attendance for your assigned courses" }, statusCode: 403);
            }
        }

        var saved = new List<AttendanceDto>();
        foreach (var item in items)
            saved.Add(Upsert(conn, item, item.TryGetProperty("markedBy", out var mb) && mb.ValueKind == JsonValueKind.String ? mb.GetString() : null, user.Name));

        return Results.Json(new { success = true, count = saved.Count, records = saved });
    }

    private static List<JsonElement> ExtractRows(JsonElement body)
    {
        if (body.ValueKind == JsonValueKind.Array)
            return body.EnumerateArray().ToList();
        if (body.TryGetProperty("rows", out var rows) && rows.ValueKind == JsonValueKind.Array)
            return rows.EnumerateArray().ToList();
        return body.ValueKind == JsonValueKind.Object ? [body] : [];
    }

    private static AttendanceDto Upsert(NpgsqlConnection conn, JsonElement item, string? itemMarkedBy, string userName)
    {
        var studentId = J.GetLong(item, "studentId") ?? 0;
        var courseId = J.GetLong(item, "courseId") ?? 1;
        var date = J.GetString(item, "date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
        var period = J.GetString(item, "period") ?? "Lecture 1";
        var status = J.GetString(item, "status") ?? "present";
        var markedBy = string.IsNullOrEmpty(itemMarkedBy) ? userName : itemMarkedBy;

        var studentName = J.GetString(item, "studentName") ?? "";
        var courseCode = J.GetString(item, "courseCode") ?? "CS301";

        // Upsert by student + course + date + period.
        long id;
        using (var find = conn.CreateCommand())
        {
            find.CommandText = """
                SELECT id FROM attendance
                WHERE student_id = @sid AND course_id = @cid AND date = @date AND period = @period
                LIMIT 1
                """;
            find.Parameters.AddWithValue("@sid", studentId);
            find.Parameters.AddWithValue("@cid", courseId);
            find.Parameters.AddWithValue("@date", date);
            find.Parameters.AddWithValue("@period", period);
            var existing = find.ExecuteScalar();
            id = existing is null || existing is DBNull ? 0 : (long)existing;
        }

        if (id > 0)
        {
            Database.Exec(conn, """
                UPDATE attendance SET
                  student_name = @sname, course_code = @ccode, status = @status, marked_by = @markedBy
                WHERE id = @id
                """,
                ("@sname", studentName), ("@ccode", courseCode), ("@status", status), ("@markedBy", markedBy), ("@id", id));
        }
        else
        {
            using var ins = conn.CreateCommand();
            ins.CommandText = """
                INSERT INTO attendance (student_id, student_name, course_id, course_code, date, status, period, marked_by)
                VALUES (@sid, @sname, @cid, @ccode, @date, @status, @period, @markedBy)
                RETURNING id
                """;
            ins.Parameters.AddWithValue("@sid", studentId);
            ins.Parameters.AddWithValue("@sname", studentName);
            ins.Parameters.AddWithValue("@cid", courseId);
            ins.Parameters.AddWithValue("@ccode", courseCode);
            ins.Parameters.AddWithValue("@date", date);
            ins.Parameters.AddWithValue("@status", status);
            ins.Parameters.AddWithValue("@period", period);
            ins.Parameters.AddWithValue("@markedBy", markedBy);
            id = (long)(ins.ExecuteScalar() ?? 0);
        }

        using var load = conn.CreateCommand();
        load.CommandText = "SELECT * FROM attendance WHERE id = @id";
        load.Parameters.AddWithValue("@id", id);
        using var reader = load.ExecuteReader();
        return reader.Read() ? AttendanceDto.Map(reader) : throw new InvalidOperationException("Attendance row not found");
    }
}
