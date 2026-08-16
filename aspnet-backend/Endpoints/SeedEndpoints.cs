using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;
using VscmsErp.Api.Lib;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Seed endpoints ported from src/app/api/seed/route.ts:
/// GET reports whether demo data exists (admin only), POST runs the
/// seeding routine. Plain POST is allowed for any signed-in user (it only
/// backfills when the database is empty); the destructive force=true wipe
/// is admin-only.
/// </summary>
public static class SeedEndpoints
{
    public static IEndpointRouteBuilder MapSeedEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", Status);
        app.MapPost("/", Seed);
        return app;
    }

    private static IResult Status(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null || user.Role != "admin")
            return Results.Json(new { error = "Admin access required" }, statusCode: 403);

        Database.EnsureDatabase();
        using var conn = Database.Open();
        var count = ScalarCount(conn);
        return Results.Json(new { seeded = count > 0, count });
    }

    private static IResult Seed(HttpContext ctx)
    {
        // Anyone signed in may trigger the non-destructive backfill; only an
        // admin may wipe and reseed (force=true).
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null)
            return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        try
        {
            using var conn = Database.Open();
            // Honor ?force=true (curl) and a JSON body ({"force": true}) like the original route.
            var force = ctx.Request.Query["force"].ToString() == "true";
            using var reader = new StreamReader(ctx.Request.Body);
            var body = reader.ReadToEndAsync().GetAwaiter().GetResult();
            if (!string.IsNullOrWhiteSpace(body))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("force", out var f) &&
                        f.ValueKind == System.Text.Json.JsonValueKind.True)
                        force = true;
                }
                catch (System.Text.Json.JsonException) { /* malformed body → default */ }
            }
            if (force && user.Role != "admin")
                return Results.Json(new { error = "Admin access required to reset demo data" }, statusCode: 403);

            var result = SeedLogic.SeedDatabase(conn, force);
            return Results.Json(new { success = result.Success, message = result.Message, count = result.Count });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[seed] error: {ex}");
            return Results.Json(new { error = "Failed to seed database", details = ex.Message }, statusCode: 500);
        }
    }

    private static long ScalarCount(NpgsqlConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM users";
        var v = cmd.ExecuteScalar();
        return v is null or DBNull ? 0 : Convert.ToInt64(v, System.Globalization.CultureInfo.InvariantCulture);
    }
}
