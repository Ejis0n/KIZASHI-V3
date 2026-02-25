import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || "https://kizashi.officet2.jp";

import { canViewPrefAsDemo } from "@/lib/demo_prefs";

/**
 * GET /api/municipalities/priority?pref=XX
 * 県ごと最優先1市町村を返す。admin=全県、user=homePref。ALLOW_DEMO_PREFS=true 時はデモ県も可。
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pref = searchParams.get("pref")?.trim();
  if (!pref) return NextResponse.json({ error: "Missing pref" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, entitlement: { select: { homePrefCode: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  const home = user.entitlement?.homePrefCode;
  const canView = isAdmin || home === pref || canViewPrefAsDemo(pref, home);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const row = await prisma.priorityMunicipality.findUnique({
    where: { prefCode: pref },
  });

  if (!row) {
    return NextResponse.json({ priority: null, pref });
  }

  let reason: { active?: number; upcoming?: number; deadline7?: number; deadline3?: number; categoryBoost?: string } = {};
  try {
    reason = JSON.parse(row.reasonJson);
  } catch {
    /* ignore */
  }

  const detailLink = `${APP_URL}/app/municipality?pref=${encodeURIComponent(pref)}&name=${encodeURIComponent(row.municipalityName)}&category=ALL`;

  return NextResponse.json({
    pref,
    priority: {
      municipalityName: row.municipalityName,
      score: row.score,
      reasonJson: reason,
      detailLink,
    },
  });
}
