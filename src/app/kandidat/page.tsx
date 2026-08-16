import { getAuthUser } from "@/lib/auth";

export default async function KandidatProfil() {
  const user = await getAuthUser();

  return (
    <div>
      <h1 className="text-2xl font-bold">Mein Profil</h1>
      <p className="mt-1 text-muted-foreground">
        {user.name || user.email}
      </p>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          Profilvervollständigung und Masterclass-Zugang werden hier angezeigt.
        </p>
      </div>
    </div>
  );
}
