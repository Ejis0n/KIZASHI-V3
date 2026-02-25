/**
 * 補助金詳細取得ジョブ: source_fetch_items（new/seen）から詳細ページを取得し、
 * タイトル・期間・市町村・ステータスをルールベースで抽出して subsidy_items に保存。
 * 実行: npm run collect:subsidy-details（DATABASE_URL 必須）
 * 本番: SUBSIDY_DETAILS_BATCH, SUBSIDY_DETAILS_MAX_ROUNDS 等（lib/data_job_config.ts）
 */
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { getPrefByCode } from "../lib/prefs";
import { subsidyDetailsConfig } from "../lib/data_job_config";

const prisma = new PrismaClient();

const RAW_BASE = process.env.KIZASHI_RAW_DIR ?? path.join(process.env.HOME ?? "/tmp", "kizashi", "raw");
const DETAILS_SUBDIR = "subsidy_details";
const USER_AGENT = "KIZASHI-Bot/1.0 (compatible; data collection)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function fetchWithTimeout(url: string): Promise<{ ok: boolean; status: number; contentType: string; body: Buffer; error?: string }> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), subsidyDetailsConfig.fetchTimeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
    const contentType = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    clearTimeout(to);
    return { ok: res.ok, status: res.status, contentType, body: buf };
  } catch (e: unknown) {
    clearTimeout(to);
    return { ok: false, status: 0, contentType: "", body: Buffer.from([]), error: e instanceof Error ? e.message : String(e) };
  }
}

function extractBodyText(html: string): string {
  const noScript = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  const bodyMatch = noScript.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const fragment = bodyMatch ? bodyMatch[1] : noScript;
  const text = fragment.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.slice(0, 5000);
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (m) return m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 500) || null;
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 500) || null;
  return null;
}

// 日付パース: 令和X年M月D日, R.X.M.D, YYYY年M月D日, YYYY/MM/DD, YYYY-MM-DD
const REIWA_YMD = /令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日?/g;
const REIWA_SHORT = /R\.?\s*(\d+)\.?\s*(\d+)\.?\s*(\d+)/g;
const WAREKI = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/g;
const SLASH = /(\d{4})\/(\d{1,2})\/(\d{1,2})/g;
const DASH = /(\d{4})-(\d{1,2})-(\d{1,2})/g;

function reiwaToDate(r: number, m: number, d: number): Date {
  const y = 2018 + r; // 令和1=2019
  return new Date(y, m - 1, d);
}

function extractDates(text: string): { start: Date | null; end: Date | null; deadline: Date | null } {
  const candidates: Date[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(REIWA_YMD.source, "g");
  while ((m = re.exec(text)) !== null) candidates.push(reiwaToDate(Number(m[1]), Number(m[2]), Number(m[3])));
  const re2 = new RegExp(WAREKI.source, "g");
  while ((m = re2.exec(text)) !== null) candidates.push(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const re3 = new RegExp(SLASH.source, "g");
  while ((m = re3.exec(text)) !== null) candidates.push(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const re4 = new RegExp(DASH.source, "g");
  while ((m = re4.exec(text)) !== null) candidates.push(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));

  if (candidates.length === 0) return { start: null, end: null, deadline: null };
  const sorted = [...candidates].sort((a, b) => a.getTime() - b.getTime());
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const deadline = end;
  return { start, end, deadline };
}

// 市町村: 「〇〇市」「〇〇町」「〇〇村」「〇〇区」のうち、県名で終わるものは除外
function extractMunicipality(text: string, prefName: string): string | null {
  const re = /[^\s、。]+?(?:市|町|村|区)(?=[\s、。]|$)/g;
  const prefSuffix = prefName.replace(/県|府|都/, "");
  let found: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[0].trim();
    if (name.endsWith(prefSuffix) && name.length <= prefName.length + 2) continue;
    found = name.slice(0, 100);
    break;
  }
  return found;
}

function computeStatus(start: Date | null, end: Date | null, deadline: Date | null): "upcoming" | "active" | "expired" | "unknown" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = deadline ?? end ?? start;
  if (!d) return "unknown";
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  if (start) {
    const sDay = new Date(start);
    sDay.setHours(0, 0, 0, 0);
    if (today < sDay) return "upcoming";
  }
  if (today > dDay) return "expired";
  return "active";
}

function computeParseConfidence(title: boolean, hasBody: boolean, hasDate: boolean, hasMunicipality: boolean): number {
  let n = 0;
  if (title) n += 20;
  if (hasBody) n += 20;
  if (hasDate) n += 30;
  if (hasMunicipality) n += 30;
  return Math.min(100, n);
}

async function processItem(
  item: { id: string; url: string; sourceId: string },
  source: { prefCode: string }
): Promise<{ ok: boolean; error?: string }> {
  const pref = getPrefByCode(source.prefCode);
  const prefName = pref?.name ?? "";
  const { retryAttempts, retryDelayMs } = subsidyDetailsConfig;

  let result = await fetchWithTimeout(item.url);
  for (let attempt = 0; !result.ok && attempt < retryAttempts; attempt++) {
    await sleep(retryDelayMs);
    result = await fetchWithTimeout(item.url);
  }

  if (!result.ok) {
    await prisma.sourceFetchItem.update({
      where: { id: item.id },
      data: { status: "failed", lastError: result.error ?? `HTTP ${result.status}` },
    });
    return { ok: false, error: result.error ?? `HTTP ${result.status}` };
  }

  const now = new Date();
  const dateDir = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rawDir = path.join(RAW_BASE, DETAILS_SUBDIR, source.prefCode, dateDir);
  ensureDir(rawDir);
  const ext = result.contentType.includes("pdf") ? "pdf" : "html";
  const rawPath = path.join(rawDir, `${Date.now()}_${item.id.slice(-8)}.${ext}`);
  fs.writeFileSync(rawPath, result.body);

  if (ext === "pdf") {
    await prisma.subsidyItem.upsert({
      where: { sourceUrl: item.url },
      create: {
        prefCode: source.prefCode,
        title: "(PDF)",
        sourceUrl: item.url,
        status: "unknown",
        lastCrawledAt: now,
        rawPath,
        parseConfidence: 0,
      },
      update: { lastCrawledAt: now, rawPath },
    });
    await prisma.sourceFetchItem.update({
      where: { id: item.id },
      data: { status: "fetched", lastFetchedAt: now },
    });
    return { ok: true };
  }

  const html = result.body.toString("utf-8");
  const title = extractTitle(html) ?? "(無題)";
  const bodyText = extractBodyText(html);
  const hasBody = bodyText.length > 50;
  const { start, end, deadline } = extractDates(html + " " + bodyText);
  const hasDate = !!(start ?? end ?? deadline);
  const municipalityName = extractMunicipality(bodyText, prefName);
  const hasMunicipality = !!municipalityName;
  const status = computeStatus(start, end, deadline);
  const parseConfidence = computeParseConfidence(!!extractTitle(html), hasBody, hasDate, hasMunicipality);
  const summary = bodyText.slice(0, 400).trim() || null;

  await prisma.subsidyItem.upsert({
    where: { sourceUrl: item.url },
    create: {
      prefCode: source.prefCode,
      municipalityName,
      title,
      sourceUrl: item.url,
      summary,
      startDate: start ?? undefined,
      endDate: end ?? undefined,
      deadlineDate: deadline ?? undefined,
      status,
      lastCrawledAt: now,
      rawPath,
      parseConfidence,
    },
    update: {
      municipalityName,
      title,
      summary,
      startDate: start ?? undefined,
      endDate: end ?? undefined,
      deadlineDate: deadline ?? undefined,
      status,
      lastCrawledAt: now,
      rawPath,
      parseConfidence,
    },
  });

  await prisma.sourceFetchItem.update({
    where: { id: item.id },
    data: { status: "fetched", lastFetchedAt: now },
  });
  return { ok: true };
}

async function runOneRound(
  subsidySources: { id: string; prefCode: string }[],
  sourceMap: Map<string, { id: string; prefCode: string }>
): Promise<{ processed: number; ok: number; failed: number }> {
  const { batchSize, delayBetweenItemsMs } = subsidyDetailsConfig;

  const items = await prisma.sourceFetchItem.findMany({
    where: {
      sourceId: { in: subsidySources.map((s) => s.id) },
      status: { in: ["new", "seen"] },
    },
    take: batchSize,
    orderBy: { discoveredAt: "asc" },
    select: { id: true, url: true, sourceId: true },
  });

  let ok = 0;
  let failed = 0;
  for (const item of items) {
    const source = sourceMap.get(item.sourceId);
    if (!source) continue;
    try {
      const r = await processItem(item, source);
      if (r.ok) ok += 1;
      else failed += 1;
      console.log(r.ok ? `  OK ${item.url.slice(0, 60)}...` : `  FAIL ${item.id}: ${r.error}`);
    } catch (e) {
      failed += 1;
      console.error(`  ERROR ${item.id}`, e);
      await prisma.sourceFetchItem.update({
        where: { id: item.id },
        data: { status: "failed", lastError: e instanceof Error ? e.message : String(e) },
      });
    }
    await sleep(delayBetweenItemsMs);
  }
  return { processed: items.length, ok, failed };
}

async function main() {
  ensureDir(path.join(RAW_BASE, DETAILS_SUBDIR));

  const subsidySources = await prisma.sourceRegistry.findMany({
    where: { sourceType: "subsidy", enabled: true },
    select: { id: true, prefCode: true },
  });
  if (subsidySources.length === 0) {
    console.log("[collect_subsidy_details] No enabled subsidy sources.");
    return;
  }

  const sourceMap = new Map(subsidySources.map((s) => [s.id, s]));
  const { batchSize, maxRounds } = subsidyDetailsConfig;
  const maxRoundsToRun = maxRounds <= 0 ? 1 : maxRounds;

  let totalProcessed = 0;
  let totalOk = 0;
  let totalFailed = 0;

  console.log(`[collect_subsidy_details] batch=${batchSize}, maxRounds=${maxRoundsToRun}, delay=${subsidyDetailsConfig.delayBetweenItemsMs}ms`);

  for (let round = 1; round <= maxRoundsToRun; round++) {
    const remaining = await prisma.sourceFetchItem.count({
      where: {
        sourceId: { in: subsidySources.map((s) => s.id) },
        status: { in: ["new", "seen"] },
      },
    });
    if (remaining === 0) {
      console.log(`[collect_subsidy_details] Round ${round}: queue empty, done.`);
      break;
    }

    console.log(`[collect_subsidy_details] Round ${round}/${maxRoundsToRun} (remaining ${remaining})`);
    const { processed, ok, failed } = await runOneRound(subsidySources, sourceMap);
    totalProcessed += processed;
    totalOk += ok;
    totalFailed += failed;

    if (processed === 0) break;
  }

  const finalRemaining = await prisma.sourceFetchItem.count({
    where: {
      sourceId: { in: subsidySources.map((s) => s.id) },
      status: { in: ["new", "seen"] },
    },
  });
  console.log(
    `[collect_subsidy_details] Done. processed=${totalProcessed}, ok=${totalOk}, failed=${totalFailed}, remaining=${finalRemaining}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
