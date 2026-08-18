import { defineConfig } from "drizzle-kit";
import os from "node:os";
import path from "node:path";

/**
 * Mirrors src/db/index.ts so `npm run db:push` targets the SAME database
 * the app uses (e.g. outside OneDrive when the project is cloud-synced).
 */
function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) return path.resolve(process.env.DATABASE_PATH);
  const projectRoot = process.cwd();
  if (
    /[\/](?:OneDrive(?:[\/]|\s|$)|Dropbox[\/]|Google Drive[\/]|iCloudDrive[\/])/i.test(
      projectRoot,
    )
  ) {
    const localAppData =
      process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
    return path.join(localAppData, "vscms-erp", "erp.sqlite");
  }
  return path.join(projectRoot, "data", "erp.sqlite");
}

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: resolveDatabasePath(),
  },
});
