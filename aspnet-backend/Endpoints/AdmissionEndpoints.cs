using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Admissions endpoints ported from src/app/api/admissions/route.ts.
/// Students fill their own record (admin issues the admission number/date);
/// upsert by student id.
/// </summary>
public static class AdmissionEndpoints
{
    public static IEndpointRouteBuilder MapAdmissionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", List);
        app.MapPost("/", Save);
        app.MapPut("/", Update);
        return app;
    }

    private static IResult List(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM admissions WHERE student_id = @id"
            : "SELECT * FROM admissions";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<AdmissionDto>();
        while (reader.Read()) list.Add(AdmissionDto.Map(reader));
        return Results.Json(list);
    }

    private static IResult Save(HttpContext ctx, AdmissionRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);
        if (user.Role != "admin" && user.Role != "student")
            return Results.Json(new { error = "Admin or student access required" }, statusCode: 403);

        using var conn = Database.Open();
        var studentId = user.Role == "admin" ? (body.StudentId ?? user.Id) : user.Id;
        var isAdmin = user.Role == "admin";
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var admissionNumber = isAdmin
            ? (string.IsNullOrEmpty(body.AdmissionNumber) ? $"ADM-2026-{1000 + studentId}" : body.AdmissionNumber)
            : $"ADM-2026-{1000 + studentId}";
        var admissionDate = isAdmin
            ? (string.IsNullOrEmpty(body.AdmissionDate) ? today : body.AdmissionDate)
            : today;
        var isHosteler = body.IsHosteler is > 0 ? 1 : 0;

        // Upsert by student id.
        var existing = GetByStudent(conn, studentId);
        if (existing is not null)
        {
            Database.Exec(conn, """
                UPDATE admissions SET
                  admission_number = @admNo, admission_date = @admDate, category = @category,
                  previous_institution = @prevInst, father_name = @father, mother_name = @mother,
                  guardian_phone = @guardian, blood_group = @blood, address = @address, is_hosteler = @isHosteler
                WHERE student_id = @sid
                """,
                ("@admNo", admissionNumber), ("@admDate", admissionDate),
                ("@category", string.IsNullOrEmpty(body.Category) ? "General" : body.Category),
                ("@prevInst", (object?)(body.PreviousInstitution ?? null) ?? DBNull.Value),
                ("@father", (object?)(body.FatherName ?? null) ?? DBNull.Value),
                ("@mother", (object?)(body.MotherName ?? null) ?? DBNull.Value),
                ("@guardian", (object?)(body.GuardianPhone ?? null) ?? DBNull.Value),
                ("@blood", (object?)(body.BloodGroup ?? null) ?? DBNull.Value),
                ("@address", (object?)(body.Address ?? null) ?? DBNull.Value),
                ("@isHosteler", isHosteler), ("@sid", studentId));
        }
        else
        {
            Database.Exec(conn, """
                INSERT INTO admissions (student_id, admission_number, admission_date, category, previous_institution, father_name, mother_name, guardian_phone, blood_group, address, is_hosteler)
                VALUES (@sid, @admNo, @admDate, @category, @prevInst, @father, @mother, @guardian, @blood, @address, @isHosteler)
                """,
                ("@sid", studentId), ("@admNo", admissionNumber), ("@admDate", admissionDate),
                ("@category", string.IsNullOrEmpty(body.Category) ? "General" : body.Category),
                ("@prevInst", (object?)(body.PreviousInstitution ?? null) ?? DBNull.Value),
                ("@father", (object?)(body.FatherName ?? null) ?? DBNull.Value),
                ("@mother", (object?)(body.MotherName ?? null) ?? DBNull.Value),
                ("@guardian", (object?)(body.GuardianPhone ?? null) ?? DBNull.Value),
                ("@blood", (object?)(body.BloodGroup ?? null) ?? DBNull.Value),
                ("@address", (object?)(body.Address ?? null) ?? DBNull.Value),
                ("@isHosteler", isHosteler));
        }

        return Results.Json(GetByStudent(conn, studentId)!);
    }

    private static IResult Update(HttpContext ctx, AdmissionUpdateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        var studentId = user.Role == "admin" ? (body.StudentId ?? user.Id) : user.Id;
        if (user.Role != "admin" && studentId != user.Id)
            return Results.Json(new { error = "You can only update your own admission details" }, statusCode: 403);

        using var conn = Database.Open();
        var current = GetByStudent(conn, studentId);
        if (current is null) return Results.Json(new { error = "No admission record found for this student" }, statusCode: 404);

        Database.Exec(conn, """
            UPDATE admissions SET
              category = @category, previous_institution = @prevInst, father_name = @father,
              mother_name = @mother, guardian_phone = @guardian, blood_group = @blood,
              address = @address, is_hosteler = @isHosteler
            WHERE student_id = @sid
            """,
            ("@category", body.Category ?? current.Category),
            ("@prevInst", (object?)(body.PreviousInstitution ?? current.PreviousInstitution) ?? DBNull.Value),
            ("@father", (object?)(body.FatherName ?? current.FatherName) ?? DBNull.Value),
            ("@mother", (object?)(body.MotherName ?? current.MotherName) ?? DBNull.Value),
            ("@guardian", (object?)(body.GuardianPhone ?? current.GuardianPhone) ?? DBNull.Value),
            ("@blood", (object?)(body.BloodGroup ?? current.BloodGroup) ?? DBNull.Value),
            ("@address", (object?)(body.Address ?? current.Address) ?? DBNull.Value),
            ("@isHosteler", body.IsHosteler is not null ? (body.IsHosteler > 0 ? 1 : 0) : current.IsHosteler),
            ("@sid", studentId));

        return Results.Json(GetByStudent(conn, studentId)!);
    }

    private static AdmissionDto? GetByStudent(NpgsqlConnection conn, long studentId)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT * FROM admissions WHERE student_id = @sid LIMIT 1";
        cmd.Parameters.AddWithValue("@sid", studentId);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? AdmissionDto.Map(reader) : null;
    }

    public sealed record AdmissionRequest(
        long? StudentId, string? AdmissionNumber, string? AdmissionDate, string? Category,
        string? PreviousInstitution, string? FatherName, string? MotherName, string? GuardianPhone,
        string? BloodGroup, string? Address, long? IsHosteler);

    public sealed record AdmissionUpdateRequest(
        long? StudentId, string? Category, string? PreviousInstitution, string? FatherName, string? MotherName,
        string? GuardianPhone, string? BloodGroup, string? Address, long? IsHosteler);
}
