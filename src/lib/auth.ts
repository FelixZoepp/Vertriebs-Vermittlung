import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "partner" | "candidate";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
}

export async function getAuthUser(): Promise<AuthUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email!,
    role: (profile?.role as UserRole) || "candidate",
    name: profile?.name || null,
  };
}
