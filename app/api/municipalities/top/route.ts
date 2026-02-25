import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = [
  "ALL",
  "DEMOLITION",
  "VACANT_HOUSE",
  "ESTATE_CLEARING",
  "ELDERLY_REFORM",
  "SEISMIC",
  "ENERGY",
  "BUSINESS_SUPPORT",
  "OTHER",
];

import { canViewPrefAsDemo } from "@/lib/demo_prefs";

/**
 * GET /api/municipalities/top?pref=XX&category=DEMOLITION
 * category 省略時は全体（ALL）。admin / accessPref / home で閲覧可。ALLOW_DEMO_PREFS=true 時はデモ県も可。
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pref = searchParams.get("pref")?.trim();
  let category = searchParams.get("category")?.trim() || "ALL";
  if (!ALLOWED_CATEGORIES.includes(category)) category = "ALL";
  if (!pref) return NextResponse.json({ error: "Missing pref" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, entitlement: { select: { accessPrefCodes: true, homePrefCode: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  const allowed = user.entitlement?.accessPrefCodes ?? [];
  const home = user.entitlement?.homePrefCode;
  const canView = isAdmin || allowed.includes(pref) || home === pref || canViewPrefAsDemo(pref, home);
  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const scores = await prisma.municipalityScore.findMany({
    where: { prefCode: pref, category },
    orderBy: { score: "desc" },
    take: 5,
  });

  type ScoreRow = { municipalityName: string; activeCount: number; upcomingCount: number; nearestDeadlineDate: Date | null };
  type BriefRow = { municipalityName: string; briefText: string; topSubsidiesJson: string };

  const briefs = await prisma.municipalityBrief.findMany({
    where: {
      prefCode: pref,
      category,
      municipalityName: { in: scores.map((s: ScoreRow) => s.municipalityName) },
    },
  });
  const briefMap = new Map<string, BriefRow>(
    briefs.map((b: BriefRow) => [
      b.municipalityName,
      { municipalityName: b.municipalityName, briefText: b.briefText, topSubsidiesJson: b.topSubsidiesJson },
    ])
  );

  const items = scores.map((s: ScoreRow) => {
    const b = briefMap.get(s.municipalityName);
    let topSubsidies: { title: string; url: string; deadline: string | null; status: string }[] = [];
    if (b?.topSubsidiesJson) {
      try {
        topSubsidies = JSON.parse(b.topSubsidiesJson);
      } catch {
        /* ignore */
      }
    }
    return {
      municipalityName: s.municipalityName,
      activeCount: s.activeCount,
      upcomingCount: s.upcomingCount,
      nearestDeadlineDate: s.nearestDeadlineDate ? s.nearestDeadlineDate.toISOString().slice(0, 10) : null,
      briefText: b?.briefText ?? "",
      topSubsidiesJson: topSubsidies,
    };
  });

  return NextResponse.json({ pref, category, top: items });
}
