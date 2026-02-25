"use client";

import { useEffect, useState } from "react";

type Health = {
  since: string;
  sent: number;
  failed: number;
  skipped: number;
  topErrors: { error: string; count: number }[];
};

export function EmailDigestHealthTable() {
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/email/health")
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <p style={{ color: "#c00" }}>メールヘルス取得エラー: {err}</p>;
  if (!data) return <p>読み込み中...</p>;

  return (
    <section style={{ marginTop: "1rem" }}>
      <h3 style={{ fontSize: "1rem" }}>日次メールダイジェスト（直近7日）</h3>
      <p style={{ fontSize: "0.85rem", color: "#666" }}>
        sent: {data.sent} / failed: {data.failed} / skipped: {data.skipped}（since {data.since}）
      </p>
      {data.topErrors.length > 0 && (
        <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
          <strong>失敗エラー上位:</strong>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", fontSize: "0.8rem", marginTop: "0.25rem", background: "#1a1a1a", padding: "0.5rem" }}>
            {data.topErrors.map((e, i) => `[${e.count}回] ${e.error}`).join("\n")}
          </pre>
        </p>
      )}
    </section>
  );
}
