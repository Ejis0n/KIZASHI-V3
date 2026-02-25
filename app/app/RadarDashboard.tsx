"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MAIN_CATEGORIES_FOR_SCORES, CATEGORY_LABELS } from "@/lib/subsidy_taxonomy";

type PriorityData = {
  municipalityName: string;
  score: number;
  reasonJson: {
    active?: number;
    upcoming?: number;
    deadline7?: number;
    deadline3?: number;
    categoryBoost?: string;
  };
  detailLink: string;
};

type TopItem = {
  municipalityName: string;
  activeCount: number;
  upcomingCount: number;
  nearestDeadlineDate: string | null;
  briefText: string;
};

type Props = { prefCode: string; prefName: string };

function getStatus(score: number): "HOT" | "WARM" | "COLD" {
  if (score >= 35) return "HOT";
  if (score >= 18) return "WARM";
  return "COLD";
}

export function RadarDashboard({ prefCode, prefName }: Props) {
  const [priority, setPriority] = useState<PriorityData | null | undefined>(undefined);
  const [topAll, setTopAll] = useState<TopItem[] | null>(null);
  const [categoryValues, setCategoryValues] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setPriority(undefined);
    setTopAll(null);
    setCategoryValues(null);

    fetch(`/api/municipalities/priority?pref=${encodeURIComponent(prefCode)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "閲覧できません" : String(r.status));
        return r.json();
      })
      .then((d) => setPriority(d.priority))
      .catch((e) => setErr(e.message));

    fetch(`/api/municipalities/top?pref=${encodeURIComponent(prefCode)}&category=ALL`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "閲覧できません" : String(r.status));
        return r.json();
      })
      .then((d) => setTopAll(d.top ?? []))
      .catch(() => {});

    const categories = MAIN_CATEGORIES_FOR_SCORES;
    Promise.all(
      categories.map((cat) =>
        fetch(
          `/api/municipalities/top?pref=${encodeURIComponent(prefCode)}&category=${encodeURIComponent(cat)}`
        ).then((r) => (r.ok ? r.json() : { top: [] }))
      )
    ).then((results) => {
      const map: Record<string, number> = {};
      results.forEach((res, i) => {
        const cat = categories[i];
        const total = (res.top ?? []).reduce((s: number, r: TopItem) => s + (r.activeCount ?? 0), 0);
        map[cat] = total;
      });
      setCategoryValues(map);
    });
  }, [prefCode]);

  if (err) {
    return (
      <div className="min-h-screen bg-radar-bg text-radar-text p-4">
        <p className="text-radar-hot">{err}</p>
      </div>
    );
  }

  const status = priority ? getStatus(priority.score) : null;
  const maxTopActive = topAll?.length
    ? Math.max(...topAll.map((r) => r.activeCount), 1)
    : 1;
  const maxCategory = categoryValues
    ? Math.max(...Object.values(categoryValues), 1)
    : 1;

  return (
    <div className="min-h-screen bg-radar-bg text-radar-text font-sans">
      {/* 薄いグリッド背景 */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,170,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,170,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative max-w-lg mx-auto px-4 py-6 pb-24">
        {/* SECTION 1: LOCK TARGET */}
        <section className="mb-6 rounded-lg border border-radar-border bg-radar-panel/80 p-4 shadow-glow">
          <div className="text-xs tracking-widest text-radar-mute mb-2 uppercase">Lock Target</div>
          {priority === undefined ? (
            <div className="text-radar-mute text-sm py-8 text-center">読み込み中...</div>
          ) : priority === null ? (
            <div className="text-radar-mute text-sm py-8 text-center">スコア未計算です</div>
          ) : (
            <>
              <div className="text-lg font-semibold text-white mb-1">{priority.municipalityName}</div>
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="text-4xl font-bold tabular-nums tracking-tight"
                  style={{
                    color: "#00d4aa",
                    textShadow: "0 0 20px rgba(0, 212, 170, 0.5)",
                  }}
                >
                  {priority.score}
                </span>
                <span className="text-sm text-radar-mute">PRIORITY SCORE</span>
              </div>
              {/* ネオンバー */}
              <div className="h-1.5 w-full rounded-full bg-radar-border overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (priority.score / 60) * 100)}%`,
                    background: "linear-gradient(90deg, #00d4aa, rgba(0,212,170,0.5))",
                    boxShadow: "0 0 12px rgba(0, 212, 170, 0.6)",
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded border ${
                    status === "HOT"
                      ? "border-radar-hot text-radar-hot bg-radar-hot/10"
                      : status === "WARM"
                        ? "border-radar-warm text-radar-warm bg-radar-warm/10"
                        : "border-radar-cold text-radar-cold bg-radar-cold/10"
                  }`}
                >
                  {status}
                </span>
                <Link
                  href={`/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(priority.municipalityName)}&category=ALL`}
                  className="text-xs text-radar-neon hover:underline"
                >
                  詳細 →
                </Link>
              </div>
            </>
          )}
        </section>

        {/* SECTION 2: SCAN RESULT */}
        <section className="mb-6 rounded-lg border border-radar-border bg-radar-panel/80 p-4 shadow-glow">
          <div className="text-xs tracking-widest text-radar-mute mb-3 uppercase">Scan Result</div>
          {!topAll ? (
            <div className="text-radar-mute text-sm py-6 text-center">読み込み中...</div>
          ) : topAll.length === 0 ? (
            <div className="text-radar-mute text-sm py-6 text-center">データなし</div>
          ) : (
            <ul className="space-y-3">
              {topAll.map((row, i) => {
                const pct = maxTopActive > 0 ? (row.activeCount / maxTopActive) * 100 : 0;
                const detailUrl = `/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(row.municipalityName)}&category=ALL`;
                return (
                  <li key={row.municipalityName} className="flex items-center gap-3">
                    <span className="text-radar-mute text-xs w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={detailUrl}
                        className="text-sm font-medium text-white hover:text-radar-neon block truncate"
                      >
                        {row.municipalityName}
                      </Link>
                      <div className="h-1.5 mt-1 rounded-full bg-radar-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-radar-neon/80"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs tabular-nums text-radar-neon w-8 text-right">
                      {row.activeCount}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* SECTION 3: DEADLINE RADAR */}
        <section className="mb-6 rounded-lg border border-radar-border bg-radar-panel/80 p-4 shadow-glow">
          <div className="text-xs tracking-widest text-radar-mute mb-3 uppercase">Deadline Radar</div>
          {priority === undefined || priority === null ? (
            <div className="text-radar-mute text-sm py-4 text-center">—</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded border border-radar-border bg-radar-bg/50 p-3 text-center">
                <div className="text-2xl font-bold tabular-nums text-radar-hot">
                  {priority.reasonJson?.deadline3 ?? 0}
                </div>
                <div className="text-xs text-radar-mute mt-1">D-3</div>
              </div>
              <div className="rounded border border-radar-border bg-radar-bg/50 p-3 text-center">
                <div className="text-2xl font-bold tabular-nums text-radar-warm">
                  {priority.reasonJson?.deadline7 ?? 0}
                </div>
                <div className="text-xs text-radar-mute mt-1">D-7</div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: CATEGORY CLUSTER（クリックで該当カテゴリの市町村詳細へ） */}
        <section className="mb-6 rounded-lg border border-radar-border bg-radar-panel/80 p-4 shadow-glow">
          <div className="text-xs tracking-widest text-radar-mute mb-3 uppercase">Category Cluster</div>
          {!categoryValues ? (
            <div className="text-radar-mute text-sm py-4 text-center">読み込み中...</div>
          ) : (
            <ul className="space-y-2.5">
              {MAIN_CATEGORIES_FOR_SCORES.map((cat) => {
                const val = categoryValues[cat] ?? 0;
                const pct = maxCategory > 0 ? (val / maxCategory) * 100 : 0;
                const label = CATEGORY_LABELS[cat] ?? cat;
                const detailUrl = priority
                  ? `/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(priority.municipalityName)}&category=${encodeURIComponent(cat)}`
                  : "#";
                return (
                  <li key={cat}>
                    <Link
                      href={detailUrl}
                      className="flex items-center gap-3 rounded px-1 py-0.5 -mx-1 hover:bg-radar-border/50 transition-colors cursor-pointer group"
                    >
                      <span className="text-xs text-radar-mute w-24 shrink-0 truncate group-hover:text-radar-neon">{label}</span>
                      <div className="flex-1 h-2 rounded-full bg-radar-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-radar-neon/60 to-radar-neon"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-radar-mute w-6 text-right group-hover:text-radar-neon">{val}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
