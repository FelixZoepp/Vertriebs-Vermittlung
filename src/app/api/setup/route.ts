import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/setup
 * Creates the initial admin user. Only works if no admin exists yet.
 * Body: { email, password, name }
 */
export async function POST(request: Request) {
  const supabase = await createServiceClient();

  // Check if any admin exists
  const { data: existingAdmin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1);

  if (existingAdmin && existingAdmin.length > 0) {
    return NextResponse.json(
      { error: "Admin existiert bereits" },
      { status: 400 }
    );
  }

  const { email, password, name } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-Mail und Passwort erforderlich" },
      { status: 400 }
    );
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin", name },
    });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Admin erstellt",
    user_id: authData.user.id,
  });
}
