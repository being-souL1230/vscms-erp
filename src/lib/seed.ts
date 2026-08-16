import { db } from "@/db";
import {
  users,
  departments,
  courses,
  attendance,
  facultyAttendance,
  grades,
  feeRecords,
  assignments,
  assignmentSubmissions,
  notices,
  timetable,
  leaveRequests,
  admissions,
  documents,
  enrollments,
  sections,
  semesters,
  academicSessions,
  examSchedules,
  exams,
  internalMarks,
  permissions,
  feeStructures,
  feePayments,
} from "@/db/schema";
import { computeInternal } from "@/lib/grading";
import { generateFeeInvoices } from "@/lib/fees";
import {
  initialUsers,
  initialDepartments,
  initialCourses,
  initialNotices,
} from "@/lib/seed-data";
import { count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface SeedResult {
  success: true;
  message: string;
  count?: number;
}

/**
 * Shared seeding routine, used by /api/seed and by ensureDatabase()
 * (which runs automatically on server start).
 */
export async function seedDatabase(force: boolean): Promise<SeedResult> {
  const userCountResult = await db.select({ value: count() }).from(users);
  const existingCount = userCountResult[0]?.value || 0;

  if (existingCount > 0 && !force) {
    // Database already has users but make sure the newer modules
    // (documents, exams, permissions, …) still get their demo data if
    // they were added after this database was first created.
    const permCount = (await db.select({ value: count() }).from(permissions))[0]?.value || 0;
    const examDefCount = (await db.select({ value: count() }).from(exams))[0]?.value || 0;
    const marksCount = (await db.select({ value: count() }).from(internalMarks))[0]?.value || 0;
    const faCount = (await db.select({ value: count() }).from(facultyAttendance))[0]?.value || 0;
    if (faCount === 0) {
      // Faculty self-attendance register (added after this DB was first created).
      const existingFaculty = await db.select().from(users).where(eq(users.role, "faculty"));
      const fDates = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"];
      for (const f of existingFaculty) {
        for (const d of fDates) {
          await db.insert(facultyAttendance).values({
            facultyId: f.id,
            facultyName: f.name,
            date: d,
            status: Math.random() > 0.12 ? "present" : "absent",
            markedBy: "Office of the Director",
          });
        }
      }
    }
    const existingStudents = await db.select().from(users).where(eq(users.role, "student"));
    const existingCourses = await db.select().from(courses);
    if (permCount === 0) {
      await seedExtras(existingStudents, existingCourses);
    } else {
      // Permissions already exist from an older seed backfill the safer
      // defaults so server-side enforcement behaves the same on old DBs.
      await syncPermissionDefaults();
      if (examDefCount === 0 && marksCount === 0) {
        await seedExamModule(existingStudents, existingCourses);
      }
    }
    await seedFeeModule();
    const passwordHash = await bcrypt.hash("demo12345", 12);
    await db.update(users).set({ passwordHash }).where(eq(users.passwordHash, ""));
    return {
      success: true,
      message: "Database already seeded",
      count: existingCount,
    };
  }

  if (force) {
    await db.delete(attendance);
    await db.delete(facultyAttendance);
    await db.delete(grades);
    await db.delete(feeRecords);
    await db.delete(feePayments);
    await db.delete(feeStructures);
    await db.delete(leaveRequests);
    await db.delete(assignmentSubmissions);
    await db.delete(assignments);
    await db.delete(timetable);
    await db.delete(notices);
    await db.delete(courses);
    await db.delete(departments);
    await db.delete(users);
    await db.delete(admissions);
    await db.delete(documents);
    await db.delete(enrollments);
    await db.delete(sections);
    await db.delete(semesters);
    await db.delete(academicSessions);
    await db.delete(examSchedules);
    await db.delete(exams);
    await db.delete(internalMarks);
    await db.delete(permissions);
  }

  const passwordHash = await bcrypt.hash("demo12345", 12);
  const insertedUsers = await db
    .insert(users)
    .values(initialUsers.map((user) => ({ ...user, passwordHash })))
    .returning();

  await db.insert(departments).values(initialDepartments);

  // Wire course ownership: each course's faculty_name is resolved to the
  // real faculty user id so faculty can only edit their assigned subjects.
  const facultyByName = new Map(
    insertedUsers
      .filter((u) => u.role === "faculty")
      .map((u) => [u.name, u.id] as const),
  );
  const insertedCourses = await db
    .insert(courses)
    .values(
      initialCourses.map((c) => ({
        ...c,
        facultyId: facultyByName.get(c.facultyName || "") ?? null,
      })),
    )
    .returning();

  await db.insert(notices).values(initialNotices);

  await db.insert(timetable).values([
    {
      courseCode: "BCA101",
      courseName: "Introduction to Programming",
      department: "BCA (CSJM)",
      semester: 1,
      dayOfWeek: "Monday",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      room: "Lab 1 · LT-101",
      facultyName: "Dr. Tanya Mishra",
    },
    {
      courseCode: "BCA201",
      courseName: "Data Structures & Algorithms",
      department: "BCA (CSJM)",
      semester: 2,
      dayOfWeek: "Tuesday",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      room: "Lab 2 · LT-202",
      facultyName: "Dr. Tanya Mishra",
    },
    {
      courseCode: "BCA301",
      courseName: "Database Management Systems",
      department: "BCA (CSJM)",
      semester: 3,
      dayOfWeek: "Wednesday",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      room: "Lab 1 · LT-101",
      facultyName: "Mr. Ayush Yadav",
    },
    {
      courseCode: "MBA101",
      courseName: "Principles of Management",
      department: "MBA",
      semester: 1,
      dayOfWeek: "Thursday",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      room: "Hall 1 · MH-101",
      facultyName: "Mr. Prakhar Tiwari",
    },
    {
      courseCode: "BBA101",
      courseName: "Business Communication",
      department: "BBA",
      semester: 1,
      dayOfWeek: "Friday",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      room: "Hall 1 · MH-101",
      facultyName: "Mrs. Shruti Agarwal",
    },
  ]);

  const studentsList = insertedUsers.filter((u) => u.role === "student");
  const dates = [
    "2026-03-09",
    "2026-03-10",
    "2026-03-11",
    "2026-03-12",
    "2026-03-13",
    "2026-03-16",
  ];

  for (const student of studentsList) {
    const idx = studentsList.indexOf(student);
    const course = insertedCourses[idx % insertedCourses.length];
    const enrolledCourses = idx === 0 && insertedCourses[1] ? [course, insertedCourses[1]] : [course];
    // Demo: Rohan (idx 2) has poor attendance so the low-attendance alert shows.
    const absentRate = idx === 2 ? 0.45 : 0.16;
    for (const c of enrolledCourses) {
      const cDates = c === course ? dates : dates.slice(0, 4);
      for (const d of cDates) {
        await db.insert(attendance).values({
          studentId: student.id,
          studentName: student.name,
          courseId: c.id,
          courseCode: c.code,
          date: d,
          status: Math.random() > absentRate ? "present" : "absent",
          period: "Lecture 1 (09:00 - 10:30)",
          markedBy: "Dr. Tanya Mishra",
        });
      }
    }
  }

  // Faculty self-attendance register (marked by the admin office).
  const facultyList = insertedUsers.filter((u) => u.role === "faculty");
  const fDates = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"];
  for (const f of facultyList) {
    for (const d of fDates) {
      await db.insert(facultyAttendance).values({
        facultyId: f.id,
        facultyName: f.name,
        date: d,
        status: Math.random() > 0.12 ? "present" : "absent",
        markedBy: "Office of the Director",
      });
    }
  }

  if (studentsList.length > 0) {
    await db.insert(grades).values([
      {
        studentId: studentsList[0].id,
        studentName: studentsList[0].name,
        courseId: insertedCourses[0].id,
        courseName: `${insertedCourses[0].name} (${insertedCourses[0].code})`,
        examType: "Mid-Term",
        marksObtained: "91.50",
        maxMarks: "100.00",
        gradeLetter: "A+",
        semester: studentsList[0].semester || 3,
        remarks: "Great work on the programming assignment.",
      },
      {
        studentId: studentsList[0].id,
        studentName: studentsList[0].name,
        courseId: insertedCourses[2].id,
        courseName: `${insertedCourses[2].name} (${insertedCourses[2].code})`,
        examType: "Assignment",
        marksObtained: "86.00",
        maxMarks: "100.00",
        gradeLetter: "A",
        semester: studentsList[0].semester || 3,
        remarks: "Good effort. Improve the database design part.",
      },
      {
        studentId: studentsList[1]?.id || studentsList[0].id,
        studentName: studentsList[1]?.name || studentsList[0].name,
        courseId: insertedCourses[1].id,
        courseName: `${insertedCourses[1].name} (${insertedCourses[1].code})`,
        examType: "Mid-Term",
        marksObtained: "95.00",
        maxMarks: "100.00",
        gradeLetter: "A+",
        semester: studentsList[1]?.semester || 3,
        remarks: "Excellent performance. Keep it up.",
      },
    ]);
  }

  if (studentsList.length > 0) {
    const firstCourse = insertedCourses[0];
    const secondCourse = insertedCourses[1] || insertedCourses[0];
    const semOf = (s: { semester?: number | null }) => s.semester || 3;
    const feeSeed = await db
      .insert(feeRecords)
      .values([
        {
          studentId: studentsList[0].id,
          studentName: studentsList[0].name,
          rollNo: studentsList[0].rollNo,
          feeType: "Sem 3 Tuition",
          amount: "48000.00",
          dueDate: "2026-03-31",
          paidDate: "2026-02-26",
          status: "paid",
          receiptNumber: "REC-VSCMS-2026-8941",
          paymentMethod: "UPI",
          courseCode: firstCourse.code,
          courseName: firstCourse.name,
          semester: semOf(studentsList[0]),
          paidAmount: "48000.00",
        },
        {
          studentId: studentsList[0].id,
          studentName: studentsList[0].name,
          rollNo: studentsList[0].rollNo,
          feeType: "Lab & Library Fee",
          amount: "6500.00",
          dueDate: "2026-04-10",
          paidDate: null,
          status: "pending",
          receiptNumber: null,
          paymentMethod: null,
          courseCode: firstCourse.code,
          courseName: firstCourse.name,
          semester: semOf(studentsList[0]),
          paidAmount: "0",
        },
        {
          studentId: studentsList[1]?.id || studentsList[0].id,
          studentName: studentsList[1]?.name || studentsList[0].name,
          rollNo: studentsList[1]?.rollNo || "102",
          feeType: "Sem 3 Tuition",
          amount: "48000.00",
          dueDate: "2026-03-31",
          paidDate: "2026-03-02",
          status: "paid",
          receiptNumber: "REC-VSCMS-2026-8949",
          paymentMethod: "UPI",
          courseCode: secondCourse.code,
          courseName: secondCourse.name,
          semester: semOf(studentsList[1] || studentsList[0]),
          paidAmount: "48000.00",
        },
      ])
      .returning();
    // Payment history for the two settled invoices.
    const paidSeeds = [feeSeed[0], feeSeed[2]].filter(Boolean);
    for (const r of paidSeeds) {
      await db.insert(feePayments).values({
        feeRecordId: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        amount: r.amount,
        paymentMethod: r.paymentMethod || "UPI",
        receiptNumber: r.receiptNumber || `REC-VSCMS-2026-${r.id}`,
        paidAt: r.paidDate || "2026-03-02",
      });
    }
  }

  const insertedAssignments = await db
    .insert(assignments)
    .values([
      {
        courseId: insertedCourses[0].id,
        courseName: `${insertedCourses[0].name} (${insertedCourses[0].code})`,
        title: "Python Assignment - Loops & Functions",
        description:
          "Write a Python program that uses loops and functions to solve a basic problem. Submit your .py file.",
        dueDate: "2026-03-28",
        maxMarks: 50,
        facultyName: "Dr. Tanya Mishra",
      },
      {
        courseId: insertedCourses[2].id,
        courseName: `${insertedCourses[2].name} (${insertedCourses[2].code})`,
        title: "Database Design Assignment",
        description:
          "Design a simple database for a library system. Submit the SQL schema and a short explanation.",
        dueDate: "2026-04-05",
        maxMarks: 50,
        facultyName: "Mr. Ayush Yadav",
      },
    ])
    .returning();

  if (studentsList.length > 0 && insertedAssignments.length > 0) {
    await db.insert(assignmentSubmissions).values({
      assignmentId: insertedAssignments[0].id,
      studentId: studentsList[0].id,
      studentName: studentsList[0].name,
      submissionText:
        "Python file attached. The program works correctly for all test cases.",
      fileUrl: "https://vscms.edu/drive/aarav-python-assignment.py",
      status: "graded",
      marks: "47.00",
      feedback:
        "Good code structure. Add more comments for clarity.",
    });
  }

  if (studentsList.length > 1) {
    await db.insert(leaveRequests).values([
      {
        studentId: studentsList[0].id,
        studentName: studentsList[0].name,
        rollNo: studentsList[0].rollNo,
        department: studentsList[0].department,
        fromDate: "2026-03-20",
        toDate: "2026-03-22",
        reason: "Medical leave - doctor's appointment and recovery at home.",
        status: "pending",
      },
      {
        studentId: studentsList[1].id,
        studentName: studentsList[1].name,
        rollNo: studentsList[1].rollNo,
        department: studentsList[1].department,
        fromDate: "2026-03-24",
        toDate: "2026-03-24",
        reason: "Family function (sister's wedding). Will share photos on request.",
        status: "pending",
      },
      {
        studentId: studentsList[2]?.id || studentsList[0].id,
        studentName: studentsList[2]?.name || studentsList[0].name,
        rollNo: studentsList[2]?.rollNo || "-",
        department: studentsList[2]?.department || studentsList[0].department,
        fromDate: "2026-03-05",
        toDate: "2026-03-06",
        reason: "Represented the college at an inter-college debate competition.",
        status: "approved",
        reviewedBy: "Dr. Tanya Mishra",
        reviewedAt: "2026-03-04",
        remarks: "Approved - good luck with the competition.",
      },
    ]);
  }

  /* ---------- exam module demo data (idempotent only fills empty tables) ---------- */
  async function seedExamModule(
    studentsList: (typeof users.$inferSelect)[],
    insertedCourses: (typeof courses.$inferSelect)[],
  ) {
    if (studentsList.length === 0 || insertedCourses.length === 0) return;
    const examDefCount = (await db.select({ value: count() }).from(exams))[0]?.value || 0;
    const marksCount = (await db.select({ value: count() }).from(internalMarks))[0]?.value || 0;
    if (examDefCount === 0) {
      await db.insert(exams).values([
        {
          name: "Mid-Term Examination 2026",
          examType: "Mid-Term",
          department: "BCA (CSJM)",
          semester: 3,
          session: "2025-26",
          startDate: "2026-04-08",
          endDate: "2026-04-18",
          status: "completed",
          passingPercent: 40,
        },
        {
          name: "Sessional Test 2026",
          examType: "Sessional",
          department: "BCA (CSJM)",
          semester: 3,
          session: "2025-26",
          startDate: "2026-03-02",
          endDate: "2026-03-06",
          status: "completed",
          passingPercent: 40,
        },
        {
          name: "Practical & Viva 2026",
          examType: "Practical",
          department: "BCA (CSJM)",
          semester: 3,
          session: "2025-26",
          startDate: "2026-04-20",
          endDate: "2026-04-24",
          status: "scheduled",
          passingPercent: 40,
        },
      ]);
    }
    if (marksCount === 0) {
      const mkMark = (
        s: (typeof studentsList)[number],
        c: (typeof insertedCourses)[number],
        examType: string,
        theory: number,
        practical: number,
        maxTheory = 30,
        maxPractical = 20,
        status = "approved",
      ) => {
        const r = computeInternal(theory, practical, maxTheory, maxPractical, 40);
        return {
          studentId: s.id,
          studentName: s.name,
          courseId: c.id,
          courseCode: c.code,
          courseName: c.name,
          examType,
          semester: s.semester || 3,
          theoryMarks: String(theory),
          practicalMarks: String(practical),
          maxTheory: String(maxTheory),
          maxPractical: String(maxPractical),
          totalMarks: String(r.total),
          maxTotal: String(r.maxTotal),
          passMarks: String(r.passMarks),
          gradeLetter: r.gradeLetter,
          result: r.result,
          status,
          remarks: r.result === "fail" ? "Backlog to be cleared in next attempt" : "",
        };
      };
      const s0 = studentsList[0];
      const s1 = studentsList[1] || studentsList[0];
      const s2 = studentsList[2] || studentsList[0];
      const c0 = insertedCourses[0];
      const c1 = insertedCourses[1] || insertedCourses[0];
      // Workflow demo: published results (approved) vs pending (submitted)
      // vs in-progress (draft) sheets.
      await db.insert(internalMarks).values([
        mkMark(s0, c0, "Mid-Term", 26, 18), // approved
        mkMark(s0, c0, "Sessional", 9, 6), // approved · FAIL → backlog
        mkMark(s0, c0, "Practical", 12, 16, 30, 20, "draft"), // draft
        mkMark(s0, c1, "Mid-Term", 21, 15, 30, 20, "submitted"), // awaiting approval
        mkMark(s1, c1, "Mid-Term", 19, 14), // approved
        mkMark(s1, c1, "Sessional", 17, 12), // approved
        mkMark(s2, c0, "Mid-Term", 8, 5), // approved · FAIL → backlog
        mkMark(s2, c0, "Sessional", 16, 11), // approved
      ]);
    }
  }

  /* ---------- new-module demo data: admissions, documents, enrollments,
     sections, semesters, academic sessions, exam schedule, permissions --- */
  async function seedExtras(
    studentsList: (typeof users.$inferSelect)[],
    insertedCourses: (typeof courses.$inferSelect)[],
  ) {
  if (studentsList.length > 0) {    await db.insert(admissions).values([
      {
        studentId: studentsList[0].id,
        admissionNumber: `ADM-2025-${String(1000 + studentsList[0].id).slice(-4)}`,
        admissionDate: "2025-07-14",
        category: "General",
        previousInstitution: "St. Xavier's Higher Secondary School",
        fatherName: "Rajesh Kumar Sharma",
        motherName: "Sunita Sharma",
        guardianPhone: "+91 98765 43210",
        bloodGroup: "B+",
        address: "H-42, Sector 17, Noida, UP",
        isHosteler: 1,
      },
      {
        studentId: studentsList[1]?.id || studentsList[0].id,
        admissionNumber: `ADM-2025-${String(1000 + (studentsList[1]?.id || 0)).slice(-4)}`,
        admissionDate: "2025-07-14",
        category: "OBC",
        previousInstitution: "Delhi Public School, Vasant Kunj",
        fatherName: "Mohammed Ansari",
        motherName: "Farida Ansari",
        guardianPhone: "+91 98110 22334",
        bloodGroup: "O+",
        address: "B-12, Zakir Bagh, Okhla, New Delhi",
        isHosteler: 0,
      },
      {
        studentId: studentsList[2]?.id || studentsList[0].id,
        admissionNumber: `ADM-2025-${String(1000 + (studentsList[2]?.id || 0)).slice(-4)}`,
        admissionDate: "2025-07-15",
        category: "SC",
        previousInstitution: "DAV Public School, Ghaziabad",
        fatherName: "Baldev Singh",
        motherName: "Kuldeep Kaur",
        guardianPhone: "+91 99110 99887",
        bloodGroup: "A+",
        address: "C-7, Indirapuram, Ghaziabad, UP",
        isHosteler: 1,
      },
    ]);
  }

  if (studentsList.length > 0) {
    const sampleDoc = (s: (typeof studentsList)[number], title: string, category: string, content: string) => ({
      studentId: s.id,
      studentName: s.name,
      title,
      category,
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`,
      mimeType: "text/plain",
      fileSize: content.length,
      data: Buffer.from(content, "utf8").toString("base64"),
      status: "verified",
    });
    await db.insert(documents).values([
      sampleDoc(studentsList[0], "Aadhaar Card", "Identity", "Aadhaar: 3452 6789 1023\nName: Aarav Sharma"),
      sampleDoc(studentsList[0], "Class 12 Marksheet", "Academics", "CBSE Class XII - 92.4%\nSubjects: Physics, Chemistry, Maths, CS, English"),
      sampleDoc(studentsList[1] || studentsList[0], "Transfer Certificate", "Academics", "TC issued by DPS Vasant Kunj on 30-Jun-2025"),
    ]);
  }

  if (studentsList.length > 0 && insertedCourses.length > 0) {
    await db.insert(enrollments).values(
      studentsList.map((s, i) => ({
        studentId: s.id,
        studentName: s.name,
        courseId: insertedCourses[i % insertedCourses.length].id,
        courseCode: insertedCourses[i % insertedCourses.length].code,
        courseName: insertedCourses[i % insertedCourses.length].name,
        semester: s.semester || 3,
        status: "active",
      })),
    );
  }

  await seedExamModule(studentsList, insertedCourses);

  await db.insert(sections).values([
    { code: "A", name: "Section A", department: "BCA (CSJM)", semester: 1, room: "LT-101" },
    { code: "B", name: "Section B", department: "BCA (CSJM)", semester: 1, room: "LT-102" },
    { code: "A", name: "Section A", department: "MBA", semester: 1, room: "MH-101" },
    { code: "A", name: "Section A", department: "BBA", semester: 1, room: "MH-102" },
  ]);

  await db.insert(semesters).values(
    [1, 2, 3, 4, 5, 6].map((n) => ({
      number: n,
      name: `Semester ${n}`,
      department: "BCA (CSJM)",
      status: n === 3 ? "active" : "inactive",
      startsOn: n === 3 ? "2026-01-05" : null,
      endsOn: n === 3 ? "2026-05-30" : null,
    })),
  );

  await db.insert(academicSessions).values([
    { name: "2025-26", startDate: "2025-07-01", endDate: "2026-06-30", isCurrent: 1 },
    { name: "2024-25", startDate: "2024-07-01", endDate: "2025-06-30", isCurrent: 0 },
  ]);

  await db.insert(examSchedules).values([
    {
      examType: "Mid-Term",
      courseCode: "BCA301",
      courseName: "Database Management Systems",
      department: "BCA (CSJM)",
      semester: 3,
      examDate: "2026-04-08",
      startTime: "10:00 AM",
      endTime: "12:00 PM",
      room: "Hall 2 · MH-202",
    },
    {
      examType: "Mid-Term",
      courseCode: "BCA101",
      courseName: "Introduction to Programming",
      department: "BCA (CSJM)",
      semester: 1,
      examDate: "2026-04-10",
      startTime: "10:00 AM",
      endTime: "12:00 PM",
      room: "Lab 1 · LT-101",
    },
    {
      examType: "Final",
      courseCode: "MBA101",
      courseName: "Principles of Management",
      department: "MBA",
      semester: 1,
      examDate: "2026-05-12",
      startTime: "02:00 PM",
      endTime: "05:00 PM",
      room: "Hall 1 · MH-101",
    },
    {
      examType: "Internal",
      courseCode: "BBA101",
      courseName: "Business Communication",
      department: "BBA",
      semester: 1,
      examDate: "2026-04-15",
      startTime: "11:00 AM",
      endTime: "12:30 PM",
      room: "Hall 3 · MH-103",
    },
  ]);

  const MODULES = [
    "students",
    "faculty",
    "courses",
    "departments",
    "fees",
    "notices",
    "timetable",
    "exams",
    "documents",
    "reports",
    "users",
    "attendance",
    "assignments",
    "leaves",
  ] as const;
  const permRows: { role: string; module: string; canView: number; canCreate: number; canEdit: number; canDelete: number }[] = [];
  for (const mod of MODULES) {
    // Admin is always fully allowed for every module (locked in the matrix UI).
    permRows.push({ role: "admin", module: mod, canView: 1, canCreate: 1, canEdit: 1, canDelete: 1 });
    const isUsersModule = mod === "users";
    // Faculty: full management of timetable; create/edit fees, notices, exams and
    // documents; view-only for the rest. The users module is admin-only.
    const facultyWrite =
      mod === "timetable"
        ? { canCreate: 1, canEdit: 1, canDelete: 1 }
        : ["fees", "notices", "exams", "documents", "attendance", "assignments", "leaves"].includes(mod)
          ? { canCreate: 1, canEdit: 1, canDelete: 0 }
          : { canCreate: 0, canEdit: 0, canDelete: 0 };
    permRows.push({ role: "faculty", module: mod, canView: isUsersModule ? 0 : 1, ...facultyWrite });
    // Students: self-service only upload/delete their own documents and pay
    // their own fees. The users module is admin-only for them too.
    permRows.push({
      role: "student",
      module: mod,
      canView: isUsersModule ? 0 : 1,
      canCreate: mod === "documents" || mod === "assignments" || mod === "leaves" ? 1 : 0,
      canEdit: mod === "documents" || mod === "fees" ? 1 : 0,
      canDelete: mod === "documents" ? 1 : 0,
    });
  }
  await db.insert(permissions).values(permRows);
  }

  await seedExtras(studentsList, insertedCourses);
  await seedFeeModule();

  /* ---------- course-wise fee structure + invoice generation ---------- */
  async function seedFeeModule() {
    const existingStructures = await db.select().from(feeStructures);
    if (existingStructures.length === 0) {
      // Build the structure from the actual (course, semester) pairs students
      // are enrolled in, so every enrolled scholar has a matching structure.
      const enrolls = await db.select().from(enrollments);
      const combos = Array.from(new Map(enrolls.map((e) => [`${e.courseCode}|${e.semester}`, e])).values());
      if (combos.length > 0) {
        await db.insert(feeStructures).values(
          combos.flatMap((e) => [
            {
              courseCode: e.courseCode,
              courseName: e.courseName,
              semester: e.semester,
              feeType: `Sem ${e.semester} Tuition`,
              amount: e.semester >= 3 ? "48000.00" : "42000.00",
              dueDate: "2026-03-31",
            },
            {
              courseCode: e.courseCode,
              courseName: e.courseName,
              semester: e.semester,
              feeType: "Lab & Library Fee",
              amount: "6500.00",
              dueDate: "2026-04-10",
            },
          ]),
        );
      }
    }
    await generateFeeInvoices();
  }

  /* ---------- permission-default backfill for existing DBs ---------- */
  async function syncPermissionDefaults() {
    const rows = await db.select().from(permissions);
    // users module → admin only (view + all actions revoked for faculty/student)
    for (const role of ["faculty", "student"]) {
      const existing = rows.find((r) => r.role === role && r.module === "users");
      if (existing) {
        await db
          .update(permissions)
          .set({ canView: 0, canCreate: 0, canEdit: 0, canDelete: 0 })
          .where(eq(permissions.id, existing.id));
      }
    }
    // student canEdit fees (pay own fee) + canDelete documents (delete own docs)
    for (const { module, action, set } of [
      { module: "fees", action: "canEdit", set: 1 },
      { module: "documents", action: "canDelete", set: 1 },
    ] as const) {
      const existing = rows.find((r) => r.role === "student" && r.module === module);
      if (existing) {
        await db
          .update(permissions)
          .set({ [action]: set })
          .where(eq(permissions.id, existing.id));
      }
    }
    // faculty full timetable management
    const tt = rows.find((r) => r.role === "faculty" && r.module === "timetable");
    if (tt) {
      await db
        .update(permissions)
        .set({ canCreate: 1, canEdit: 1, canDelete: 1 })
        .where(eq(permissions.id, tt.id));
    }
    // attendance / assignments / leaves were added to the matrix later insert
    // default rows for older DBs that predate them.
    for (const mod of ["attendance", "assignments", "leaves"] as const) {
      for (const role of ["admin", "faculty", "student"] as const) {
        if (rows.some((r) => r.role === role && r.module === mod)) continue;
        const base: { role: string; module: string; canView: number } = { role, module: mod, canView: 1 };
        if (role === "admin") {
          await db.insert(permissions).values({ ...base, canCreate: 1, canEdit: 1, canDelete: 1 });
        } else if (role === "faculty") {
          // Faculty marks attendance, creates/grades assignments, and applies
          // for + reviews leave requests.
          await db.insert(permissions).values({ ...base, canCreate: 1, canEdit: 1, canDelete: 0 });
        } else {
          // Students view everything, submit assignment work and apply for leave.
          await db.insert(permissions).values({
            ...base,
            canCreate: mod === "assignments" || mod === "leaves" ? 1 : 0,
            canEdit: 0,
            canDelete: 0,
          });
        }
      }
    }
  }

  await syncPermissionDefaults();

  return {
    success: true,
    message: "Database seeded successfully",
  };
}
