using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

public static class FeedbackEndpoints
{
    public static IEndpointRouteBuilder MapFeedbackEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", GetSummary);
        app.MapPost("/", Create);
        return app;
    }

    private static IResult GetSummary(HttpContext ctx)
    {
        using var conn = Database.Open();
        var list = GetRatingsList(conn);
        var (avg, total) = CalculateSummary(list);
        return Results.Json(new
        {
            averageRating = avg,
            totalRatings = total,
            ratings = list
        });
    }

    private static IResult Create(HttpContext ctx, FeedbackRequest body)
    {
        if (body.Rating < 1 || body.Rating > 5)
            return Results.Json(new { error = "Rating must be between 1 and 5" }, statusCode: 400);

        var user = AuthService.GetCurrentUser(ctx.Request);
        long userId = user?.Id ?? 1;
        string userName = user?.Name ?? "Guest Presenter";
        string userRole = user?.Role ?? "guest";

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO feedback_ratings (user_id, user_name, user_role, rating, comment)
            VALUES (@userId, @userName, @userRole, @rating, @comment);
            """;
        cmd.Parameters.AddWithValue("@userId", userId);
        cmd.Parameters.AddWithValue("@userName", userName);
        cmd.Parameters.AddWithValue("@userRole", userRole);
        cmd.Parameters.AddWithValue("@rating", body.Rating);
        cmd.Parameters.AddWithValue("@comment", (object?)body.Comment ?? DBNull.Value);
        cmd.ExecuteNonQuery();

        var list = GetRatingsList(conn);
        var (avg, total) = CalculateSummary(list);

        return Results.Json(new
        {
            success = true,
            averageRating = avg,
            totalRatings = total,
            ratings = list
        });
    }

    private static List<FeedbackDto> GetRatingsList(MySqlConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM feedback_ratings ORDER BY id DESC LIMIT 50";
        using var reader = cmd.ExecuteReader();
        var list = new List<FeedbackDto>();
        while (reader.Read())
        {
            list.Add(new FeedbackDto(
                Id: Convert.ToInt64(reader["id"]),
                UserId: Convert.ToInt64(reader["user_id"]),
                UserName: reader["user_name"].ToString() ?? "Guest",
                UserRole: reader["user_role"].ToString() ?? "guest",
                Rating: Convert.ToInt32(reader["rating"]),
                Comment: reader["comment"] != DBNull.Value ? reader["comment"].ToString() : null,
                CreatedAt: reader["created_at"].ToString() ?? ""
            ));
        }
        return list;
    }

    private static (double Average, int Total) CalculateSummary(List<FeedbackDto> list)
    {
        if (list.Count == 0) return (0.0, 0);
        double sum = list.Sum(r => r.Rating);
        double avg = Math.Round(sum / list.Count, 1);
        return (avg, list.Count);
    }

    public sealed record FeedbackRequest(int Rating, string? Comment);

    public sealed record FeedbackDto(
        long Id,
        long UserId,
        string UserName,
        string UserRole,
        int Rating,
        string? Comment,
        string CreatedAt
    );
}
