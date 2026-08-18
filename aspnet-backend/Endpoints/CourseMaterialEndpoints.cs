using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

public static class CourseMaterialEndpoints
{
    public static IEndpointRouteBuilder MapCourseMaterialEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapDelete("/", Delete);
        app.MapPost("/download", IncrementDownload);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM course_materials ORDER BY id DESC";
        using var reader = cmd.ExecuteReader();
        var list = new List<CourseMaterialDto>();
        while (reader.Read()) list.Add(CourseMaterialDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, CourseMaterialRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);

        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.ModuleName))
            return Results.Json(new { error = "Module name and title are required" }, statusCode: 400);

        var fileUrl = string.IsNullOrWhiteSpace(body.FileUrl)
            ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            : body.FileUrl;

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO course_materials (course_id, course_code, course_name, module_name, title, description, type, file_url, file_size, faculty_id, faculty_name, download_count)
            VALUES (@courseId, @courseCode, @courseName, @moduleName, @title, @description, @type, @fileUrl, @fileSize, @facultyId, @facultyName, 0) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@courseId", body.CourseId);
        cmd.Parameters.AddWithValue("@courseCode", body.CourseCode ?? "COURSE");
        cmd.Parameters.AddWithValue("@courseName", body.CourseName ?? "Course Material");
        cmd.Parameters.AddWithValue("@moduleName", body.ModuleName);
        cmd.Parameters.AddWithValue("@title", body.Title);
        cmd.Parameters.AddWithValue("@description", (object?)body.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@type", string.IsNullOrEmpty(body.Type) ? "PDF" : body.Type);
        cmd.Parameters.AddWithValue("@fileUrl", fileUrl);
        cmd.Parameters.AddWithValue("@fileSize", string.IsNullOrEmpty(body.FileSize) ? "1.5 MB" : body.FileSize);
        cmd.Parameters.AddWithValue("@facultyId", (object?)user?.Id ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@facultyName", user?.Name ?? body.FacultyName ?? "Faculty Member");
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadMaterial(conn, id));
    }

    private static IResult Delete(HttpContext ctx, long id)
    {
        using var conn = Database.Open();
        Database.Exec(conn, "DELETE FROM course_materials WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, id });
    }

    private static IResult IncrementDownload(HttpContext ctx, DownloadRequest body)
    {
        using var conn = Database.Open();
        Database.Exec(conn, "UPDATE course_materials SET download_count = download_count + 1 WHERE id = @id", ("@id", body.Id));
        return Results.Json(new { success = true });
    }

    private static CourseMaterialDto? LoadMaterial(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM course_materials WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? CourseMaterialDto.Map(reader) : null;
    }
}

public record CourseMaterialRequest(
    long CourseId,
    string? CourseCode,
    string? CourseName,
    string ModuleName,
    string Title,
    string? Description,
    string? Type,
    string? FileUrl,
    string? FileSize,
    string? FacultyName
);

public record DownloadRequest(long Id);

public record CourseMaterialDto(
    long Id,
    long CourseId,
    string CourseCode,
    string CourseName,
    string ModuleName,
    string Title,
    string? Description,
    string Type,
    string FileUrl,
    string FileSize,
    long? FacultyId,
    string FacultyName,
    long DownloadCount,
    string CreatedAt
)
{
    public static CourseMaterialDto Map(NpgsqlDataReader r) => new(
        r.GetInt64(r.GetOrdinal("id")),
        r.GetInt64(r.GetOrdinal("course_id")),
        r.GetString(r.GetOrdinal("course_code")),
        r.GetString(r.GetOrdinal("course_name")),
        r.GetString(r.GetOrdinal("module_name")),
        r.GetString(r.GetOrdinal("title")),
        r.IsDBNull(r.GetOrdinal("description")) ? null : r.GetString(r.GetOrdinal("description")),
        r.GetString(r.GetOrdinal("type")),
        r.GetString(r.GetOrdinal("file_url")),
        r.GetString(r.GetOrdinal("file_size")),
        r.IsDBNull(r.GetOrdinal("faculty_id")) ? null : r.GetInt64(r.GetOrdinal("faculty_id")),
        r.GetString(r.GetOrdinal("faculty_name")),
        r.GetInt64(r.GetOrdinal("download_count")),
        r.GetString(r.GetOrdinal("created_at"))
    );
}
