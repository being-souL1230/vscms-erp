import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Sqlite = Database.Database;

/**
 * Resolve the SQLite file path.
 * - Set DATABASE_PATH to force a specific location.
 * - If the project folder is inside a cloud-synced directory
 *   (OneDrive / Dropbox / Google Drive), keep the DB in the OS
 *   app-data folder instead, so cloud sync can never corrupt it.
 * - Otherwise keep it next to the project at <project>/data/erp.sqlite.
 */
function resolveDatabasePath(): string {
  const envPath = process.env.DATABASE_PATH;
  if (envPath) return path.resolve(envPath);
  const projectRoot = process.cwd();
  if (
    /[\\/](?:OneDrive(?:[\\/]|\s|$)|Dropbox[\\/]|Google Drive[\\/]|iCloudDrive[\\/])/i.test(
      projectRoot,
    )
  ) {
    const localAppData =
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "apex-university-erp", "erp.sqlite");
  }
  return path.join(projectRoot, "data", "erp.sqlite");
}

/**
 * First run after moving the DB: carry the existing database from the old
 * project folder (e.g. data/erp.sqlite inside OneDrive) to the new location.
 */
function migrateLegacyDatabase(target: string): void {
  const legacy = path.join(process.cwd(), "data", "erp.sqlite");
  if (path.resolve(legacy) === path.resolve(target)) return;
  if (!fs.existsSync(legacy) || fs.existsSync(target)) return;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(legacy, target);
    console.log(`[db] Migrated existing database to ${target}`);
  } catch (err) {
    console.error("[db] Could not migrate legacy database:", err);
  }
}

export const databasePath = resolveDatabasePath();

// Make sure the folder exists even on a fresh clone.
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const globalForDb = globalThis as typeof globalThis & { __apexErpSqlite?: Sqlite };

function openDatabase(): Sqlite {
  try {
    migrateLegacyDatabase(databasePath);
    const instance = new Database(databasePath);
    // If the file is corrupt (e.g. a bad OneDrive sync), move it aside and
    // start fresh the app self-heals by re-creating the schema + seeding.
    try {
      const check = instance.pragma("quick_check", { simple: true }) as string;
      if (check !== "ok") throw new Error(`Database integrity check failed: ${check}`);
    } catch (checkErr) {
      instance.close();
      throw checkErr;
    }
    return instance;
  } catch (err) {
    console.error("[db] Failed to open database, rebuilding:", err);
    // Named so it stays gitignored (data/*.corrupt-*.sqlite, data/*.sqlite).
    const backup = databasePath.replace(/\.sqlite$/, `.corrupt-${Date.now()}.sqlite`);
    try {
      if (fs.existsSync(databasePath)) fs.renameSync(databasePath, backup);
      console.error(`[db] Moved broken database to ${backup}`);
    } catch (renameErr) {
      console.error("[db] Could not move broken database aside:", renameErr);
    }
    return new Database(databasePath);
  }
}

const sqlite = globalForDb.__apexErpSqlite ?? openDatabase();

// Single-file journal mode. This is critical when the project lives inside
// a OneDrive/Dropbox/Google-Drive folder: WAL mode spreads data across
// erp.sqlite + erp.sqlite-wal + erp.sqlite-shm, and cloud sync can corrupt
// or lose the side files. DELETE mode keeps everything in one file.
// Each pragma is guarded individually so one failure doesn't skip the rest.
const PRAGMAS: Array<[string, string]> = [
  ["journal_mode = DELETE", "journal mode (single-file mode)"],
  ["busy_timeout = 10000", "busy timeout"],
  ["foreign_keys = ON", "foreign keys"],
  ["synchronous = FULL", "synchronous mode"],
];
for (const [pragma, label] of PRAGMAS) {
  try {
    sqlite.pragma(pragma);
  } catch (err) {
    // Another process (e.g. an older dev server) may still hold the DB in WAL
    // mode; don't crash the app the mode will be applied on the next clean start.
    console.error(`[db] Could not apply ${label} (will retry on next start):`, err);
  }
}

if (process.env.NODE_ENV !== "production") globalForDb.__apexErpSqlite = sqlite;

export const db = drizzle(sqlite);
