using VscmsErp.Api.Data;
using VscmsErp.Api.Endpoints;

// Load the gitignored .env file for local development (DATABASE_URL etc.).
// Real environment variables always win over .env values, so production
// (Render/Fly) is unaffected.
LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

// Dev-friendly CORS: the Next.js UI will call the API through a same-origin
// rewrite (no CORS needed), but allowing direct cross-origin calls keeps
// manual testing simple.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

// Request log — makes it obvious in the console that the Next.js proxy is
// forwarding /api/* calls here (ASP.NET doesn't log every request by default).
app.Use(async (ctx, next) =>
{
    Console.WriteLine($"[api] {DateTimeOffset.Now:HH:mm:ss} {ctx.Request.Method} {ctx.Request.Path}{ctx.Request.QueryString}");
    await next();
});

// Unhandled exceptions become JSON { error, details } like the Next.js routes,
// instead of the default HTML error page.
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
        await ctx.Response.WriteAsJsonAsync(new { error = "Internal server error", details = ex.Message });
    }
});

// Self-healing startup, mirroring src/db/init.ts: create any missing tables
// so a fresh database works again.
Database.EnsureDatabase();
Console.WriteLine($"[db] connected to Postgres (DATABASE_URL set)");

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
