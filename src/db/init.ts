import { db } from "@/db";
import { DDL } from "@/db/ddl";
import { seedDatabase } from "@/lib/seed";

export interface EnsureResult {
  seeded: boolean;
  count: number;
}

/**
 * Self-healing startup routine:
 * 1. Creates any missing tables (so a fresh/corrupt database works again).
 * 2. Seeds the demo data automatically when the users table is empty.
 *
 * Runs once on server start (src/instrumentation.ts) and defensively
 * before demo/email-password login, so demo credentials ALWAYS work even
 * after the database file is lost or corrupted by a cloud-sync mishap.
 */
async function doEnsure(): Promise<EnsureResult> {
  const client = db.$client;

  try {
    client.exec(DDL.join("\n"));
  } catch (err) {
    console.error("[db] ensureDatabase: could not apply schema:", err);
    throw new Error(
      `Database is not usable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Migration: exam-marks approval workflow. Older databases created before
  // the `status` column existed keep their rows publishable, so existing
  // results stay visible to scholars after the upgrade.
  try {
    const cols = client.prepare("PRAGMA table_info(internal_marks)").all() as { name: string }[];
    if (cols.length > 0 && !cols.some((c) => c.name === "status")) {
      client.exec(`ALTER TABLE "internal_marks" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft'`);
      client.exec(`UPDATE "internal_marks" SET "status" = 'approved'`);
      console.log("[db] migrated internal_marks: added status column (existing rows approved)");
    }
  } catch (err) {
    console.error("[db] migration for internal_marks.status failed:", err);
  }

  // Migration: course-wise fees. Older databases created before the fee
  // upgrade are backfilled — records get course/semester linkage, a paid
  // running total (so partial payments work) and are re-marked as paid when
  // their paid total already covers the full amount.
  try {
    const cols = client.prepare("PRAGMA table_info(fee_records)").all() as { name: string }[];
    if (cols.length > 0 && !cols.some((c) => c.name === "paid_amount")) {
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "course_code" TEXT`);
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "course_name" TEXT`);
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "semester" INTEGER`);
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "paid_amount" TEXT NOT NULL DEFAULT '0'`);
      client.exec(`UPDATE "fee_records" SET "paid_amount" = "amount" WHERE "status" = 'paid'`);
      // Link existing invoices to the student's enrollment course, so the
      // invoice generator's dedup recognises them and never duplicates.
      client.exec(`
        UPDATE "fee_records" SET
          "course_code" = (SELECT e.course_code FROM "enrollments" e WHERE e.student_id = "fee_records".student_id LIMIT 1),
          "semester" = (SELECT e.semester FROM "enrollments" e WHERE e.student_id = "fee_records".student_id LIMIT 1)
        WHERE "course_code" IS NULL
      `);
      console.log("[db] migrated fee_records: added course linkage + paid_amount columns");
    }
  } catch (err) {
    console.error("[db] migration for fee_records columns failed:", err);
  }

  // Migration: fee collection audit trail. Every payment records who
  // collected it (admin, bursar or faculty) so collections are attributable.
  try {
    const feeCols = client.prepare("PRAGMA table_info(fee_records)").all() as { name: string }[];
    if (feeCols.length > 0 && !feeCols.some((c) => c.name === "collected_by")) {
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "collected_by" TEXT`);
      client.exec(`ALTER TABLE "fee_records" ADD COLUMN "collected_at" TEXT`);
    }
    const payCols = client.prepare("PRAGMA table_info(fee_payments)").all() as { name: string }[];
    if (payCols.length > 0 && !payCols.some((c) => c.name === "collected_by")) {
      client.exec(`ALTER TABLE "fee_payments" ADD COLUMN "collected_by" TEXT`);
      client.exec(`ALTER TABLE "fee_payments" ADD COLUMN "collected_by_id" INTEGER`);
    }
    console.log("[db] migrated fees: added collection actor columns");
  } catch (err) {
    console.error("[db] migration for fee collection actor failed:", err);
  }

  const row = client.prepare("select count(*) as c from users").get() as { c: number } | undefined;
  const count = Number(row?.c ?? 0);
  if (count > 0) return { seeded: false, count };

  await seedDatabase(false);
  const after = client.prepare("select count(*) as c from users").get() as { c: number } | undefined;
  return { seeded: true, count: Number(after?.c ?? 0) };
}

let initPromise: Promise<EnsureResult> | null = null;

/**
 * Single-flight wrapper: concurrent callers (e.g. two simultaneous login
 * requests on an empty database) share one seeding run instead of both
 * inserting — which would trip the UNIQUE constraint on users.email and
 * surface as a login error.
 */
export function ensureDatabase(): Promise<EnsureResult> {
  if (!initPromise) {
    initPromise = doEnsure().finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}
