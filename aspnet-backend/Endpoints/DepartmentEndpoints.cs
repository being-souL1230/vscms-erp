using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>Department CRUD ported from src/app/api/departments/route.ts.</summary>
public static class DepartmentEndpoints
{
    public static IEndpointRouteBuilder MapDepartmentEndpoints(this IEndpointRouteBuilder app)
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
            if (!Permissions.Can(conn, user, "departments", "view"))
                return Results.Json(new { error = "Access denied" }, statusCode: 403);
        }
        using var read = Database.Open();
        using var cmd = read.CreateCommand();
        cmd.CommandText = "SELECT * FROM departments ORDER BY code ASC";
        using var reader = cmd.ExecuteReader();
        var list = new List<DepartmentDto>();
        while (reader.Read()) list.Add(DepartmentDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Create(HttpContext ctx, DepartmentRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "departments", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (string.IsNullOrWhiteSpace(body.Code) || string.IsNullOrWhiteSpace(body.Name) || string.IsNullOrWhiteSpace(body.HeadOfDepartment))
            return Results.Json(new { error = "Code, name and head of department are required" }, statusCode: 400);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO departments (code, name, head_of_department, location, student_count, faculty_count)
            VALUES (@code, @name, @hod, @location, 0, 0) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@code", body.Code);
        cmd.Parameters.AddWithValue("@name", body.Name);
        cmd.Parameters.AddWithValue("@hod", body.HeadOfDepartment);
        cmd.Parameters.AddWithValue("@location", string.IsNullOrEmpty(body.Location) ? "Main Campus" : body.Location);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadDepartment(conn, id));
    }

    private static IResult Update(HttpContext ctx, DepartmentUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        if (body.Id is null) return Results.Json(new { error = "Department ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "departments", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var current = LoadDepartment(conn, body.Id.Value);
        if (current is null) return Results.Json((object?)null);

        Database.Exec(conn, """
            UPDATE departments SET code = @code, name = @name, head_of_department = @hod, location = @location
            WHERE id = @id
            """,
            ("@code", body.Code ?? current.Code),
            ("@name", body.Name ?? current.Name),
            ("@hod", body.HeadOfDepartment ?? current.HeadOfDepartment),
            ("@location", (object?)(body.Location ?? current.Location) ?? DBNull.Value),
            ("@id", body.Id.Value));

        return Results.Json(LoadDepartment(conn, body.Id.Value));
    }

    private static IResult Delete(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var idText = ctx.Request.Query["id"].ToString();
        if (string.IsNullOrEmpty(idText) || !long.TryParse(idText, out var id))
            return Results.Json(new { error = "Department ID is required" }, statusCode: 400);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "departments", "delete"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        Database.Exec(conn, "DELETE FROM departments WHERE id = @id", ("@id", id));
        return Results.Json(new { success = true, message = "Department deleted" });
    }

    private static DepartmentDto? LoadDepartment(NpgsqlConnection conn, long id)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM departments WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? DepartmentDto.Map(reader) : null;
    }

    public sealed record DepartmentRequest(string? Code, string? Name, string? HeadOfDepartment, string? Location);
    public sealed record DepartmentUpdateRequest(long? Id, string? Code, string? Name, string? HeadOfDepartment, string? Location);
}
