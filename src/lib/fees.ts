import { db } from "@/db";
import { enrollments, feeRecords, feeStructures, users } from "@/db/schema";

/**
 * Auto-generate pending fee invoices from the course-wise fee structure.
 *
 * Every active enrollment gets one invoice per structure row that matches
 * its course code + semester. The generator is idempotent: an invoice for the
 * same student + course + semester + fee type with money still owing is never
 * duplicated, so clicking "Generate" repeatedly is safe.
 *
 * Returns how many invoices were created.
 */
export async function generateFeeInvoices(): Promise<number> {
  const structures = await db.select().from(feeStructures);
  if (structures.length === 0) return 0;

  const enrolls = (await db.select().from(enrollments)).filter(
    (e) => e.status === "active",
  );
  if (enrolls.length === 0) return 0;

  const existing = await db.select().from(feeRecords);
  const rollNos = new Map(
    (await db.select().from(users)).map((u) => [u.id, u.rollNo] as const),
  );

  let created = 0;
  for (const en of enrolls) {
    for (const s of structures) {
      if (s.courseCode !== en.courseCode || s.semester !== en.semester) continue;
      // Never duplicate a fee type that already exists for this student's
      // course + semester — whether paid, partially paid or still pending.
      const hasInvoice = existing.some(
        (f) =>
          f.studentId === en.studentId &&
          (f.courseCode || "") === en.courseCode &&
          (f.semester ?? 0) === en.semester &&
          f.feeType === s.feeType,
      );
      if (hasInvoice) continue;

      await db.insert(feeRecords).values({
        studentId: en.studentId,
        studentName: en.studentName,
        rollNo: rollNos.get(en.studentId) || "",
        feeType: s.feeType,
        amount: s.amount,
        dueDate: s.dueDate,
        status: "pending",
        courseCode: en.courseCode,
        courseName: s.courseName,
        semester: en.semester,
        paidAmount: "0",
      });
      created++;
    }
  }
  return created;
}
