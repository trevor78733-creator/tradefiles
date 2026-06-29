import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Server-side helper: returns the authenticated user's id, or redirects to
// /login. Use this at the top of every server action and server component
// that touches user-owned data.
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}
