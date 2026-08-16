import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/auth/callback", "/bewerben", "/api/"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based access
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "candidate";

  // Block partner from admin routes
  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = role === "partner" ? "/partner" : "/kandidat";
    return NextResponse.redirect(url);
  }

  // Block candidate from partner routes
  if (pathname.startsWith("/partner") && role === "candidate") {
    const url = request.nextUrl.clone();
    url.pathname = "/kandidat";
    return NextResponse.redirect(url);
  }

  // Block admin/partner from candidate routes
  if (pathname.startsWith("/kandidat") && role !== "candidate") {
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/partner";
    return NextResponse.redirect(url);
  }

  // Root redirect based on role
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "admin" ? "/admin" : role === "partner" ? "/partner" : "/kandidat";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
