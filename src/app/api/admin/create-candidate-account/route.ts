import { NextResponse } from "next/server";
import { createCandidateAccount } from "@/lib/rules/candidate-account";

export async function POST(request: Request) {
  const { candidateId } = await request.json();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  try {
    const result = await createCandidateAccount(candidateId);
    if (!result) {
      return NextResponse.json({ message: "Account existiert bereits" });
    }
    return NextResponse.json({
      message: "Account erstellt",
      userId: result.userId,
      email: result.email,
      password: result.temporaryPassword,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler" },
      { status: 500 }
    );
  }
}
