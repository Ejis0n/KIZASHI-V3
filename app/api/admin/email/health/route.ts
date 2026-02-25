import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** 管理者のみ。直近7日間のメールダイジェスト送信ログ: sent/failed/skipped 件数、failed の上位エラー */
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

  const since = new Date();
  since.setDate(since.getDate() - 7);
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.emailDigestLog.findMany({
    where: { createdAt: { gte: since } },
    select: { status: true, error: true },
  });

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const skipped = logs.filter((l) => l.status === "skipped").length;

  const errorCounts = new Map<string, number>();
  for (const l of logs) {
    if (l.status === "failed" && l.error) {
      const key = l.error.slice(0, 200);
      errorCounts.set(key, (errorCounts.get(key) ?? 0) + 1);
    }
  }
  const topErrors = Array.from(errorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([msg, count]) => ({ error: msg, count }));

  return NextResponse.json({
    since: since.toISOString().slice(0, 10),
    sent,
    failed,
    skipped,
    topErrors,
  });
}
