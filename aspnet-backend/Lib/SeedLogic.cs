using System.Globalization;
using System.Text;
using static BCrypt.Net.BCrypt;
using Npgsql;
using VscmsErp.Api.Data;
using VscmsErp.Api.Endpoints;

namespace VscmsErp.Api.Lib;

/// <summary>Seed result shape, matching src/lib/seed.ts SeedResult.</summary>
public sealed record SeedResult(bool Success, string Message, long? Count = null);

/// <summary>
/// Full demo-data seeding routine, ported 1:1 from src/lib/seed.ts.
/// Used by /api/seed and safe to run repeatedly: without force it only
/// backfills newer modules on existing databases; with force it wipes
/// everything and writes fresh demo data.
/// </summary>
public static class SeedLogic
{
    private static readonly string[] Dates =
    ["2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13", "2026-03-16"];

    private static readonly string[] FacultyDates =
    ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06",
     "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"];

    private static readonly string[] ExamSeedRows =
    [
        "Mid-Term Examination 2026|Mid-Term|2026-04-08|2026-04-18|completed",
        "Sessional Test 2026|Sessional|2026-03-02|2026-03-06|completed",
        "Practical & Viva 2026|Practical|2026-04-20|2026-04-24|scheduled",
    ];

    private static readonly string[] Modules =
    ["students", "faculty", "courses", "departments", "fees", "notices", "timetable",
     "exams", "documents", "reports", "users", "attendance", "assignments", "leaves"];

    private static readonly string[] PermissionWriteModules =
    ["fees", "notices", "exams", "documents", "attendance", "assignments", "leaves"];

    public static SeedResult SeedDatabase(bool force)
    {
        using var conn = Database.Open();
        return SeedDatabase(conn, force);
    }

    public static SeedResult SeedDatabase(NpgsqlConnection conn, bool force)
    {
        var existingCount = ScalarLong(conn, "SELECT COUNT(*) FROM users");

        if (existingCount > 0 && !force)
        {
            // Backfill sub_role for existing users
            foreach (var u in SeedData.InitialUsers)
            {
                if (!string.IsNullOrEmpty(u.SubRole))
                {
                    Database.Exec(conn, "UPDATE users SET sub_role = @subRole WHERE email = @email AND (sub_role IS NULL OR sub_role = '')",
                        ("@subRole", u.SubRole), ("@email", u.Email));
                }
            }

            // Database already has users backfill the newer modules
            // (documents, exams, permissions, …) that may postdate the DB.
            var permCount = ScalarLong(conn, "SELECT COUNT(*) FROM permissions");
            var examDefCount = ScalarLong(conn, "SELECT COUNT(*) FROM exams");
            var marksCount = ScalarLong(conn, "SELECT COUNT(*) FROM internal_marks");
            var faCount = ScalarLong(conn, "SELECT COUNT(*) FROM faculty_attendance");

            if (faCount == 0)
            {
                // Faculty self-attendance register (added after this DB was first created).
                var facultyList = QueryRows(conn,
                    "SELECT id, name FROM users WHERE role = 'faculty'",
                    r => (id: Row.L(r, "id"), name: Row.S(r, "name")));
                foreach (var f in facultyList)
                    foreach (var d in FacultyDates)
                        Database.Exec(conn, """
                            INSERT INTO faculty_attendance (faculty_id, faculty_name, date, status, marked_by)
                            VALUES (@fid, @fname, @date, @status, 'Office of the Director')
                            """,
                            ("@fid", f.id), ("@fname", f.name), ("@date", d),
                            ("@status", Random.Shared.NextDouble() > 0.12 ? "present" : "absent"));
            }

            var studentRows = QueryRows(conn,
                "SELECT id, name, roll_no_or_emp_id, department, semester FROM users WHERE role = 'student'",
                r => new StudentRow(
                    Row.L(r, "id"), Row.S(r, "name"), Row.S(r, "roll_no_or_emp_id"),
                    Row.S(r, "department"), Row.NL(r, "semester")));
            var courseRows = QueryRows(conn,
                "SELECT id, code, name FROM courses",
                r => (id: Row.L(r, "id"), code: Row.S(r, "code"), name: Row.S(r, "name")));

            if (permCount == 0)
            {
                SeedExtras(conn, studentRows, courseRows);
            }
            else
            {
                // Permissions already exist from an older seed backfill the
                // safer defaults so server-side enforcement behaves the same.
                SyncPermissionDefaults(conn);
                if (examDefCount == 0 && marksCount == 0)
                    SeedExamModule(conn, studentRows, courseRows);
            }

            SeedFeeModule(conn);
            SeedCompetitions(conn);

            var passwordHash = HashPassword("demo12345", 12);
            Database.Exec(conn,
                "UPDATE users SET password_hash = @hash WHERE password_hash = ''", ("@hash", passwordHash));

            return new SeedResult(true, "Database already seeded", existingCount);
        }

        if (force)
        {
            foreach (var table in new[]
            {
                "attendance", "faculty_attendance", "grades", "fee_records", "fee_payments",
                "fee_structures", "leave_requests", "assignment_submissions", "assignments",
                "timetable", "notices", "courses", "departments", "users", "admissions",
                "documents", "enrollments", "sections", "semesters", "academic_sessions",
                "exam_schedules", "exams", "internal_marks", "permissions",
            })
                Database.Exec(conn, $"DELETE FROM \"{table}\"");
        }

        var password = HashPassword("demo12345", 12);

        // ---- users ----
        foreach (var u in SeedData.InitialUsers)
            Database.Exec(conn, """
                INSERT INTO users (name, email, role, sub_role, roll_no_or_emp_id, department, semester,
                                   designation, phone, avatar_url, gpa, status, password_hash)
                VALUES (@name, @email, @role, @subRole, @rollNo, @department, @semester,
                        @designation, @phone, @avatarUrl, @gpa, @status, @hash)
                """,
                ("@name", u.Name), ("@email", u.Email), ("@role", u.Role), ("@subRole", (object?)u.SubRole ?? DBNull.Value),
                ("@rollNo", u.RollNo), ("@department", u.Department), ("@semester", (object?)u.Semester ?? DBNull.Value),
                ("@designation", (object?)u.Designation ?? DBNull.Value), ("@phone", u.Phone),
                ("@avatarUrl", u.AvatarUrl), ("@gpa", (object?)u.Gpa ?? DBNull.Value),
                ("@status", u.Status), ("@hash", password));

        // ---- departments ----
        foreach (var d in SeedData.InitialDepartments)
            Database.Exec(conn, """
                INSERT INTO departments (code, name, head_of_department, location, student_count, faculty_count)
                VALUES (@code, @name, @head, @location, @students, @faculty)
                """,
                ("@code", d.Code), ("@name", d.Name), ("@head", d.Head),
                ("@location", d.Location), ("@students", d.Students), ("@faculty", d.Faculty));

        // ---- courses (faculty_name resolved to the real faculty user id) ----
        var facultyByName = new Dictionary<string, long>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT id, name FROM users WHERE role = 'faculty'";
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) facultyByName[(string)reader["name"]] = (long)reader["id"];
        }
        foreach (var c in SeedData.InitialCourses)
            Database.Exec(conn, """
                INSERT INTO courses (code, name, department, credits, semester, faculty_id, faculty_name,
                                     room, schedule, description)
                VALUES (@code, @name, @department, @credits, @semester, @facultyId, @facultyName,
                        @room, @schedule, @description)
                """,
                ("@code", c.Code), ("@name", c.Name), ("@department", c.Department),
                ("@credits", c.Credits), ("@semester", c.Semester),
                ("@facultyId", (object?)(facultyByName.TryGetValue(c.FacultyName, out var fid) ? fid : (long?)null) ?? DBNull.Value),
                ("@facultyName", c.FacultyName), ("@room", c.Room),
                ("@schedule", c.Schedule), ("@description", c.Description));

        // ---- notices ----
        foreach (var n in SeedData.InitialNotices)
            Database.Exec(conn, """
                INSERT INTO notices (title, content, category, priority, author_name, published_date)
                VALUES (@title, @content, @category, @priority, @author, @date)
                """,
                ("@title", n.Title), ("@content", n.Content), ("@category", n.Category),
                ("@priority", n.Priority), ("@author", n.Author), ("@date", n.PublishedDate));

        // ---- timetable ----
        var timetableRows = new (string Code, string Name, string Department, long Semester, string Day, string Start, string End, string Room, string Faculty)[]
        {
            ("BCA101", "Introduction to Programming", "BCA (CSJM)", 1, "Monday", "09:00 AM", "10:30 AM", "Lab 1 · LT-101", "Mr. Shivam Kr. Singh"),
            ("BCA201", "Data Structures & Algorithms", "BCA (CSJM)", 2, "Tuesday", "09:00 AM", "10:30 AM", "Lab 2 · LT-202", "Mr. Shivam Kr. Singh"),
            ("BCA301", "Database Management Systems", "BCA (CSJM)", 3, "Wednesday", "11:00 AM", "12:30 PM", "Lab 1 · LT-101", "Mr. Ayush Yadav"),
            ("MBA101", "Principles of Management", "MBA", 1, "Thursday", "11:00 AM", "12:30 PM", "Hall 1 · MH-101", "Mr. Prakhar Tiwari"),
            ("BBA101", "Business Communication", "BBA", 1, "Friday", "09:00 AM", "10:30 AM", "Hall 1 · MH-101", "Mrs. Shruti Agarwal"),
        };
        foreach (var t in timetableRows)
            Database.Exec(conn, """
                INSERT INTO timetable (course_code, course_name, department, semester, day_of_week,
                                       start_time, end_time, room, faculty_name)
                VALUES (@code, @name, @department, @semester, @day, @start, @end, @room, @faculty)
                """,
                ("@code", t.Code), ("@name", t.Name), ("@department", t.Department),
                ("@semester", t.Semester), ("@day", t.Day), ("@start", t.Start),
                ("@end", t.End), ("@room", t.Room), ("@faculty", t.Faculty));

        // ---- attendance ----
        var students = QueryRows(conn,
            "SELECT id, name, roll_no_or_emp_id, department, semester FROM users WHERE role = 'student' ORDER BY id",
            r => new StudentRow(
                Row.L(r, "id"), Row.S(r, "name"), Row.S(r, "roll_no_or_emp_id"),
                Row.S(r, "department"), Row.NL(r, "semester")));
        var insertedCourses = QueryRows(conn,
            "SELECT id, code, name FROM courses ORDER BY id",
            r => (id: Row.L(r, "id"), code: Row.S(r, "code"), name: Row.S(r, "name")));

        for (var idx = 0; idx < students.Count; idx++)
        {
            var s = students[idx];
            var course = insertedCourses[idx % insertedCourses.Count];
            var enrolled = idx == 0 && insertedCourses.Count > 1
                ? new[] { course, insertedCourses[1] }
                : new[] { course };
            // Demo: Rohan (idx 2) has poor attendance so the low-attendance alert shows.
            var absentRate = idx == 2 ? 0.45 : 0.16;
            foreach (var c in enrolled)
            {
                var cDates = Equals(c, course) ? Dates : Dates.Take(4).ToArray();
                foreach (var d in cDates)
                    Database.Exec(conn, """
                        INSERT INTO attendance (student_id, student_name, course_id, course_code, date,
                                                status, period, marked_by)
                        VALUES (@sid, @sname, @cid, @ccode, @date, @status, 'Lecture 1 (09:00 - 10:30)', 'Mr. Shivam Kr. Singh')
                        """,
                        ("@sid", s.Id), ("@sname", s.Name), ("@cid", c.id), ("@ccode", c.code),
                        ("@date", d), ("@status", Random.Shared.NextDouble() > absentRate ? "present" : "absent"));
            }
        }

        // ---- faculty self-attendance register ----
        var facultyRows = QueryRows(conn,
            "SELECT id, name FROM users WHERE role = 'faculty'",
            r => (id: Row.L(r, "id"), name: Row.S(r, "name")));
        foreach (var f in facultyRows)
            foreach (var d in FacultyDates)
                Database.Exec(conn, """
                    INSERT INTO faculty_attendance (faculty_id, faculty_name, date, status, marked_by)
                    VALUES (@fid, @fname, @date, @status, 'Office of the Director')
                    """,
                    ("@fid", f.id), ("@fname", f.name), ("@date", d),
                    ("@status", Random.Shared.NextDouble() > 0.12 ? "present" : "absent"));

        // ---- grades ----
        if (students.Count > 0)
        {
            var s0 = students[0];
            var s1 = students.Count > 1 ? students[1] : students[0];
            var sem0 = s0.Semester ?? 3;
            var sem1 = s1.Semester ?? 3;
            var c0 = insertedCourses[0];
            var c1 = insertedCourses.Count > 1 ? insertedCourses[1] : insertedCourses[0];
            var c2 = insertedCourses.Count > 2 ? insertedCourses[2] : insertedCourses[0];
            Database.Exec(conn, """
                INSERT INTO grades (student_id, student_name, course_id, course_name, exam_type,
                                    marks_obtained, max_marks, grade_letter, semester, remarks)
                VALUES (@sid, @sname, @cid, @cname, @examType, @obtained, @max, @grade, @semester, @remarks)
                """,
                ("@sid", s0.Id), ("@sname", s0.Name), ("@cid", c0.id),
                ("@cname", $"{c0.name} ({c0.code})"), ("@examType", "Mid-Term"),
                ("@obtained", "91.50"), ("@max", "100.00"), ("@grade", "A+"), ("@semester", sem0),
                ("@remarks", "Great work on the programming assignment."));
            Database.Exec(conn, """
                INSERT INTO grades (student_id, student_name, course_id, course_name, exam_type,
                                    marks_obtained, max_marks, grade_letter, semester, remarks)
                VALUES (@sid, @sname, @cid, @cname, @examType, @obtained, @max, @grade, @semester, @remarks)
                """,
                ("@sid", s0.Id), ("@sname", s0.Name), ("@cid", c2.id),
                ("@cname", $"{c2.name} ({c2.code})"), ("@examType", "Assignment"),
                ("@obtained", "86.00"), ("@max", "100.00"), ("@grade", "A"), ("@semester", sem0),
                ("@remarks", "Good effort. Improve the database design part."));
            Database.Exec(conn, """
                INSERT INTO grades (student_id, student_name, course_id, course_name, exam_type,
                                    marks_obtained, max_marks, grade_letter, semester, remarks)
                VALUES (@sid, @sname, @cid, @cname, @examType, @obtained, @max, @grade, @semester, @remarks)
                """,
                ("@sid", s1.Id), ("@sname", s1.Name), ("@cid", c1.id),
                ("@cname", $"{c1.name} ({c1.code})"), ("@examType", "Mid-Term"),
                ("@obtained", "95.00"), ("@max", "100.00"), ("@grade", "A+"), ("@semester", sem1),
                ("@remarks", "Excellent performance. Keep it up."));
        }

        // ---- fee records + payment history ----
        if (students.Count > 0)
        {
            var s0 = students[0];
            var s1 = students.Count > 1 ? students[1] : students[0];
            var c0 = insertedCourses[0];
            var c1 = insertedCourses.Count > 1 ? insertedCourses[1] : insertedCourses[0];
            var semOf = (StudentRow s) => s.Semester ?? 3;

            var fee1 = InsertFeeRecord(conn, s0, c0, "Sem 3 Tuition", "48000.00", "2026-03-31",
                "2026-02-26", "paid", "REC-VSCMS-2026-8941", "UPI", "48000.00");
            var fee2 = InsertFeeRecord(conn, s0, c0, "Lab & Library Fee", "6500.00", "2026-04-10",
                null, "pending", null, null, "0");
            var fee3 = InsertFeeRecord(conn, s1, c1, "Sem 3 Tuition", "48000.00", "2026-03-31",
                "2026-03-02", "paid", "REC-VSCMS-2026-8949", "UPI", "48000.00");

            // Payment history for the two settled invoices.
            foreach (var r in new[] { fee1, fee3 })
                Database.Exec(conn, """
                    INSERT INTO fee_payments (fee_record_id, student_id, student_name, amount,
                                              payment_method, receipt_number, paid_at)
                    VALUES (@fid, @sid, @sname, @amount, @method, @receipt, @paidAt)
                    """,
                    ("@fid", r.Id), ("@sid", r.StudentId), ("@sname", r.StudentName),
                    ("@amount", r.Amount),
                    ("@method", string.IsNullOrEmpty(r.PaymentMethod) ? "UPI" : r.PaymentMethod),
                    ("@receipt", string.IsNullOrEmpty(r.ReceiptNumber) ? $"REC-VSCMS-2026-{r.Id}" : r.ReceiptNumber),
                    ("@paidAt", string.IsNullOrEmpty(r.PaidDate) ? "2026-03-02" : r.PaidDate));
        }

        // ---- assignments + submission ----
        long assignment1 = 0;
        if (insertedCourses.Count > 0)
        {
            var a0 = insertedCourses[0];
            var a2 = insertedCourses.Count > 2 ? insertedCourses[2] : insertedCourses[0];
            assignment1 = InsertAssignment(conn, a0.id, $"{a0.name} ({a0.code})",
                "Python Assignment - Loops & Functions",
                "Write a Python program that uses loops and functions to solve a basic problem. Submit your .py file.",
                "2026-03-28", 50, "Mr. Shivam Kr. Singh");
            InsertAssignment(conn, a2.id, $"{a2.name} ({a2.code})",
                "Database Design Assignment",
                "Design a simple database for a library system. Submit the SQL schema and a short explanation.",
                "2026-04-05", 50, "Mr. Ayush Yadav");
        }

        if (students.Count > 0 && assignment1 > 0)
            Database.Exec(conn, """
                INSERT INTO assignment_submissions (assignment_id, student_id, student_name,
                                                    submission_text, file_url, status, marks, feedback)
                VALUES (@aid, @sid, @sname, @text, @url, 'graded', @marks, @feedback)
                """,
                ("@aid", assignment1), ("@sid", students[0].Id), ("@sname", students[0].Name),
                ("@text", "Python file attached. The program works correctly for all test cases."),
                ("@url", "https://vscms.edu/drive/aarav-python-assignment.py"),
                ("@marks", "47.00"), ("@feedback", "Good code structure. Add more comments for clarity."));

        // ---- leave requests ----
        if (students.Count > 1)
        {
            var s0 = students[0];
            var s1 = students[1];
            var s2 = students.Count > 2 ? students[2] : students[0];
            Database.Exec(conn, """
                INSERT INTO leave_requests (student_id, student_name, roll_no, department, from_date, to_date, reason, status)
                VALUES (@sid, @sname, @rollNo, @department, @from, @to, @reason, 'pending')
                """,
                ("@sid", s0.Id), ("@sname", s0.Name), ("@rollNo", s0.RollNo),
                ("@department", s0.Department), ("@from", "2026-03-20"), ("@to", "2026-03-22"),
                ("@reason", "Medical leave - doctor's appointment and recovery at home."));
            Database.Exec(conn, """
                INSERT INTO leave_requests (student_id, student_name, roll_no, department, from_date, to_date, reason, status)
                VALUES (@sid, @sname, @rollNo, @department, @from, @to, @reason, 'pending')
                """,
                ("@sid", s1.Id), ("@sname", s1.Name), ("@rollNo", s1.RollNo),
                ("@department", s1.Department), ("@from", "2026-03-24"), ("@to", "2026-03-24"),
                ("@reason", "Family function (sister's wedding). Will share photos on request."));
            Database.Exec(conn, """
                INSERT INTO leave_requests (student_id, student_name, roll_no, department, from_date, to_date,
                                            reason, status, reviewed_by, reviewed_at, remarks)
                VALUES (@sid, @sname, @rollNo, @department, @from, @to, @reason, 'approved',
                        'Dr. Tanya Mishra', '2026-03-04', 'Approved - good luck with the competition.')
                """,
                ("@sid", s2.Id), ("@sname", s2.Name), ("@rollNo", s2.RollNo),
                ("@department", s2.Department), ("@from", "2026-03-05"), ("@to", "2026-03-06"),
                ("@reason", "Represented the college at an inter-college debate competition."));
        }

        SeedExamModule(conn, students, insertedCourses);
        SeedExtras(conn, students, insertedCourses);
        SeedFeeModule(conn);
        SyncPermissionDefaults(conn);

        return new SeedResult(true, "Database seeded successfully");
    }

    // ---------- exam module demo data (idempotent only fills empty tables) ----------

    private static void SeedExamModule(NpgsqlConnection conn, List<StudentRow> students, List<(long id, string code, string name)> insertedCourses)
    {
        if (students.Count == 0 || insertedCourses.Count == 0) return;
        var examDefCount = ScalarLong(conn, "SELECT COUNT(*) FROM exams");
        var marksCount = ScalarLong(conn, "SELECT COUNT(*) FROM internal_marks");

        if (examDefCount == 0)
        {
            foreach (var row in ExamSeedRows)
            {
                var p = row.Split('|');
                Database.Exec(conn, """
                    INSERT INTO exams (name, exam_type, department, semester, session, start_date, end_date, status, passing_percent)
                    VALUES (@name, @type, 'BCA (CSJM)', 3, '2025-26', @start, @end, @status, 40)
                    """,
                    ("@name", p[0]), ("@type", p[1]), ("@start", p[2]), ("@end", p[3]), ("@status", p[4]));
            }
        }

        if (marksCount == 0)
        {
            var s0 = students[0];
            var s1 = students.Count > 1 ? students[1] : students[0];
            var s2 = students.Count > 2 ? students[2] : students[0];
            var c0 = insertedCourses[0];
            var c1 = insertedCourses.Count > 1 ? insertedCourses[1] : insertedCourses[0];
            // Workflow demo: published results (approved) vs pending (submitted)
            // vs in-progress (draft) sheets.
            InsertMark(conn, s0, c0, "Mid-Term", 26, 18);                    // approved
            InsertMark(conn, s0, c0, "Sessional", 9, 6);                     // approved · FAIL → backlog
            InsertMark(conn, s0, c0, "Practical", 12, 16, 30, 20, "draft");  // draft
            InsertMark(conn, s0, c1, "Mid-Term", 21, 15, 30, 20, "submitted"); // awaiting approval
            InsertMark(conn, s1, c1, "Mid-Term", 19, 14);                    // approved
            InsertMark(conn, s1, c1, "Sessional", 17, 12);                   // approved
            InsertMark(conn, s2, c0, "Mid-Term", 8, 5);                      // approved · FAIL → backlog
            InsertMark(conn, s2, c0, "Sessional", 16, 11);                   // approved
        }
    }

    private static void InsertMark(NpgsqlConnection conn, StudentRow s, (long id, string code, string name) c,
        string examType, int theory, int practical, int maxTheory = 30, int maxPractical = 20, string status = "approved")
    {
        var r = Grading.ComputeInternal(
            Grading.Num(theory), Grading.Num(practical),
            Grading.Num(maxTheory), Grading.Num(maxPractical), "40");
        Database.Exec(conn, """
            INSERT INTO internal_marks (student_id, student_name, course_id, course_code, course_name,
                                        exam_type, semester, theory_marks, practical_marks, max_theory,
                                        max_practical, total_marks, max_total, pass_marks, grade_letter,
                                        result, status, remarks)
            VALUES (@sid, @sname, @cid, @ccode, @cname, @examType, @semester, @theory, @practical,
                    @maxTheory, @maxPractical, @total, @maxTotal, @passMarks, @grade, @result, @status, @remarks)
            """,
            ("@sid", s.Id), ("@sname", s.Name), ("@cid", c.id), ("@ccode", c.code), ("@cname", c.name),
            ("@examType", examType), ("@semester", s.Semester ?? 3),
            ("@theory", Grading.Num(r.Theory)), ("@practical", Grading.Num(r.Practical)),
            ("@maxTheory", Grading.Num(r.MaxTheory)), ("@maxPractical", Grading.Num(r.MaxPractical)),
            ("@total", Grading.Num(r.Total)), ("@maxTotal", Grading.Num(r.MaxTotal)),
            ("@passMarks", Grading.Num(r.PassMarks)), ("@grade", r.GradeLetter), ("@result", r.Result),
            ("@status", status),
            ("@remarks", r.Result == "fail" ? "Backlog to be cleared in next attempt" : ""));
    }

    // ---------- new-module demo data: admissions, documents, enrollments,
    //    sections, semesters, academic sessions, exam schedule, permissions ----------

    private static void SeedExtras(NpgsqlConnection conn, List<StudentRow> students, List<(long id, string code, string name)> insertedCourses)
    {
        // ---- admissions ----
        if (students.Count > 0)
        {
            var s0 = students[0];
            var s1 = students.Count > 1 ? students[1] : students[0];
            var s2 = students.Count > 2 ? students[2] : students[0];
            var admissions = new (StudentRow s, string Category, string Previous, string Father, string Mother, string Phone, string Blood, string Address, long Hosteler)[]
            {
                (s0, "General", "St. Xavier's Higher Secondary School", "Rajesh Kumar Sharma", "Sunita Sharma",
                 "+91 98765 43210", "B+", "H-42, Sector 17, Noida, UP", 1),
                (s1, "OBC", "Delhi Public School, Vasant Kunj", "Mohammed Ansari", "Farida Ansari",
                 "+91 98110 22334", "O+", "B-12, Zakir Bagh, Okhla, New Delhi", 0),
                (s2, "SC", "DAV Public School, Ghaziabad", "Baldev Singh", "Kuldeep Kaur",
                 "+91 99110 99887", "A+", "C-7, Indirapuram, Ghaziabad, UP", 1),
            };
            foreach (var a in admissions)
            {
                // Mirrors `ADM-2025-${String(1000 + id).slice(-4)}` from the TS source.
                var suffix = (1000 + a.s.Id).ToString(CultureInfo.InvariantCulture);
                suffix = suffix.Length > 4 ? suffix[^4..] : suffix.PadLeft(4, '0');
                Database.Exec(conn, """
                    INSERT INTO admissions (student_id, admission_number, admission_date, category,
                                            previous_institution, father_name, mother_name, guardian_phone,
                                            blood_group, address, is_hosteler)
                    VALUES (@sid, @admNo, '2025-07-14', @category, @previous, @father, @mother, @phone,
                            @blood, @address, @hosteler)
                    """,
                    ("@sid", a.s.Id), ("@admNo", $"ADM-2025-{suffix}"),
                    ("@category", a.Category), ("@previous", a.Previous), ("@father", a.Father),
                    ("@mother", a.Mother), ("@phone", a.Phone), ("@blood", a.Blood),
                    ("@address", a.Address), ("@hosteler", a.Hosteler));
            }
        }

        // ---- documents ----
        if (students.Count > 0)
        {
            var s0 = students[0];
            var s1 = students.Count > 1 ? students[1] : students[0];
            var docs = new (StudentRow s, string Title, string Category, string Content)[]
            {
                (s0, "Aadhaar Card", "Identity", "Aadhaar: 3452 6789 1023\nName: Aarav Sharma"),
                (s0, "Class 12 Marksheet", "Academics", "CBSE Class XII - 92.4%\nSubjects: Physics, Chemistry, Maths, CS, English"),
                (s1, "Transfer Certificate", "Academics", "TC issued by DPS Vasant Kunj on 30-Jun-2025"),
            };
            foreach (var d in docs)
            {
                var content = d.Content;
                var fileName = string.Join("-", System.Text.RegularExpressions.Regex
                    .Replace(d.Title.ToLowerInvariant(), "[^a-z0-9]+", "-")
                    .Trim('-')) + ".txt";
                Database.Exec(conn, """
                    INSERT INTO documents (student_id, student_name, title, category, file_name, mime_type,
                                           file_size, data, status)
                    VALUES (@sid, @sname, @title, @category, @fileName, 'text/plain', @size, @data, 'verified')
                    """,
                    ("@sid", d.s.Id), ("@sname", d.s.Name), ("@title", d.Title),
                    ("@category", d.Category), ("@fileName", fileName), ("@size", content.Length),
                    ("@data", Convert.ToBase64String(Encoding.UTF8.GetBytes(content))));
            }
        }

        // ---- enrollments ----
        if (students.Count > 0 && insertedCourses.Count > 0)
        {
            for (var i = 0; i < students.Count; i++)
            {
                var c = insertedCourses[i % insertedCourses.Count];
                Database.Exec(conn, """
                    INSERT INTO enrollments (student_id, student_name, course_id, course_code, course_name, semester, status)
                    VALUES (@sid, @sname, @cid, @ccode, @cname, @semester, 'active')
                    """,
                    ("@sid", students[i].Id), ("@sname", students[i].Name),
                    ("@cid", c.id), ("@ccode", c.code), ("@cname", c.name),
                    ("@semester", students[i].Semester ?? 3));
            }
        }

        // ---- sections ----
        var sections = new (string Code, string Name, string Department, long Semester, string Room)[]
        {
            ("A", "Section A", "BCA (CSJM)", 1, "LT-101"),
            ("B", "Section B", "BCA (CSJM)", 1, "LT-102"),
            ("A", "Section A", "MBA", 1, "MH-101"),
            ("A", "Section A", "BBA", 1, "MH-102"),
        };
        foreach (var s in sections)
            Database.Exec(conn, """
                INSERT INTO sections (code, name, department, semester, room) VALUES (@code, @name, @department, @semester, @room)
                """,
                ("@code", s.Code), ("@name", s.Name), ("@department", s.Department),
                ("@semester", s.Semester), ("@room", s.Room));

        // ---- semesters ----
        for (var n = 1; n <= 6; n++)
            Database.Exec(conn, """
                INSERT INTO semesters (number, name, department, status, starts_on, ends_on)
                VALUES (@number, @name, 'BCA (CSJM)', @status, @startsOn, @endsOn)
                """,
                ("@number", (long)n), ("@name", $"Semester {n}"),
                ("@status", n == 3 ? "active" : "inactive"),
                ("@startsOn", (object?)(n == 3 ? "2026-01-05" : null) ?? DBNull.Value),
                ("@endsOn", (object?)(n == 3 ? "2026-05-30" : null) ?? DBNull.Value));

        // ---- academic sessions ----
        Database.Exec(conn, """
            INSERT INTO academic_sessions (name, start_date, end_date, is_current) VALUES ('2025-26', '2025-07-01', '2026-06-30', 1)
            """);
        Database.Exec(conn, """
            INSERT INTO academic_sessions (name, start_date, end_date, is_current) VALUES ('2024-25', '2024-07-01', '2025-06-30', 0)
            """);

        // ---- exam schedules ----
        var schedules = new (string Type, string Code, string Name, string Department, long Semester, string Date, string Start, string End, string Room)[]
        {
            ("Mid-Term", "BCA301", "Database Management Systems", "BCA (CSJM)", 3, "2026-04-08", "10:00 AM", "12:00 PM", "Hall 2 · MH-202"),
            ("Mid-Term", "BCA101", "Introduction to Programming", "BCA (CSJM)", 1, "2026-04-10", "10:00 AM", "12:00 PM", "Lab 1 · LT-101"),
            ("Final", "MBA101", "Principles of Management", "MBA", 1, "2026-05-12", "02:00 PM", "05:00 PM", "Hall 1 · MH-101"),
            ("Internal", "BBA101", "Business Communication", "BBA", 1, "2026-04-15", "11:00 AM", "12:30 PM", "Hall 3 · MH-103"),
        };
        foreach (var sc in schedules)
            Database.Exec(conn, """
                INSERT INTO exam_schedules (exam_type, course_code, course_name, department, semester,
                                            exam_date, start_time, end_time, room)
                VALUES (@type, @code, @name, @department, @semester, @date, @start, @end, @room)
                """,
                ("@type", sc.Type), ("@code", sc.Code), ("@name", sc.Name),
                ("@department", sc.Department), ("@semester", sc.Semester), ("@date", sc.Date),
                ("@start", sc.Start), ("@end", sc.End), ("@room", sc.Room));

        // ---- permissions matrix ----
        foreach (var mod in Modules)
        {
            // Admin is always fully allowed for every module (locked in the matrix UI).
            Database.Exec(conn, """
                INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete)
                VALUES ('admin', @module, 1, 1, 1, 1)
                """, ("@module", mod));

            var isUsersModule = mod == "users";
            long facultyCreate, facultyEdit, facultyDelete;
            if (mod == "timetable")
            {
                facultyCreate = 1; facultyEdit = 1; facultyDelete = 1;
            }
            else if (PermissionWriteModules.Contains(mod))
            {
                facultyCreate = 1; facultyEdit = 1; facultyDelete = 0;
            }
            else
            {
                facultyCreate = 0; facultyEdit = 0; facultyDelete = 0;
            }
            Database.Exec(conn, """
                INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete)
                VALUES ('faculty', @module, @view, @create, @edit, @delete)
                """,
                ("@module", mod), ("@view", isUsersModule ? 0L : 1L),
                ("@create", facultyCreate), ("@edit", facultyEdit), ("@delete", facultyDelete));

            // Students: self-service only upload/delete their own documents and
            // pay their own fees. The users module is admin-only for them too.
            Database.Exec(conn, """
                INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete)
                VALUES ('student', @module, @view, @create, @edit, @delete)
                """,
                ("@module", mod), ("@view", isUsersModule ? 0L : 1L),
                ("@create", mod is "documents" or "assignments" or "leaves" ? 1L : 0L),
                ("@edit", mod is "documents" or "fees" ? 1L : 0L),
                ("@delete", mod == "documents" ? 1L : 0L));
        }
    }

    // ---------- course-wise fee structure + invoice generation ----------

    private static void SeedFeeModule(NpgsqlConnection conn)
    {
        var existingStructures = ScalarLong(conn, "SELECT COUNT(*) FROM fee_structures");
        if (existingStructures == 0)
        {
            // Build the structure from the actual (course, semester) pairs
            // students are enrolled in, so every enrolled scholar matches.
            var combos = QueryRows(conn,
                "SELECT course_code, course_name, semester FROM enrollments",
                r => (code: Row.S(r, "course_code"), name: Row.S(r, "course_name"), semester: Row.L(r, "semester")))
                .GroupBy(e => $"{e.code}|{e.semester}")
                .Select(g => g.First())
                .ToList();
            foreach (var e in combos)
            {
                var amount = e.semester >= 3 ? "48000.00" : "42000.00";
                Database.Exec(conn, """
                    INSERT INTO fee_structures (course_code, course_name, semester, fee_type, amount, due_date)
                    VALUES (@code, @name, @semester, @feeType, @amount, '2026-03-31')
                    """,
                    ("@code", e.code), ("@name", e.name), ("@semester", e.semester),
                    ("@feeType", $"Sem {e.semester} Tuition"), ("@amount", amount));
                Database.Exec(conn, """
                    INSERT INTO fee_structures (course_code, course_name, semester, fee_type, amount, due_date)
                    VALUES (@code, @name, @semester, @feeType, @amount, '2026-04-10')
                    """,
                    ("@code", e.code), ("@name", e.name), ("@semester", e.semester),
                    ("@feeType", "Lab & Library Fee"), ("@amount", "6500.00"));
            }
        }
        FeeEndpoints.GenerateFeeInvoices(conn);
    }

    // ---------- permission-default backfill for existing DBs ----------

    private static void SyncPermissionDefaults(NpgsqlConnection conn)
    {
        var rows = QueryRows(conn, "SELECT id, role, module, can_view, can_create, can_edit, can_delete FROM permissions",
            r => new PermRow(Row.L(r, "id"), Row.S(r, "role"), Row.S(r, "module"),
                Row.L(r, "can_view"), Row.L(r, "can_create"), Row.L(r, "can_edit"), Row.L(r, "can_delete")));

        // users module → admin only (view + all actions revoked for faculty/student)
        foreach (var role in new[] { "faculty", "student" })
        {
            var existing = rows.FirstOrDefault(r => r.Role == role && r.Module == "users");
            if (existing is not null)
                Database.Exec(conn, "UPDATE permissions SET can_view = 0, can_create = 0, can_edit = 0, can_delete = 0 WHERE id = @id",
                    ("@id", existing.Id));
        }
        // student canEdit fees (pay own fee) + canDelete documents (delete own docs)
        var feeRow = rows.FirstOrDefault(r => r.Role == "student" && r.Module == "fees");
        if (feeRow is not null)
            Database.Exec(conn, "UPDATE permissions SET can_edit = 1 WHERE id = @id", ("@id", feeRow.Id));
        var docRow = rows.FirstOrDefault(r => r.Role == "student" && r.Module == "documents");
        if (docRow is not null)
            Database.Exec(conn, "UPDATE permissions SET can_delete = 1 WHERE id = @id", ("@id", docRow.Id));
        // faculty full timetable management
        var tt = rows.FirstOrDefault(r => r.Role == "faculty" && r.Module == "timetable");
        if (tt is not null)
            Database.Exec(conn, "UPDATE permissions SET can_create = 1, can_edit = 1, can_delete = 1 WHERE id = @id",
                ("@id", tt.Id));

        // attendance / assignments / leaves were added to the matrix later 
        // insert default rows for older DBs that predate them.
        foreach (var mod in new[] { "attendance", "assignments", "leaves" })
        {
            foreach (var role in new[] { "admin", "faculty", "student" })
            {
                if (rows.Any(r => r.Role == role && r.Module == mod)) continue;
                long create = 0, edit = 0, del = 0;
                if (role == "admin") { create = 1; edit = 1; del = 1; }
                else if (role == "faculty") { create = 1; edit = 1; del = 0; }
                else create = mod is "assignments" or "leaves" ? 1 : 0;
                Database.Exec(conn, """
                    INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete)
                    VALUES (@role, @module, 1, @create, @edit, @delete)
                    """,
                    ("@role", role), ("@module", mod), ("@create", create), ("@edit", edit), ("@delete", del));
            }
        }
    }

    // ---------- helpers ----------

    private sealed record StudentRow(long Id, string Name, string RollNo, string Department, long? Semester);
    private sealed record PermRow(long Id, string Role, string Module, long CanView, long CanCreate, long CanEdit, long CanDelete);

    private static long ScalarLong(NpgsqlConnection conn, string sql)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        var v = cmd.ExecuteScalar();
        return v is null or DBNull ? 0 : Convert.ToInt64(v, CultureInfo.InvariantCulture);
    }

    private static List<T> QueryRows<T>(NpgsqlConnection conn, string sql, Func<NpgsqlDataReader, T> map)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = sql;
        using var reader = cmd.ExecuteReader();
        var list = new List<T>();
        while (reader.Read()) list.Add(map(reader));
        return list;
    }

    private sealed record FeeSeedRow(long Id, long StudentId, string StudentName, string Amount,
        string? PaymentMethod, string? ReceiptNumber, string? PaidDate);

    private static FeeSeedRow InsertFeeRecord(NpgsqlConnection conn, StudentRow s, (long id, string code, string name) c,
        string feeType, string amount, string dueDate, string? paidDate, string status,
        string? receiptNumber, string? paymentMethod, string paidAmount)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO fee_records (student_id, student_name, roll_no, fee_type, amount, due_date, paid_date,
                                     status, receipt_number, payment_method, course_code, course_name, semester, paid_amount)
            VALUES (@sid, @sname, @rollNo, @feeType, @amount, @dueDate, @paidDate,
                    @status, @receipt, @method, @ccode, @cname, @semester, @paidAmount) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@sid", s.Id);
        cmd.Parameters.AddWithValue("@sname", s.Name);
        cmd.Parameters.AddWithValue("@rollNo", s.RollNo);
        cmd.Parameters.AddWithValue("@feeType", feeType);
        cmd.Parameters.AddWithValue("@amount", amount);
        cmd.Parameters.AddWithValue("@dueDate", dueDate);
        cmd.Parameters.AddWithValue("@paidDate", (object?)paidDate ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@status", status);
        cmd.Parameters.AddWithValue("@receipt", (object?)receiptNumber ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@method", (object?)paymentMethod ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ccode", c.code);
        cmd.Parameters.AddWithValue("@cname", c.name);
        cmd.Parameters.AddWithValue("@semester", s.Semester ?? 3);
        cmd.Parameters.AddWithValue("@paidAmount", paidAmount);
        var id = (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return new FeeSeedRow(id, s.Id, s.Name, amount, paymentMethod, receiptNumber, paidDate);
    }

    private static long InsertAssignment(NpgsqlConnection conn, long courseId, string courseName, string title,
        string description, string dueDate, long maxMarks, string facultyName)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO assignments (course_id, course_name, title, description, due_date, max_marks, faculty_name)
            VALUES (@cid, @cname, @title, @description, @dueDate, @maxMarks, @faculty) RETURNING id;
            """;
        cmd.Parameters.AddWithValue("@cid", courseId);
        cmd.Parameters.AddWithValue("@cname", courseName);
        cmd.Parameters.AddWithValue("@title", title);
        cmd.Parameters.AddWithValue("@description", description);
        cmd.Parameters.AddWithValue("@dueDate", dueDate);
        cmd.Parameters.AddWithValue("@maxMarks", maxMarks);
        cmd.Parameters.AddWithValue("@faculty", facultyName);
        return (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
        return (long)(cmd.ExecuteScalar() ?? throw new InvalidOperationException("Insert failed"));
    }

    private static void SeedCompetitions(NpgsqlConnection conn)
    {
        var count = ScalarLong(conn, "SELECT COUNT(*) FROM competitions");
        if (count > 0) return;

        using var cmd = conn.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO competitions (
                title, description, type, reg_start, reg_end, comp_date,
                team_size_min, team_size_max, eligibility_dept, rules,
                problem_statements, submission_deadline, evaluation_criteria, prizes, is_leaderboard_published, status
            ) VALUES (
                'VSCMS National Hackathon 2026',
                'Annual flagship 24-hour hackathon bringing together top student developers to build AI & ERP innovations.',
                'Hackathon', '2026-03-01', '2026-03-25', '2026-03-28', 2, 4, 'All Departments',
                '1. All code must be written during the hackathon window. 2. Open source libraries allowed.',
                'Track 1: Smart Campus AI Assistant. Track 2: Automated Fee & Accounting Ledger.',
                '2026-03-28 18:00', 'Innovation (20), Tech (20), UI/UX (20), Impact (20), Presentation (20)',
                '1st Place: Rs. 50,000 | 2nd Place: Rs. 30,000 | 3rd Place: Rs. 15,000', 1, 'ongoing'
            ) RETURNING id;";
        var compId = Convert.ToInt64(cmd.ExecuteScalar());

        using var t1 = conn.CreateCommand();
        t1.CommandText = "INSERT INTO competition_teams (competition_id, team_name, captain_id, captain_name, is_locked) VALUES (@cid, 'Code Warriors', 1, 'Aman Verma', 1) RETURNING id;";
        t1.Parameters.AddWithValue("@cid", compId);
        var t1Id = Convert.ToInt64(t1.ExecuteScalar());

        Database.Exec(conn, "INSERT INTO competition_team_members (team_id, user_id, user_name, email, role_in_team, status) VALUES (@tid, 1, 'Aman Verma', 'aman@vscms.edu', 'captain', 'accepted')", ("tid", t1Id));
        Database.Exec(conn, "INSERT INTO competition_team_members (team_id, user_id, user_name, email, role_in_team, status) VALUES (@tid, 2, 'Priya Sharma', 'priya@vscms.edu', 'member', 'accepted')", ("tid", t1Id));

        Database.Exec(conn, @"
            INSERT INTO competition_submissions (competition_id, team_id, team_name, project_title, description, github_url, demo_url, ppt_url, is_locked)
            VALUES (@cid, @tid, 'Code Warriors', 'AI Smart Campus ERP', 'Automated student grade predictor and interactive AI agent.', 'https://github.com/vscms/smart-campus', 'https://smart-campus-demo.vscms.edu', 'https://vscms.edu/docs/presentation.pdf', 1)",
            ("cid", compId), ("tid", t1Id));

        Database.Exec(conn, @"
            INSERT INTO competition_evaluations (competition_id, team_id, judge_id, judge_name, score_innovation, score_tech, score_uiux, score_impact, score_presentation, total_score, remarks)
            VALUES (@cid, @tid, 264, 'Mrs. Shruti Agarwal', 19, 18, 19, 18, 17, 91.0, 'Outstanding technical architecture and polished presentation!')",
            ("cid", compId), ("tid", t1Id));

        Database.Exec(conn, @"
            INSERT INTO competition_certificates (competition_id, competition_title, user_id, user_name, team_name, cert_type, cert_code, qr_payload)
            VALUES (@cid, 'VSCMS National Hackathon 2026', 1, 'Aman Verma', 'Code Warriors', 'winner_1st', 'VSCMS-CERT-2026-HACK-01', 'VERIFIED: Winner 1st Place - VSCMS National Hackathon 2026')",
            ("cid", compId));
    }
}
