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
 * GET /api/municipalities/detail?pref=XX&municipality=YYY&category=DEMOLITION
 * category 省略時は全体。admin / accessPref / home で閲覧可。ALLOW_DEMO_PREFS=true 時はデモ県も可。
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pref = searchParams.get("pref")?.trim();
  const municipality = searchParams.get("municipality")?.trim();
  let category = searchParams.get("category")?.trim() || null;
  if (category && !ALLOWED_CATEGORIES.includes(category)) category = null;
  if (!pref || municipality === null || municipality === "") {
    return NextResponse.json({ error: "Missing pref or municipality" }, { status: 400 });
  }

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

  const municipalityName = municipality === "県全域" ? null : municipality;
  const munForQuery = municipalityName ?? "県全域";
  let items = await prisma.subsidyItem.findMany({
    where: {
      prefCode: pref,
      status: { in: ["active", "upcoming"] },
      municipalityName: municipalityName === null ? null : municipalityName,
      ...(category ? { category } : {}),
    },
    orderBy: [{ deadlineDate: "asc" }, { endDate: "asc" }, { updatedAt: "desc" }],
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

  type Row = {
    title: string;
    municipalityName: string | null;
    status: string;
    deadlineDate: Date | null;
    endDate: Date | null;
    sourceUrl: string | null;
    summary: string | null;
  };

  // subsidy_item が0件のときは municipality_brief の topSubsidiesJson をフォールバック（デモ用）
  if (items.length === 0) {
    const brief = await prisma.municipalityBrief.findUnique({
      where: {
        prefCode_municipalityName_category: {
          prefCode: pref,
          municipalityName: munForQuery,
          category: category ?? "ALL",
        },
      },
      select: { topSubsidiesJson: true },
    });
    if (brief?.topSubsidiesJson) {
      try {
        const parsed = JSON.parse(brief.topSubsidiesJson) as { title: string; url: string; deadline: string | null; status: string }[];
        items = parsed.map((s) => ({
          title: s.title,
          municipalityName: munForQuery as string | null,
          status: s.status === "upcoming" ? "upcoming" : "active",
          deadlineDate: s.deadline ? new Date(s.deadline) : null,
          endDate: null,
          sourceUrl: s.url ?? "",
          summary: null,
        }));
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json({
    pref,
    municipality: municipalityName ?? "県全域",
    category: category ?? "ALL",
    items: items.map((i: Row) => ({
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
