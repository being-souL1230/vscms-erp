/**
 * Runs once when the Next.js server starts (nodejs runtime).
 * Ensures the SQLite database has its schema and demo data, so the app
 * always boots into a working state even after the DB file was deleted,
 * corrupted, or evicted by a cloud-sync service.
 */
export async function register() {
  // SKIP_DB_INIT: the ASP.NET backend (aspnet-backend/) owns the real
  // database. On Vercel the Next.js app only proxies /api/* to it, so
  // creating a throwaway SQLite file on every cold start is wasted work.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    !process.env.SKIP_DB_INIT
  ) {
    const { ensureDatabase } = await import("@/db/init");
    await ensureDatabase();
  }
}
