using MySqlConnector;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Leave request endpoints ported from src/app/api/leaves/route.ts:
/// student submit, faculty/admin review (with self-approval guard), admin delete.
/// </summary>
public static class LeaveEndpoints
{
    public static IEndpointRouteBuilder MapLeaveEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Create);
        app.MapPut("/", Review);
        app.MapDelete("/", Delete);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "leaves", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM leave_requests WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM leave_requests ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<LeaveRequestDto>();
        while (reader.Read()) list.Add(LeaveRequestDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, LeaveCreateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "leaves", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrEmpty(body.FromDate) || string.IsNullOrEmpty(body.ToDate) || string.IsNullOrEmpty(body.Reason))
            return Results.Json(new { error = "From date, to date and reason are required" }, statusCode: 400);
        if (string.CompareOrdinal(body.FromDate, body.ToDate) > 0)
            return Results.Json(new { error = "The to date must be on or after the from date" }, statusCode: 400);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO leave_requests (student_id, student_name, roll_no, department, from_date, to_date, reason, status)
            VALUES (@sid, @sname, @rollNo, @department, @from, @to, @reason, 'pending') RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", user.Id);
        cmd.Parameters.AddWithValue("@sname", user.Name);
        cmd.Parameters.AddWithValue("@rollNo", user.RollNo);
        cmd.Parameters.AddWithValue("@department", user.Department);
        cmd.Parameters.AddWithValue("@from", body.FromDate);
        cmd.Parameters.AddWithValue("@to", body.ToDate);
        cmd.Parameters.AddWithValue("@reason", body.Reason);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadLeave(conn, id));
    }

    private static IResult Review(HttpContext ctx, LeaveReviewRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || (user.Role != "faculty" && user.Role != "admin"))
            return Results.Json(new { error = "Faculty or admin access required" }, statusCode: 403);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "leaves", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (body.Id is null || body.Status is not ("approved" or "rejected"))
            return Results.Json(new { error = "Leave ID and a valid status are required" }, statusCode: 400);

        var target = LoadLeave(conn, body.Id.Value);
        if (target is null) return Results.Json(new { error = "Leave request not found" }, statusCode: 404);
        if (target.StudentId == user.Id)
            return Results.Json(new { error = "You cannot approve or reject your own leave request" }, statusCode: 403);

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var remarks = body.Remarks ?? (body.Status == "approved" ? "Approved" : "Rejected");
        Database.Exec(conn, """
            UPDATE leave_requests SET status = @status, remarks = @remarks, reviewed_by = @reviewedBy, reviewed_at = @reviewedAt
            WHERE id = @id
            """,
            ("@status", body.Status), ("@remarks", remarks),
            ("@reviewedBy", user.Name), ("@reviewedAt", today), ("@id", body.Id.Value));

        return Results.Json(LoadLeave(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Leave ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "leaves", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM leave_requests WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, message = "Leave request deleted" });
    }

    private static LeaveRequestDto? LoadLeave(MySqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM leave_requests WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? LeaveRequestDto.Map(reader) : null;
    }

    public sealed record LeaveCreateRequest(string? FromDate, string? ToDate, string? Reason);
    public sealed record LeaveReviewRequest(long? Id, string? Status, string? Remarks);
}
