import { NextRequest, NextResponse } from "next/server";
import { getCoordinatesForPLZ } from "@/lib/plz-data";

export async function GET(request: NextRequest) {
  const plz = request.nextUrl.searchParams.get("plz");

  if (!plz || plz.length < 2) {
    return NextResponse.json(
      { error: "PLZ muss mindestens 2 Zeichen haben." },
      { status: 400 }
    );
  }

  const coords = getCoordinatesForPLZ(plz);

  if (!coords) {
    return NextResponse.json(
      { error: "Keine Koordinaten fuer diese PLZ gefunden." },
      { status: 404 }
    );
  }

  return NextResponse.json(coords);
}
