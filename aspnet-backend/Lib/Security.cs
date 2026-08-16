using System.Collections.Concurrent;

namespace VscmsErp.Api.Lib;

/// <summary>
/// Security layer for the VSCMS ERP API:
///  - in-memory brute-force lockout per email (5 failures / 15 min window)
///  - security response headers (CSP, X-Frame-Options, HSTS, ...)
///  - CSRF defense: state-changing requests with a foreign Origin are rejected
///  - CORS origin allow-list (configure via ALLOWED_ORIGINS env, comma separated)
/// </summary>
public static class Security
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockWindow = TimeSpan.FromMinutes(15);

    private sealed class Attempt
    {
        public int Count;
        public DateTimeOffset WindowStart = DateTimeOffset.UtcNow;
    }

    private static readonly ConcurrentDictionary<string, Attempt> FailedLogins = new();

    private static readonly string[] DefaultOrigins =
    [
        "http://localhost:3000",
        "http://localhost:5199",
        "http://192.168.29.254:3000",
    ];

    /// <summary>Origins allowed for CORS and cross-origin state-changing requests.</summary>
    public static string[] AllowedOrigins { get; private set; } = DefaultOrigins;

    /// <summary>
    /// Reads ALLOWED_ORIGINS (comma separated) and merges it over the dev defaults.
    /// Call once at startup, before CORS is registered.
    /// </summary>
    public static void ConfigureOrigins()
    {
        var env = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
        if (string.IsNullOrWhiteSpace(env)) return;
        var list = new List<string>(DefaultOrigins);
        foreach (var origin in env.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!list.Contains(origin, StringComparer.OrdinalIgnoreCase))
                list.Add(origin);
        }
        AllowedOrigins = [.. list];
    }

    // ------------------------------------------------------------------
    // Login brute-force lockout (in-memory; fine for a single instance).
    // ------------------------------------------------------------------

    public static bool IsLoginLocked(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        var key = email.Trim().ToLowerInvariant();
        if (!FailedLogins.TryGetValue(key, out var attempt)) return false;
        if (DateTimeOffset.UtcNow - attempt.WindowStart > LockWindow)
        {
            FailedLogins.TryRemove(key, out _);
            return false;
        }
        return attempt.Count >= MaxFailedAttempts;
    }

    public static void RecordFailedLogin(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return;
        var key = email.Trim().ToLowerInvariant();
        var attempt = FailedLogins.GetOrAdd(key, _ => new Attempt());
        lock (attempt)
        {
            if (DateTimeOffset.UtcNow - attempt.WindowStart > LockWindow)
            {
                attempt.Count = 1;
                attempt.WindowStart = DateTimeOffset.UtcNow;
            }
            else
            {
                attempt.Count++;
            }
        }
    }

    public static void ClearFailedLogins(string email)
    {
        if (!string.IsNullOrWhiteSpace(email))
            FailedLogins.TryRemove(email.Trim().ToLowerInvariant(), out _);
    }

    // ------------------------------------------------------------------
    // Middleware
    // ------------------------------------------------------------------

    /// <summary>Hardening response headers on every API response.</summary>
    public static async Task SecurityHeaders(HttpContext ctx, Func<Task> next)
    {
        var headers = ctx.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "DENY";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        // API responses are JSON only; block any embedded content.
        headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
        if (ctx.Request.IsHttps)
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        await next();
    }

    /// <summary>
    /// CSRF defense in depth: for state-changing methods, reject requests that
    /// carry an Origin header which is not on the allow-list. Same-origin proxy
    /// calls (the Vercel/Next.js rewrite) carry no Origin header, so they pass.
    /// </summary>
    public static async Task OriginCheck(HttpContext ctx, Func<Task> next)
    {
        if (ctx.Request.Method is not ("GET" or "HEAD" or "OPTIONS"))
        {
            var origin = ctx.Request.Headers.Origin.ToString();
            if (!string.IsNullOrEmpty(origin) && !AllowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
            {
                ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
                await ctx.Response.WriteAsJsonAsync(new { error = "Cross-origin request blocked" });
                return;
            }
        }
        await next();
    }

    /// <summary>Real client IP, honoring X-Forwarded-For set by Render/Vercel proxies.</summary>
    public static string ClientIp(HttpContext ctx)
    {
        var forwarded = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwarded))
            return forwarded.Split(',')[0].Trim();
        return ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
