import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCandidateAccount } from "@/lib/rules/candidate-account";

export async function POST(request: Request) {
  // Auth: nur eingeloggte Admins
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = await createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { candidateId } = await request.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  try {
    const result = await createCandidateAccount(candidateId);
    if (!result) {
      return NextResponse.json({ message: "Account existiert bereits" });
    }
    // Kein Passwort im Response — der Kandidat erhält Zugang per E-Mail
    return NextResponse.json({
      message: "Account erstellt",
      userId: result.userId,
      email: result.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler" },
      { status: 500 }
    );
  }
}
