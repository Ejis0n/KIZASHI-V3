"use client";

import { useEffect, useState } from "react";

type HealthRow = {
  prefCode: string;
  prefName: string;
  enabledSources: number;
  success24h: number;
  failed24h: number;
  lastSuccessAt: string | null;
  failStreak: number;
};

export function SourcesHealthTable() {
  const [data, setData] = useState<{ health: HealthRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sources/health")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p style={{ color: "#c00" }}>ヘルス取得エラー: {err}</p>;
  if (!data) return <p>読み込み中...</p>;

  const rows = data.health.filter((h) => h.enabledSources > 0);
  if (rows.length === 0) return <p>有効なソースがありません。seed:sources を実行してください。</p>;

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>ソース取得ヘルス（管理者用）</h2>
      <p style={{ fontSize: "0.9rem", color: "#666" }}>
        直近24hの成功/失敗数、最終成功時刻、連続失敗数（failStreak）
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #444" }}>
              <th style={{ textAlign: "left", padding: "0.4rem 0.6rem" }}>県</th>
              <th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>有効数</th>
              <th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>成功(24h)</th>
              <th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>失敗(24h)</th>
              <th style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>連続失敗</th>
              <th style={{ textAlign: "left", padding: "0.4rem 0.6rem" }}>最終成功</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.prefCode} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "0.4rem 0.6rem" }}>{r.prefName}</td>
                <td style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>{r.enabledSources}</td>
                <td style={{ textAlign: "right", padding: "0.4rem 0.6rem" }}>{r.success24h}</td>
                <td style={{ textAlign: "right", padding: "0.4rem 0.6rem", color: r.failed24h > 0 ? "#f80" : undefined }}>{r.failed24h}</td>
                <td style={{ textAlign: "right", padding: "0.4rem 0.6rem", color: r.failStreak > 0 ? "#c00" : undefined }}>{r.failStreak}</td>
                <td style={{ padding: "0.4rem 0.6rem", fontSize: "0.85rem" }}>
                  {r.lastSuccessAt ? new Date(r.lastSuccessAt).toLocaleString("ja-JP") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
