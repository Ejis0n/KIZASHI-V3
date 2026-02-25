import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAllPrefs } from "@/lib/prefs";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 管理者のみ。県別のソース取得ヘルス（24h成功/失敗、lastSuccessAt、failStreak） */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sources = await prisma.sourceRegistry.findMany({
    where: { enabled: true },
    select: { id: true, prefCode: true, sourceType: true, name: true },
  });
  const runs = await prisma.sourceFetchRun.findMany({
    where: { sourceId: { in: sources.map((s) => s.id) } },
    orderBy: { startedAt: "desc" },
    select: { sourceId: true, startedAt: true, status: true, finishedAt: true },
  });

  const runsBySource = new Map<string, typeof runs>();
  for (const r of runs) {
    const list = runsBySource.get(r.sourceId) ?? [];
    list.push(r);
    runsBySource.set(r.sourceId, list);
  }

  function failStreak(sourceId: string): number {
    const list = runsBySource.get(sourceId) ?? [];
    let n = 0;
    for (const r of list) {
      if (r.status !== "failed") break;
      n++;
    }
    return n;
  }

  function lastSuccessAt(sourceId: string): Date | null {
    const list = runsBySource.get(sourceId) ?? [];
    const ok = list.find((r) => r.status === "success");
    return ok?.finishedAt ?? null;
  }

  function count24h(sourceId: string): { success: number; failed: number } {
    const list = (runsBySource.get(sourceId) ?? []).filter((r) => r.startedAt >= since);
    return {
      success: list.filter((r) => r.status === "success").length,
      failed: list.filter((r) => r.status === "failed").length,
    };
  }

  const prefs = getAllPrefs();
  const health: {
    prefCode: string;
    prefName: string;
    enabledSources: number;
    success24h: number;
    failed24h: number;
    lastSuccessAt: string | null;
    failStreak: number;
  }[] = [];

  for (const pref of prefs) {
    const prefSources = sources.filter((s) => s.prefCode === pref.code);
    const enabledSources = prefSources.length;
    let success24h = 0;
    let failed24h = 0;
    let lastSuccess: Date | null = null;
    let maxStreak = 0;
    for (const s of prefSources) {
      const c = count24h(s.id);
      success24h += c.success;
      failed24h += c.failed;
      const ls = lastSuccessAt(s.id);
      if (ls && (!lastSuccess || ls > lastSuccess)) lastSuccess = ls;
      const streak = failStreak(s.id);
      if (streak > maxStreak) maxStreak = streak;
    }
    health.push({
      prefCode: pref.code,
      prefName: pref.name,
      enabledSources,
      success24h,
      failed24h,
      lastSuccessAt: lastSuccess ? lastSuccess.toISOString() : null,
      failStreak: maxStreak,
    });
  }

  return NextResponse.json({ health });
}
