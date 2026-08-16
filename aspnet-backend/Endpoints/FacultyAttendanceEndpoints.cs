using System.Text.Json;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Faculty attendance ported from src/app/api/faculty-attendance/route.ts:
/// students see nothing, faculty see their own register, admin marks (upsert per faculty per day).
/// </summary>
public static class FacultyAttendanceEndpoints
{
    public static IEndpointRouteBuilder MapFacultyAttendanceEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Save);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role switch
        {
            "student" => "SELECT * FROM faculty_attendance WHERE false",
            "faculty" => "SELECT * FROM faculty_attendance WHERE faculty_id = @id ORDER BY id DESC",
            _ => "SELECT * FROM faculty_attendance ORDER BY id DESC",
        };
        if (user.Role == "faculty") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<FacultyAttendanceDto>();
        while (reader.Read()) list.Add(FacultyAttendanceDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Save(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        using var doc = JsonDocument.Parse(ctx.Request.BodyReader.AsStream());
        var body = doc.RootElement;
        var rows = ExtractRows(body);
        if (rows.Count == 0)
            return Results.Json(new { error = "No records provided" }, statusCode: 400);

        var saved = 0;
        foreach (var item in rows)
        {
            var facultyId = J.GetLong(item, "facultyId") ?? 0;
            var date = J.GetString(item, "date") ?? DateTime.UtcNow.ToString("yyyy-MM-dd");
            if (facultyId == 0) continue;

            // Upsert one record per faculty per day.
            long? existingId = null;
            using (var find = conn.CreateCommand())
            {
                find.CommandText = "SELECT id FROM faculty_attendance WHERE faculty_id = @fid AND date = @date LIMIT 1";
                find.Parameters.AddWithValue("@fid", facultyId);
                find.Parameters.AddWithValue("@date", date);
                var found = find.ExecuteScalar();
                if (found is not null && found is not DBNull) existingId = (long)found;
            }

            var facultyName = J.GetString(item, "facultyName") ?? "";
            var status = J.GetString(item, "status") ?? "present";
            var markedBy = J.GetString(item, "markedBy") ?? user.Name;

            if (existingId is not null)
            {
                Database.Exec(conn, """
                    UPDATE faculty_attendance SET faculty_name = @fname, status = @status, marked_by = @markedBy
                    WHERE id = @id
                    """,
                    ("@fname", facultyName), ("@status", status), ("@markedBy", markedBy), ("@id", existingId.Value));
            }
            else
            {
                Database.Exec(conn, """
                    INSERT INTO faculty_attendance (faculty_id, faculty_name, date, status, marked_by)
                    VALUES (@fid, @fname, @date, @status, @markedBy)
                    """,
                    ("@fid", facultyId), ("@fname", facultyName), ("@date", date),
                    ("@status", status), ("@markedBy", markedBy));
            }
            saved++;
        }

        return Results.Json(new { success = true, count = saved });
    }

    private static List<JsonElement> ExtractRows(JsonElement body)
    {
        if (body.ValueKind == JsonValueKind.Array)
            return body.EnumerateArray().ToList();
        if (body.TryGetProperty("rows", out var rows) && rows.ValueKind == JsonValueKind.Array)
            return rows.EnumerateArray().ToList();
        return body.ValueKind == JsonValueKind.Object ? [body] : [];
    }
}
