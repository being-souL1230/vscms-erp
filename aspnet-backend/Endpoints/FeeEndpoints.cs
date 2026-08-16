using System.Text.Json;
using Npgsql;
using VscmsErp.Api.Auth;
using VscmsErp.Api.Data;

namespace VscmsErp.Api.Endpoints;

/// <summary>
/// Fee endpoints ported from src/app/api/fees/route.ts, fee-payments/route.ts
/// and fees/generate/route.ts invoices, partial/full payments with an
/// audit trail, and batch invoice generation from the fee structure.
/// </summary>
public static class FeeEndpoints
{
    public static IEndpointRouteBuilder MapFeeEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListInvoices);
        app.MapPost("/", CreateInvoice);
        app.MapPut("/", PayFee);
        app.MapPost("/generate", GenerateInvoices);
        return app;
    }

    public static IEndpointRouteBuilder MapFeePaymentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/", ListPayments);
        return app;
    }

    // ---- GET /api/fees ----

    private static IResult ListInvoices(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM fee_records WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM fee_records ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<FeeRecordDto>();
        while (reader.Read()) list.Add(FeeRecordDto.Map(reader));
        return Results.Json(list);
    }

    // ---- POST /api/fees ----

    private static IResult CreateInvoice(HttpContext ctx, FeeCreateRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO fee_records (student_id, student_name, roll_no, fee_type, amount, due_date, status, course_code, course_name, semester, paid_amount)
            VALUES (@sid, @sname, @rollNo, @feeType, @amount, @dueDate, 'pending', @courseCode, @courseName, @semester, '0') RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", body.StudentId ?? 0);
        cmd.Parameters.AddWithValue("@sname", body.StudentName ?? "");
        cmd.Parameters.AddWithValue("@rollNo", body.RollNo ?? "");
        cmd.Parameters.AddWithValue("@feeType", body.FeeType ?? "");
        // Amount arrives as a string from the UI but may be a JSON number from
        // other clients; accept both instead of failing JSON binding.
        var amount = body.Amount is { } amt
            ? (amt.ValueKind == JsonValueKind.Number ? amt.GetRawText() : amt.GetString() ?? "")
            : "";
        cmd.Parameters.AddWithValue("@amount", amount);
        cmd.Parameters.AddWithValue("@dueDate", string.IsNullOrEmpty(body.DueDate) ? "2026-04-15" : body.DueDate);
        cmd.Parameters.AddWithValue("@courseCode", (object?)body.CourseCode ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@courseName", (object?)body.CourseName ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@semester", (object?)(body.Semester is > 0 ? body.Semester.Value : (long?)null) ?? DBNull.Value);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));

        return Results.Json(LoadFeeRecord(conn, id));
    }

    // ---- PUT /api/fees (pay or part-pay an invoice) ----

    private static IResult PayFee(HttpContext ctx, FeePayRequest body)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "edit"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        if (body.Id is null)
            return Results.Json(new { error = "Fee Record ID is required" }, statusCode: 400);

        // Students may only pay their own invoices.
        var record = LoadFeeRecord(conn, body.Id.Value, user);
        if (record is null)
            return Results.Json(new { error = "Fee record not found" }, statusCode: 404);

        var total = ParseMoney(record.Amount);
        var alreadyPaid = ParseMoney(record.PaidAmount);
        var remaining = Math.Max(0, total - alreadyPaid);
        // The frontend sends a JSON number for amount (e.g. 2500); null means
        // "pay the full remaining balance".
        var requested = body.Amount ?? remaining;
        if (requested <= 0)
            return Results.Json(new { error = "Payment amount must be a positive number" }, statusCode: 400);
        var payAmount = Math.Min(remaining, requested);
        if (payAmount <= 0)
            return Results.Json(new { error = "Nothing to pay this invoice is already settled" }, statusCode: 400);

        var newPaid = Math.Min(total, alreadyPaid + payAmount);
        var fullyPaid = newPaid >= total;
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var receiptNumber = $"REC-VSCMS-2026-{Random.Shared.Next(1000, 10000)}";
        var method = string.IsNullOrEmpty(body.PaymentMethod) ? "Online Gateway (Card / NetBanking / UPI)" : body.PaymentMethod;
        var status = fullyPaid ? "paid" : string.CompareOrdinal(record.DueDate, today) < 0 ? "overdue" : "pending";

        using var tx = conn.BeginTransaction();
        using (var ins = conn.CreateCommand())
        {
            ins.Transaction = tx;
            ins.CommandText = """
                INSERT INTO fee_payments (fee_record_id, student_id, student_name, amount, payment_method, receipt_number, paid_at, collected_by, collected_by_id)
                VALUES (@fid, @sid, @sname, @amount, @method, @receipt, @paidAt, @collectedBy, @collectedById)
                """;
            ins.Parameters.AddWithValue("@fid", record.Id);
            ins.Parameters.AddWithValue("@sid", record.StudentId);
            ins.Parameters.AddWithValue("@sname", record.StudentName);
            ins.Parameters.AddWithValue("@amount", payAmount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            ins.Parameters.AddWithValue("@method", method);
            ins.Parameters.AddWithValue("@receipt", receiptNumber);
            ins.Parameters.AddWithValue("@paidAt", today);
            ins.Parameters.AddWithValue("@collectedBy", user.Name);
            ins.Parameters.AddWithValue("@collectedById", user.Id);
            ins.ExecuteNonQuery();
        }
        using (var upd = conn.CreateCommand())
        {
            upd.Transaction = tx;
            upd.CommandText = """
                UPDATE fee_records SET
                  paid_amount = @paidAmount, status = @status, paid_date = @paidDate,
                  receipt_number = @receipt, payment_method = @method, collected_by = @collectedBy, collected_at = @collectedAt
                WHERE id = @id
                """;
            upd.Parameters.AddWithValue("@paidAmount", newPaid.ToString("F2", System.Globalization.CultureInfo.InvariantCulture));
            upd.Parameters.AddWithValue("@status", status);
            upd.Parameters.AddWithValue("@paidDate", (object?)(fullyPaid ? today : record.PaidDate) ?? DBNull.Value);
            upd.Parameters.AddWithValue("@receipt", receiptNumber);
            upd.Parameters.AddWithValue("@method", method);
            upd.Parameters.AddWithValue("@collectedBy", user.Name);
            upd.Parameters.AddWithValue("@collectedAt", today);
            upd.Parameters.AddWithValue("@id", record.Id);
            upd.ExecuteNonQuery();
        }
        tx.Commit();

        return Results.Json(LoadFeeRecord(conn, record.Id)!);
    }

    // ---- GET /api/fee-payments ----

    private static IResult ListPayments(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "view"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        using var cmd = conn.CreateCommand();
        cmd.CommandText = user.Role == "student"
            ? "SELECT * FROM fee_payments WHERE student_id = @id ORDER BY id DESC"
            : "SELECT * FROM fee_payments ORDER BY id DESC";
        if (user.Role == "student") cmd.Parameters.AddWithValue("@id", user.Id);

        using var reader = cmd.ExecuteReader();
        var list = new List<FeePaymentDto>();
        while (reader.Read()) list.Add(FeePaymentDto.Map(reader));
        return Results.Json(list);
    }

    // ---- POST /api/fees/generate ----

    private static IResult GenerateInvoices(HttpContext ctx)
    {
        var user = AuthService.GetCurrentUser(ctx.Request);
        if (user is null) return Results.Json(new { error = "Authentication required" }, statusCode: 401);

        using var conn = Database.Open();
        if (!Permissions.Can(conn, user, "fees", "create"))
            return Results.Json(new { error = "Access denied" }, statusCode: 403);

        var created = GenerateFeeInvoices(conn);
        return Results.Json(new { success = true, created });
    }

    /// <summary>
    /// Auto-generate pending fee invoices from the course-wise fee structure
    /// (port of src/lib/fees.ts). Idempotent: never duplicates an invoice for
    /// the same student + course + semester + fee type.
    /// </summary>
    public static int GenerateFeeInvoices(NpgsqlConnection conn)
    {
        var structures = QueryRows(conn, "SELECT * FROM fee_structures", r => (code: Row.S(r, "course_code"), name: Row.S(r, "course_name"), semester: Row.L(r, "semester"), feeType: Row.S(r, "fee_type"), amount: Row.S(r, "amount"), dueDate: Row.S(r, "due_date")));
        if (structures.Count == 0) return 0;

        var enrolls = QueryRows(conn, "SELECT * FROM enrollments", r => (
            studentId: Row.L(r, "student_id"), studentName: Row.S(r, "student_name"),
            courseCode: Row.S(r, "course_code"), semester: Row.L(r, "semester"), status: Row.S(r, "status")))
            .Where(e => e.status == "active")
            .ToList();
        if (enrolls.Count == 0) return 0;

        var existing = QueryRows(conn, "SELECT * FROM fee_records", r => (
            studentId: Row.L(r, "student_id"), courseCode: Row.NS(r, "course_code"),
            semester: Row.NL(r, "semester"), feeType: Row.S(r, "fee_type")));

        var rollNos = new Dictionary<long, string>();
        using (var u = conn.CreateCommand())
        {
            u.CommandText = "SELECT id, roll_no_or_emp_id FROM users";
            using var reader = u.ExecuteReader();
            while (reader.Read()) rollNos[(long)reader["id"]] = (string)reader["roll_no_or_emp_id"];
        }

        var created = 0;
        foreach (var en in enrolls)
        {
            foreach (var s in structures)
            {
                if (s.code != en.courseCode || s.semester != en.semester) continue;
                var hasInvoice = existing.Any(f =>
                    f.studentId == en.studentId &&
                    (f.courseCode ?? "") == en.courseCode &&
                    (f.semester ?? 0) == en.semester &&
                    f.feeType == s.feeType);
                if (hasInvoice) continue;

                Database.Exec(conn, """
                    INSERT INTO fee_records (student_id, student_name, roll_no, fee_type, amount, due_date, status, course_code, course_name, semester, paid_amount)
                    VALUES (@sid, @sname, @rollNo, @feeType, @amount, @dueDate, 'pending', @courseCode, @courseName, @semester, '0')
                    """,
                    ("@sid", en.studentId), ("@sname", en.studentName),
                    ("@rollNo", rollNos.TryGetValue(en.studentId, out var rn) ? rn : ""),
                    ("@feeType", s.feeType), ("@amount", s.amount), ("@dueDate", s.dueDate),
                    ("@courseCode", en.courseCode), ("@courseName", s.name), ("@semester", en.semester));
                created++;
            }
        }
        return created;
    }

    // ---- helpers ----

    private static List<T> QueryRows<T>(NpgsqlConnection conn, string sql, Func<NpgsqlDataReader, T> map)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        using var reader = cmd.ExecuteReader();
        var list = new List<T>();
        while (reader.Read()) list.Add(map(reader));
        return list;
    }

    private static double ParseMoney(string v) =>
        double.TryParse(v, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var n) ? n : 0;

    private static FeeRecordDto? LoadFeeRecord(NpgsqlConnection conn, long id, UserDto? user = null)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = user?.Role == "student"
            ? "SELECT * FROM fee_records WHERE id = @id AND student_id = @uid"
            : "SELECT * FROM fee_records WHERE id = @id";
        cmd.Parameters.AddWithValue("@id", id);
        if (user?.Role == "student") cmd.Parameters.AddWithValue("@uid", user.Id);
        using var reader = cmd.ExecuteReader();
        return reader.Read() ? FeeRecordDto.Map(reader) : null;
    }

    public sealed record FeeCreateRequest(
        long? StudentId, string? StudentName, string? RollNo, string? FeeType, JsonElement? Amount,
        string? DueDate, string? CourseCode, string? CourseName, long? Semester);

    public sealed record FeePayRequest(long? Id, double? Amount, string? PaymentMethod);
}
