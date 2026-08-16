using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Fee structure CRUD ported from src/app/api/fee-structures/route.ts.</summary>
public static class FeeStructureEndpoints
{
    public static IEndpointRouteBuilder MapFeeStructureEndpoints(this IEndpointRouteBuilder app)
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
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM fee_structures";
        using var reader = cmd.ExecuteReader();
        var list = new List<FeeStructureDto>();
        while (reader.Read()) list.Add(FeeStructureDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, FeeStructureRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrEmpty(body.CourseCode) || string.IsNullOrEmpty(body.CourseName)
            || string.IsNullOrEmpty(body.FeeType) || string.IsNullOrEmpty(body.Amount))
            return Results.Json(new { error = "Course, fee type and amount are required" }, statusCode: 400);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO fee_structures (course_code, course_name, semester, fee_type, amount, due_date)
            VALUES (@ccode, @cname, @semester, @feeType, @amount, @dueDate) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@ccode", body.CourseCode);
        cmd.Parameters.AddWithValue("@cname", body.CourseName);
        cmd.Parameters.AddWithValue("@semester", body.Semester is > 0 ? body.Semester.Value : 1);
        cmd.Parameters.AddWithValue("@feeType", body.FeeType);
        cmd.Parameters.AddWithValue("@amount", body.Amount);
        cmd.Parameters.AddWithValue("@dueDate", string.IsNullOrEmpty(body.DueDate) ? "2026-04-15" : body.DueDate);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadStructure(conn, id));
    }

    private static IResult Update(HttpContext ctx, FeeStructureUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Structure ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadStructure(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        Database.Exec(conn, """
            UPDATE fee_structures SET
              course_code = @ccode, course_name = @cname, semester = @semester,
              fee_type = @feeType, amount = @amount, due_date = @dueDate
            WHERE id = @id
            """,
            ("@ccode", body.CourseCode ?? current.CourseCode),
            ("@cname", body.CourseName ?? current.CourseName),
            ("@semester", body.Semester is > 0 ? body.Semester.Value : 1),
            ("@feeType", body.FeeType ?? current.FeeType),
            ("@amount", body.Amount ?? current.Amount),
            ("@dueDate", string.IsNullOrEmpty(body.DueDate) ? "2026-04-15" : body.DueDate),
            ("@id", body.Id.Value));

        return Results.Json(LoadStructure(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Structure ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM fee_structures WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true });
    }

    private static FeeStructureDto? LoadStructure(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM fee_structures WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? FeeStructureDto.Map(reader) : null;
    }

    public sealed record FeeStructureRequest(
        string? CourseCode, string? CourseName, long? Semester, string? FeeType, string? Amount, string? DueDate);

    public sealed record FeeStructureUpdateRequest(
        long? Id, string? CourseCode, string? CourseName, long? Semester, string? FeeType, string? Amount, string? DueDate);
}
