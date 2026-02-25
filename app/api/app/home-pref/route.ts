import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPrefByCode } from "@/lib/prefs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * ホーム県を初回のみ設定。既に設定済みの場合は 400（変更不可）。
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { prefCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prefCode = typeof body.prefCode === "string" ? body.prefCode.trim() : null;
  if (!prefCode || !getPrefByCode(prefCode)) {
    return NextResponse.json({ error: "Invalid or missing prefCode" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ent = await prisma.entitlement.findUnique({
    where: { userId: user.id },
    select: { homePrefCode: true },
  });
  if (!ent) return NextResponse.json({ error: "Entitlement not found" }, { status: 404 });

  if (ent.homePrefCode != null) {
    return NextResponse.json(
      { error: "homePrefCode is already set and cannot be changed" },
      { status: 400 }
    );
  }

  await prisma.entitlement.update({
    where: { userId: user.id },
    data: { homePrefCode: prefCode, updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, prefCode });
}
