import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { canViewPrefAsDemo } from "@/lib/demo_prefs";

/**
 * GET /api/subsidies?pref=XX&status=active|upcoming
 * admin: 任意の県、user: accessPrefCodes または homePref。ALLOW_DEMO_PREFS=true 時はデモ県も可。
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pref = searchParams.get("pref")?.trim();
  const status = searchParams.get("status")?.trim();

  if (!pref) {
    return NextResponse.json({ error: "Missing pref" }, { status: 400 });
  }
  const statusFilter = status === "upcoming" || status === "active" ? status : undefined;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, entitlement: { select: { accessPrefCodes: true, homePrefCode: true } } },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  const allowedPrefs = user.entitlement?.accessPrefCodes ?? [];
  const homePref = user.entitlement?.homePrefCode;
  const canView =
    isAdmin ||
    allowedPrefs.includes(pref) ||
    homePref === pref ||
    canViewPrefAsDemo(pref, homePref);
  if (!canView) {
    return NextResponse.json({ error: "Forbidden: pref not in your access" }, { status: 403 });
  }

  const where: { prefCode: string; status?: string } = { prefCode: pref };
  if (statusFilter) where.status = statusFilter;

  const items = await prisma.subsidyItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      title: true,
      municipalityName: true,
      status: true,
      deadlineDate: true,
      endDate: true,
      sourceUrl: true,
      summary: true,
    },
  });

  return NextResponse.json({
    pref,
    status: statusFilter ?? "all",
    items: items.map((i) => ({
      title: i.title,
      municipalityName: i.municipalityName,
      status: i.status,
      deadlineDate: i.deadlineDate,
      endDate: i.endDate,
      sourceUrl: i.sourceUrl,
      summary: i.summary,
    })),
  });
}
