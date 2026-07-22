import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserId } from "./require-user";

export async function requireAdminUser() {
  const userId = await requireUserId();
  const rows = await db.$queryRaw<Array<{ role: string }>>`
    SELECT "role" FROM "User" WHERE "id" = ${userId} LIMIT 1
  `;
  if (rows[0]?.role !== "admin") redirect("/dashboard");
  return userId;
}
