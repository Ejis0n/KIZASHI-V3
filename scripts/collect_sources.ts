/**
 * VPS/ローカル用: 有効なソースを取得し raw 保存・DB にログを残す。
 * 実行: npm run collect:sources （DATABASE_URL 必須）
 * 本番: COLLECT_SOURCES_DELAY_MS, COLLECT_SOURCES_RETRY 等で調整可（lib/data_job_config.ts）
 */
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { collectSourcesConfig } from "../lib/data_job_config";

const prisma = new PrismaClient();

const RAW_BASE = process.env.KIZASHI_RAW_DIR ?? path.join(process.env.HOME ?? "/tmp", "kizashi", "raw");
const FETCH_TIMEOUT_MS = collectSourcesConfig.fetchTimeoutMs;
const USER_AGENT = "KIZASHI-Bot/1.0 (compatible; data collection)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeUrl(href: string, baseUrl: string): string | null {
  try {
    const u = new URL(href, baseUrl);
    u.hash = "";
    u.searchParams.sort();
    return u.origin + u.pathname + (u.search || "");
  } catch {
    return null;
  }
}

function fingerprint(url: string): string {
  const n = url.toLowerCase().replace(/\/$/, "") || "/";
  return createHash("sha256").update(n).digest("hex").slice(0, 32);
}

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    const text = (m[2] || "").replace(/<[^>]+>/g, "").trim().slice(0, 500);
    const resolved = normalizeUrl(href, baseUrl);
    if (resolved && resolved.startsWith("http")) out.push({ href: resolved, text });
  }
  return out;
}

async function fetchWithTimeout(url: string): Promise<{ ok: boolean; status: number; contentType: string; body: Buffer; error?: string }> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    clearTimeout(to);
    return { ok: res.ok, status: res.status, contentType, body: buf };
  } catch (e: unknown) {
    clearTimeout(to);
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, contentType: "", body: Buffer.from([]), error: err };
  }
}

async function runOne(source: { id: string; sourceType: string; prefCode: string; name: string; url: string; fetchIntervalMinutes: number }) {
  const run = await prisma.sourceFetchRun.create({
    data: { sourceId: source.id, status: "failed" },
  });

  const now = new Date();
  const dateDir = now.toISOString().slice(0, 10).replace(/-/g, "");
  const ext = source.url.toLowerCase().includes(".pdf") ? "pdf" : "html";
  const filename = `${Date.now()}.${ext}`;
  const rawDir = path.join(RAW_BASE, source.prefCode, source.sourceType, dateDir);
  ensureDir(rawDir);
  const rawPath = path.join(rawDir, filename);

  const result = await fetchWithTimeout(source.url);

  if (!result.ok && result.status === 0 && result.error) {
    await prisma.sourceFetchRun.update({
      where: { id: run.id },
      data: { finishedAt: now, error: result.error, rawPath: null, contentType: null },
    });
    return;
  }

  fs.writeFileSync(rawPath, result.body);
  const bytes = result.body.length;
  const isHtml = result.contentType.includes("text/html") || result.body.slice(0, 100).toString().toLowerCase().includes("<!doctype html");

  let itemCount: number | null = null;
  if (isHtml) {
    const html = result.body.toString("utf-8");
    const baseUrl = source.url;
    const baseOrigin = new URL(baseUrl).origin;
    const links = extractLinks(html, baseUrl).filter(({ href }) => {
      try {
        return new URL(href).origin === baseOrigin;
      } catch {
        return false;
      }
    });
    const seen = new Set<string>();
    for (const { href, text } of links) {
      const fp = fingerprint(href);
      if (seen.has(fp)) continue;
      seen.add(fp);
      await prisma.sourceFetchItem.upsert({
        where: { fingerprint: fp },
        create: {
          sourceId: source.id,
          url: href,
          fingerprint: fp,
          title: text || null,
          status: "new",
        },
        update: {},
      });
    }
    itemCount = seen.size;
  }

  await prisma.sourceFetchRun.update({
    where: { id: run.id },
    data: {
      finishedAt: now,
      status: result.ok ? "success" : "failed",
      httpStatus: result.status,
      itemCount,
      bytes,
      error: result.ok ? null : `HTTP ${result.status}`,
      rawPath,
      contentType: result.contentType || null,
    },
  });
}

async function main() {
  ensureDir(RAW_BASE);
  const sources = await prisma.sourceRegistry.findMany({ where: { enabled: true }, orderBy: [{ prefCode: "asc" }] });

  const now = new Date();
  const toRun: typeof sources = [];
  for (const s of sources) {
    const last = await prisma.sourceFetchRun.findFirst({
      where: { sourceId: s.id },
      orderBy: { startedAt: "desc" },
    });
    const lastAt = last?.startedAt ? new Date(last.startedAt).getTime() : 0;
    const nextAt = lastAt + s.fetchIntervalMinutes * 60 * 1000;
    if (now.getTime() >= nextAt) toRun.push(s);
  }

  const total = toRun.length;
  const { delayBetweenSourcesMs, retryAttempts, retryDelayMs } = collectSourcesConfig;
  console.log(`[collect_sources] Enabled: ${sources.length}, to run: ${total} (delay=${delayBetweenSourcesMs}ms, retry=${retryAttempts})`);

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < toRun.length; i++) {
    const s = toRun[i];
    if (i > 0 && delayBetweenSourcesMs > 0) await sleep(delayBetweenSourcesMs);

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        await runOne(s);
        ok += 1;
        console.log(`  [${i + 1}/${total}] OK ${s.prefCode} ${s.name}`);
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < retryAttempts) {
          console.warn(`  [${i + 1}/${total}] Retry ${s.prefCode} in ${retryDelayMs}ms...`, e instanceof Error ? e.message : e);
          await sleep(retryDelayMs);
        } else {
          fail += 1;
          console.error(`  [${i + 1}/${total}] FAIL ${s.prefCode} ${s.name}`, lastErr);
        }
      }
    }
  }

  console.log(`[collect_sources] Done. success=${ok}, failed=${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
