"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-Mail oder Passwort falsch.");
      setLoading(false);
      return;
    }

    // Determine dashboard by role
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();
      const role = profile?.role || "candidate";
      const dashboardPath =
        role === "admin"
          ? "/admin"
          : role === "partner"
            ? "/partner"
            : "/kandidat";
      router.push(dashboardPath);
    } else {
      router.push("/admin");
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-[#1a0505] via-[#2d0a0a] to-[#0d0507] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/30">
              <span className="text-sm font-bold text-white">ZM</span>
            </div>
            <span className="text-xl font-semibold text-white">Zoepp Media</span>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight text-white">
            Vertriebsvermittlung
            <br />
            <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              auf dem nächsten Level.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/50">
            Vertriebler finden, qualifizieren und vermitteln — alles in einer Plattform.
          </p>
        </div>
        <p className="text-sm text-white/30">
          &copy; {new Date().getFullYear()} Content-Leads Solutions UG
        </p>
      </div>

      {/* Right side - login form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
                <span className="text-sm font-bold text-white">ZM</span>
              </div>
              <span className="text-xl font-semibold">Zoepp Media</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold">Anmelden</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Melde dich in deinem Account an
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="h-11 w-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/20"
              disabled={loading}
            >
              {loading ? "Anmelden..." : "Anmelden"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
