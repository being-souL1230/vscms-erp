import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { permissions } from "@/db/schema";
import type { AuthUser } from "@/lib/auth";

export type PermissionAction = "view" | "create" | "edit" | "delete";

const ACTION_COLUMN: Record<PermissionAction, "canView" | "canCreate" | "canEdit" | "canDelete"> = {
  view: "canView",
  create: "canCreate",
  edit: "canEdit",
  delete: "canDelete",
};

export async function can(user: AuthUser, module: string, action: PermissionAction): Promise<boolean> {
  // Admin is always fully allowed (locked in the matrix UI).
  if (user.role === "admin") return true;
  const row = (
    await db
      .select()
      .from(permissions)
      .where(and(eq(permissions.role, user.role), eq(permissions.module, module)))
      .limit(1)
  )[0];
  // Fail closed: the seed always creates rows for every matrix module, so a
  // missing row means the action was never granted to this role.
  if (!row) return false;
  return row[ACTION_COLUMN[action]] === 1;
}
