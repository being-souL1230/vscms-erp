using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Notices endpoints ported from src/app/api/notices/route.ts.</summary>
public static class NoticeEndpoints
{
    public static IEndpointRouteBuilder MapNoticeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is not null)
        {
            using var conn = Database.Open();
            if (!Permissions.Can(conn, user, "notices", "view"))
                return Results.Json(new { error = "Access denied" }, statusCode: 403);
        }
        using var read = Database.Open();
        using var cmd = read.CreateCommand();
        cmd.CommandText = "SELECT * FROM notices ORDER BY id DESC";
        using var reader = cmd.ExecuteReader();
        var list = new List<NoticeDto>();
        while (reader.Read()) list.Add(NoticeDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, NoticeRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "notices", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Title) || string.IsNullOrWhiteSpace(body.Content))
            return Results.Json(new { error = "Title and content are required" }, statusCode: 400);

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO notices (title, content, category, priority, author_name, published_date)
            VALUES (@title, @content, @category, @priority, @author, @date) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@title", body.Title);
        cmd.Parameters.AddWithValue("@content", body.Content);
        cmd.Parameters.AddWithValue("@category", string.IsNullOrEmpty(body.Category) ? "Academic" : body.Category);
        cmd.Parameters.AddWithValue("@priority", string.IsNullOrEmpty(body.Priority) ? "normal" : body.Priority);
        // Default the author to the signed-in user so faculty posts show their
        // own name instead of a generic office label.
        cmd.Parameters.AddWithValue("@author", string.IsNullOrEmpty(body.AuthorName) ? user.Name : body.AuthorName);
        cmd.Parameters.AddWithValue("@date", today);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadNotice(conn, id));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Notice ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "notices", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM notices WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, message = "Notice deleted" });
    }

    private static NoticeDto? LoadNotice(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM notices WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? NoticeDto.Map(reader) : null;
    }

    public sealed record NoticeRequest(string? Title, string? Content, string? Category, string? Priority, string? AuthorName);
}
