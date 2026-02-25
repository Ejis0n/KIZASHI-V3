/**
 * 日次ダイジェストメール送信。契約中ユーザー（trialing/active）に home 県の TOP5・タイプ別TOP3・直近締切を送る。
 * 二重送信防止: (userId, digestDate) でログを1件のみ。
 * 実行: npm run send:daily-digest
 * ローカルdry-run: DRY_RUN=1 npm run send:daily-digest
 */
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { getPrefByCode } from "../lib/prefs";

const prisma = new PrismaClient();

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const APP_URL = process.env.APP_URL || "https://kizashi.officet2.jp";
const CONCURRENCY = Math.min(5, Math.max(2, parseInt(process.env.DIGEST_CONCURRENCY || "3", 10)));

function getTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || "mail1029.conoha.ne.jp";
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || "";
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD || "";
  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: user ? { user, pass } : undefined,
  });
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function toYMD(d: Date): string {
  return formatDate(d);
}

type TopRow = { municipalityName: string; activeCount: number; upcomingCount: number; nearestDeadlineDate: Date | null; briefText: string };
type TypeRow = { municipalityName: string; nearestDeadlineDate: Date | null };
type DeadlineRow = { title: string; sourceUrl: string; deadlineDate: Date | null; endDate: Date | null };

async function buildDigestContent(
  prefCode: string,
  prefName: string
): Promise<{ subject: string; text: string; html: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);

  const [priorityRow, scoresAll, briefsAll, scoresDemo, scoresVacant, scoresEstate, deadlines] = await Promise.all([
    prisma.priorityMunicipality.findUnique({ where: { prefCode } }),
    prisma.municipalityScore.findMany({ where: { prefCode, category: "ALL" }, orderBy: { score: "desc" }, take: 5 }),
    prisma.municipalityBrief.findMany({ where: { prefCode, category: "ALL" } }),
    prisma.municipalityScore.findMany({ where: { prefCode, category: "DEMOLITION" }, orderBy: { score: "desc" }, take: 3 }),
    prisma.municipalityScore.findMany({ where: { prefCode, category: "VACANT_HOUSE" }, orderBy: { score: "desc" }, take: 3 }),
    prisma.municipalityScore.findMany({ where: { prefCode, category: "ESTATE_CLEARING" }, orderBy: { score: "desc" }, take: 3 }),
    prisma.subsidyItem.findMany({
      where: {
        prefCode,
        status: "active",
        OR: [
          { deadlineDate: { gte: today, lte: end } },
          { endDate: { gte: today, lte: end } },
        ],
      },
      orderBy: [{ deadlineDate: "asc" }, { endDate: "asc" }],
      take: 5,
      select: { title: true, sourceUrl: true, deadlineDate: true, endDate: true },
    }),
  ]);

  const briefMap = new Map(briefsAll.map((b) => [b.municipalityName, b.briefText]));
  const top5: TopRow[] = scoresAll.map((s) => ({
    municipalityName: s.municipalityName,
    activeCount: s.activeCount,
    upcomingCount: s.upcomingCount,
    nearestDeadlineDate: s.nearestDeadlineDate,
    briefText: briefMap.get(s.municipalityName) || "",
  }));

  const typeRows: { label: string; rows: TypeRow[] }[] = [
    { label: "解体", rows: scoresDemo.map((s) => ({ municipalityName: s.municipalityName, nearestDeadlineDate: s.nearestDeadlineDate })) },
    { label: "空き家", rows: scoresVacant.map((s) => ({ municipalityName: s.municipalityName, nearestDeadlineDate: s.nearestDeadlineDate })) },
    { label: "残置物・片付け", rows: scoresEstate.map((s) => ({ municipalityName: s.municipalityName, nearestDeadlineDate: s.nearestDeadlineDate })) },
  ];

  const deadlineList: DeadlineRow[] = deadlines.map((d) => ({
    title: d.title,
    sourceUrl: d.sourceUrl,
    deadlineDate: d.deadlineDate,
    endDate: d.endDate,
  }));

  const subject = `KIZASHI｜本日の動き（${prefName}）`;

  const lines: string[] = [];
  lines.push(`KIZASHI｜本日の動き（${prefName}）`);
  lines.push("");
  if (priorityRow) {
    let reason: { active?: number; deadline7?: number } = {};
    try {
      reason = JSON.parse(priorityRow.reasonJson);
    } catch {
      /* ignore */
    }
    const detailLink = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(priorityRow.municipalityName)}&category=ALL`;
    lines.push("🔴 本日最優先：");
    lines.push(`${priorityRow.municipalityName}（締切${reason.deadline7 ?? 0}件、募集中${reason.active ?? 0}件）`);
    lines.push(detailLink);
    lines.push("");
  }
  lines.push("■ 県内TOP5（全体）");
  for (const r of top5) {
    const link = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(r.municipalityName)}&category=ALL`;
    lines.push(`${r.municipalityName} 募集中${r.activeCount} これから${r.upcomingCount} 締切${formatDate(r.nearestDeadlineDate)}`);
    if (r.briefText) lines.push(`  ${r.briefText.slice(0, 80)}${r.briefText.length > 80 ? "…" : ""}`);
    lines.push(`  ${link}`);
  }
  lines.push("");
  lines.push("■ タイプ別TOP3");
  for (const { label, rows } of typeRows) {
    if (rows.length === 0) continue;
    lines.push(`【${label}】`);
    for (const r of rows) {
      const cat = label === "解体" ? "DEMOLITION" : label === "空き家" ? "VACANT_HOUSE" : "ESTATE_CLEARING";
      const link = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(r.municipalityName)}&category=${cat}`;
      lines.push(`  ${r.municipalityName} 締切${formatDate(r.nearestDeadlineDate)} ${link}`);
    }
  }
  lines.push("");
  lines.push("■ 直近締切（今日〜7日）");
  for (const d of deadlineList) {
    const date = d.deadlineDate ?? d.endDate;
    lines.push(`  ${d.title}`);
    lines.push(`    期限 ${formatDate(date)} ${d.sourceUrl}`);
  }
  lines.push("");
  lines.push(`${APP_URL}/app にログイン`);
  lines.push("※制度内容・条件は自治体の公式ページで必ずご確認ください。");
  lines.push("解約・停止はアプリ内で即時反映されます。");

  const text = lines.join("\n");

  const htmlParts: string[] = [];
  htmlParts.push(`<h2>KIZASHI｜本日の動き（${prefName}）</h2>`);
  if (priorityRow) {
    let reason: { active?: number; deadline7?: number } = {};
    try {
      reason = JSON.parse(priorityRow.reasonJson);
    } catch {
      /* ignore */
    }
    const detailLink = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(priorityRow.municipalityName)}&category=ALL`;
    htmlParts.push("<p><strong>🔴 本日最優先：</strong><br>");
    htmlParts.push(`${escapeHtml(priorityRow.municipalityName)}（締切${reason.deadline7 ?? 0}件、募集中${reason.active ?? 0}件）<br><a href="${detailLink}">詳細</a></p>`);
  }
  htmlParts.push("<h3>■ 県内TOP5（全体）</h3><ul>");
  for (const r of top5) {
    const link = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(r.municipalityName)}&category=ALL`;
    htmlParts.push(`<li><strong>${escapeHtml(r.municipalityName)}</strong> 募集中${r.activeCount} これから${r.upcomingCount} 締切${formatDate(r.nearestDeadlineDate)}<br><small>${escapeHtml(r.briefText.slice(0, 100))}${r.briefText.length > 100 ? "…" : ""}</small><br><a href="${link}">詳細</a></li>`);
  }
  htmlParts.push("</ul><h3>■ タイプ別TOP3</h3>");
  for (const { label, rows } of typeRows) {
    if (rows.length === 0) continue;
    const cat = label === "解体" ? "DEMOLITION" : label === "空き家" ? "VACANT_HOUSE" : "ESTATE_CLEARING";
    htmlParts.push(`<p><strong>${label}</strong></p><ul>`);
    for (const r of rows) {
      const link = `${APP_URL}/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(r.municipalityName)}&category=${cat}`;
      htmlParts.push(`<li>${escapeHtml(r.municipalityName)} 締切${formatDate(r.nearestDeadlineDate)} <a href="${link}">詳細</a></li>`);
    }
    htmlParts.push("</ul>");
  }
  htmlParts.push("<h3>■ 直近締切（今日〜7日）</h3><ul>");
  for (const d of deadlineList) {
    const date = d.deadlineDate ?? d.endDate;
    htmlParts.push(`<li>${escapeHtml(d.title)} 期限${formatDate(date)} <a href="${d.sourceUrl}">リンク</a></li>`);
  }
  htmlParts.push("</ul>");
  htmlParts.push(`<p><a href="${APP_URL}/app">KIZASHIにログイン</a></p>`);
  htmlParts.push("<p><small>※制度内容・条件は自治体の公式ページで必ずご確認ください。<br>解約・停止はアプリ内で即時反映されます。</small></p>");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlParts.join("")}</body></html>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const digestDate = today;

  const alreadySent = await prisma.emailDigestLog.findMany({
    where: { digestDate },
    select: { userId: true },
  });
  const sentUserIds = new Set(alreadySent.map((r) => r.userId));

  const users = await prisma.user.findMany({
    where: {
      role: { not: "admin" },
      email: { not: null },
      entitlement: {
        status: { in: ["trialing", "active"] },
        homePrefCode: { not: null },
      },
    },
    select: {
      id: true,
      email: true,
      entitlement: { select: { homePrefCode: true } },
    },
  });

  const toSend = users.filter((u) => !sentUserIds.has(u.id) && u.entitlement?.homePrefCode);
  if (toSend.length === 0) {
    console.log("[send_daily_digest] No users to send. Exiting.");
    return;
  }

  if (DRY_RUN) {
    console.log("[send_daily_digest] DRY_RUN: would send to", toSend.length, "users");
    const u = toSend[0];
    const prefCode = u.entitlement!.homePrefCode!;
    const prefName = getPrefByCode(prefCode)?.name ?? prefCode;
    const { subject, text } = await buildDigestContent(prefCode, prefName);
    console.log("--- Sample subject ---\n", subject);
    console.log("--- Sample text (first user) ---\n", text);
    return;
  }

  const transporter = getTransporter();
  let sent = 0;
  let failed = 0;

  const processOne = async (u: (typeof toSend)[0]): Promise<void> => {
    const prefCode = u.entitlement!.homePrefCode!;
    const prefName = getPrefByCode(prefCode)?.name ?? prefCode;
    const email = u.email!;
    const sendMail = async (): Promise<void> => {
      const { subject, text, html } = await buildDigestContent(prefCode, prefName);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.EMAIL_FROM || "KIZASHI <kizashi-contact@officet2.jp>",
        to: email,
        subject,
        text,
        html,
      });
    };
    const logSent = () =>
      prisma.emailDigestLog.upsert({
        where: { userId_digestDate: { userId: u.id, digestDate } },
        create: { userId: u.id, prefCode, digestDate, status: "sent", sentAt: new Date() },
        update: { status: "sent", error: null, sentAt: new Date() },
      });
    const logFailed = (errMsg: string) =>
      prisma.emailDigestLog.upsert({
        where: { userId_digestDate: { userId: u.id, digestDate } },
        create: { userId: u.id, prefCode, digestDate, status: "failed", error: errMsg },
        update: { status: "failed", error: errMsg },
      }).catch(() => {});

    try {
      await sendMail();
      await logSent();
      sent += 1;
    } catch (e: unknown) {
      const firstErr = e instanceof Error ? e.message : String(e);
      try {
        await sendMail();
        await logSent();
        sent += 1;
      } catch (e2: unknown) {
        await logFailed(firstErr);
        failed += 1;
        console.error("[send_daily_digest] Failed for", email, firstErr);
      }
    }
  };

  for (let i = 0; i < toSend.length; i += CONCURRENCY) {
    const chunk = toSend.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processOne));
  }

  console.log(`[send_daily_digest] Done. sent=${sent} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
