import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrefByCode } from "@/lib/prefs";
import { MunicipalityDetailClient } from "./MunicipalityDetailClient";

export default async function MunicipalityPage({
  searchParams,
}: {
  searchParams: Promise<{ pref?: string; name?: string; category?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/app/municipality");

  const params = await searchParams;
  const pref = params.pref?.trim();
  const name = params.name?.trim();
  const category = params.category?.trim() || undefined;
  if (!pref || name === undefined || name === "") {
    redirect("/app");
  }

  const prefName = getPrefByCode(pref)?.name ?? pref;

  return (
    <main style={{ padding: "1rem", maxWidth: 900, background: "#0d1220", color: "#e8e8e8", minHeight: "100vh" }}>
      <p>
        <Link href="/app" style={{ color: "#00d4aa" }}>← ダッシュボード</Link>
      </p>
      <MunicipalityDetailClient
        pref={pref}
        prefName={prefName}
        municipalityName={decodeURIComponent(name)}
        initialCategory={category}
      />
    </main>
  );
}
