using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Documents endpoints ported from src/app/api/documents/route.ts:
/// student upload, admin verification workflow, owner-only delete.
/// </summary>
public static class DocumentEndpoints
{
    private const int MaxBytes = 4 * 1024 * 1024; // ~4 MB base64 payload guard

    public static IEndpointRouteBuilder MapDocumentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Upload);
        app.MapPut("/", UpdateStatus);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "documents", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM documents WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM documents ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<DocumentDto>();
        while (reader.Read()) list.Add(DocumentDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Upload(HttpContext ctx, DocumentUploadRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "documents", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var title = (body.Title ?? "").Trim();
        var data = body.Data ?? "";
        if (string.IsNullOrEmpty(title) || string.IsNullOrEmpty(data))
            return Results.Json(new { error = "Title and file data are required" }, statusCode: 400);
        if (data.Length > MaxBytes)
            return Results.Json(new { error = "File too large (max ~3 MB after encoding)" }, statusCode: 413);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO documents (student_id, student_name, title, category, file_name, mime_type, file_size, data, status)
            VALUES (@sid, @sname, @title, @category, @fileName, @mimeType, @fileSize, @data, 'pending') RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", user.Id);
        cmd.Parameters.AddWithValue("@sname", user.Name);
        cmd.Parameters.AddWithValue("@title", title);
        cmd.Parameters.AddWithValue("@category", string.IsNullOrEmpty(body.Category) ? "Other" : body.Category);
        cmd.Parameters.AddWithValue("@fileName", string.IsNullOrEmpty(body.FileName) ? "document" : body.FileName);
        cmd.Parameters.AddWithValue("@mimeType", string.IsNullOrEmpty(body.MimeType) ? "application/octet-stream" : body.MimeType);
        cmd.Parameters.AddWithValue("@fileSize", body.FileSize is > 0 ? body.FileSize.Value : data.Length);
        cmd.Parameters.AddWithValue("@data", data);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadDocument(conn, id));
    }

    private static IResult UpdateStatus(HttpContext ctx, DocumentStatusRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        // Approving/verifying documents is an admin office workflow: the matrix
        // "edit" toggle must not let students self-approve their own uploads.
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "documents", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (body.Id is null) return Results.Json(new { error = "Document ID is required" }, statusCode: 400);

        Database.Exec(conn, "UPDATE documents SET status = @status WHERE id = @id",
            ("@status", string.IsNullOrEmpty(body.Status) ? "pending" : body.Status), ("@id", body.Id.Value));
        var updated = LoadDocument(conn, body.Id.Value);
        if (updated is null) return Results.Json(new { error = "Document not found" }, statusCode: 404);
        return Results.Json(updated);
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Document ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "documents", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var row = LoadDocument(conn, id);
        if (row is null) return Results.Json(new { error = "Document not found" }, statusCode: 404);
        if (user.Role != "admin" && row.StudentId != user.Id)
            return Results.Json(new { error = "You can only delete your own documents" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM documents WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    private static DocumentDto? LoadDocument(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM documents WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? DocumentDto.Map(reader) : null;
    }

    public sealed record DocumentUploadRequest(
        string? Title, string? Category, string? FileName, string? MimeType, long? FileSize, string? Data);

    public sealed record DocumentStatusRequest(long? Id, string? Status);
}
