using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using VscmsErp.Api.Data;
using VscmsErp.Api.Endpoints;
using VscmsErp.Api.Lib;

// Load the gitignored .env file for local development (DATABASE_URL etc.).
// Real environment variables always win over .env values, so production
// (Render/Fly) is unaffected.
LoadDotEnv();

// CORS allow-list: merge ALLOWED_ORIGINS env over localhost dev defaults.
Security.ConfigureOrigins();

var builder = WebApplication.CreateBuilder(args);

// Trust proxy headers (X-Forwarded-For / X-Forwarded-Proto) so per-IP rate
// limiting and the Secure cookie flag work behind the Render/Vercel proxies.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // Accept forwarded headers from any proxy (Render sets them itself).
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// CORS: only the allow-listed origins may call the API directly. The Next.js
// UI talks to the API through a same-origin rewrite, so this is only needed
// for direct cross-origin testing/consumers.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(Security.AllowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Rate limiting: every request is capped per IP (120/min); login is stricter
// (10 per 15 min) to blunt brute-force attacks. On top of that, the login
// endpoint itself locks an email after 5 failed attempts (see Security.cs).
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (ctx, _) =>
    {
        ctx.HttpContext.Response.Headers.RetryAfter = "60";
        await ctx.HttpContext.Response.WriteAsJsonAsync(
            new { error = "Too many requests. Please try again later." });
    };
    // 300 req/min per IP: the UI fans out ~25 parallel requests per page load
    // (plus a couple of retries while the server wakes from idle), so keep the
    // cap generous while still blocking abusive clients.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(
        ctx => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: Security.ClientIp(ctx),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
    options.AddFixedWindowLimiter("login", policy =>
    {
        policy.PermitLimit = 10;
        policy.Window = TimeSpan.FromMinutes(15);
        policy.QueueLimit = 0;
    });
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseCors();

// Unhandled exceptions become JSON { error } instead of the default HTML error
// page. Internal details are only exposed outside Production.
var isProduction = string.Equals(
    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
    "Production", StringComparison.OrdinalIgnoreCase);
app.Use(async (ctx, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[api] error: {ex}");
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        // One anonymous type so TValue inference works; internal details only
        // leak outside Production.
        await ctx.Response.WriteAsJsonAsync(new
        {
            error = "Internal server error",
            details = isProduction ? null : ex.Message,
        });
    }
});

// Security headers + CSRF origin check on every response.
app.Use(Security.SecurityHeaders);
app.Use(Security.OriginCheck);

// Per-IP rate limiting (global 120/min + login policy on auth routes).
app.UseRateLimiter();

// Request log makes it obvious in the console that the Next.js proxy is
// forwarding /api/* calls here (ASP.NET doesn't log every request by default).
app.Use(async (ctx, next) =>
{
    Console.WriteLine($"[api] {DateTimeOffset.Now:HH:mm:ss} {ctx.Request.Method} {ctx.Request.Path}{ctx.Request.QueryString}");
    await next();
});

// Self-healing startup, mirroring src/db/init.ts: create any missing tables
// so a fresh database works again.
Database.EnsureDatabase();
Console.WriteLine($"[db] connected to Postgres (DATABASE_URL set)");

// Bootstrap demo data on a fresh/empty database (non-destructive backfill;
// never wipes existing data). This keeps demo login working even before any
// signed-in user triggers the seed endpoint.
try
{
    SeedLogic.SeedDatabase(force: false);
    Console.WriteLine("[db] demo data ready");
}
catch (Exception ex)
{
    Console.WriteLine($"[db] seed skipped: {ex.Message}");
}

app.MapGet("/", () => Results.Json(new { service = "VSCMS ERP API", status = "ok" }));

app.MapGroup("/api/health").MapHealthEndpoints();
app.MapGroup("/api/auth").MapAuthEndpoints();
app.MapGroup("/api/students").MapStudentEndpoints();
app.MapGroup("/api/attendance").MapAttendanceEndpoints();
app.MapGroup("/api/grades").MapGradeEndpoints();
app.MapGroup("/api/internal-marks").MapInternalMarkEndpoints();
app.MapGroup("/api/fees").MapFeeEndpoints();
app.MapGroup("/api/fee-payments").MapFeePaymentEndpoints();
app.MapGroup("/api/courses").MapCourseEndpoints();
app.MapGroup("/api/departments").MapDepartmentEndpoints();
app.MapGroup("/api/notices").MapNoticeEndpoints();
app.MapGroup("/api/timetable").MapTimetableEndpoints();
app.MapGroup("/api/leaves").MapLeaveEndpoints();
app.MapGroup("/api").MapSetupEndpoints();
app.MapGroup("/api/faculty").MapFacultyEndpoints();
app.MapGroup("/api/admissions").MapAdmissionEndpoints();
app.MapGroup("/api/documents").MapDocumentEndpoints();
app.MapGroup("/api/exams").MapExamEndpoints();
app.MapGroup("/api/enrollments").MapEnrollmentEndpoints();
app.MapGroup("/api/fee-structures").MapFeeStructureEndpoints();
app.MapGroup("/api/faculty-attendance").MapFacultyAttendanceEndpoints();
app.MapGroup("/api/assignments").MapAssignmentEndpoints();
app.MapGroup("/api/exam-master").MapExamMasterEndpoints();
app.MapGroup("/api/permissions").MapPermissionEndpoints();
app.MapGroup("/api/profile").MapProfileEndpoints();
app.MapGroup("/api/users").MapUserEndpoints();
app.MapGroup("/api/seed").MapSeedEndpoints();

app.Run();

/// <summary>
/// Minimal .env loader: reads KEY=VALUE lines from the first .env found in
/// the working directory or the app base directory. Existing environment
/// variables are never overridden.
/// </summary>
static void LoadDotEnv()
{
    var candidates = new[] { ".env", Path.Combine(AppContext.BaseDirectory, ".env") };
    foreach (var path in candidates)
    {
        if (!File.Exists(path)) continue;
        foreach (var raw in File.ReadAllLines(path))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#')) continue;
            var eq = line.IndexOf('=');
            if (eq <= 0) continue;
            var key = line[..eq].Trim();
            var value = line[(eq + 1)..].Trim();
            if (Environment.GetEnvironmentVariable(key) is null)
                Environment.SetEnvironmentVariable(key, value);
        }
        break;
    }
}
