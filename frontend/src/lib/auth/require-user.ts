import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function requireUserSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}