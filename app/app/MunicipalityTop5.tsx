"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TOP_CATEGORY_OPTIONS, CATEGORY_LABELS } from "@/lib/subsidy_taxonomy";

type TopItem = {
  municipalityName: string;
  activeCount: number;
  upcomingCount: number;
  nearestDeadlineDate: string | null;
  briefText: string;
  topSubsidiesJson: { title: string; url: string; deadline: string | null; status: string }[];
};

type Props = { prefCode: string };

export function MunicipalityTop5({ prefCode }: Props) {
  const [category, setCategory] = useState<string>("ALL");
  const [data, setData] = useState<{ category: string; top: TopItem[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setData(null);
    const cat = category === "ALL" ? "ALL" : category;
    fetch(`/api/municipalities/top?pref=${encodeURIComponent(prefCode)}&category=${encodeURIComponent(cat)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "この県は閲覧できません" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [prefCode, category]);

  if (err) return <p style={{ color: "#c00" }}>{err}</p>;
  if (!data) return <p style={{ color: "#888" }}>読み込み中...</p>;
  if (data.top.length === 0) return <p style={{ color: "#888" }}>スコア未計算です。compute:municipality-scores を実行してください。</p>;

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>今動いている市町村 TOP5</h2>
      <p style={{ marginBottom: "0.5rem" }}>
        <label>
          タイプ:{" "}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "0.3rem" }}
          >
            {TOP_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 520 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #444" }}>
              <th style={{ textAlign: "left", padding: "0.4rem" }}>市町村</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>募集中</th>
              <th style={{ textAlign: "right", padding: "0.4rem" }}>これから</th>
              <th style={{ textAlign: "left", padding: "0.4rem" }}>直近締切</th>
              <th style={{ textAlign: "left", padding: "0.4rem" }}>営業メモ</th>
            </tr>
          </thead>
          <tbody>
            {data.top.map((row) => (
              <tr key={row.municipalityName} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "0.4rem" }}>
                  <Link
                    href={`/app/municipality?pref=${encodeURIComponent(prefCode)}&name=${encodeURIComponent(row.municipalityName)}${category !== "ALL" ? `&category=${encodeURIComponent(category)}` : ""}`}
                    style={{ fontWeight: "bold" }}
                  >
                    {row.municipalityName}
                  </Link>
                </td>
                <td style={{ textAlign: "right", padding: "0.4rem" }}>{row.activeCount}</td>
                <td style={{ textAlign: "right", padding: "0.4rem" }}>{row.upcomingCount}</td>
                <td style={{ padding: "0.4rem", fontSize: "0.9rem" }}>
                  {row.nearestDeadlineDate ? new Date(row.nearestDeadlineDate).toLocaleDateString("ja-JP") : "—"}
                </td>
                <td style={{ padding: "0.4rem", fontSize: "0.85rem", maxWidth: 280 }}>{row.briefText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
        代表補助金（最大3件）: 各市町村の行の「市町村名」をクリックで詳細一覧へ。
      </p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
        {data.top.map((row) => (
          <li key={row.municipalityName} style={{ marginBottom: "0.75rem" }}>
            <strong>{row.municipalityName}</strong>
            {row.topSubsidiesJson.length > 0 ? (
              <ul style={{ margin: "0.25rem 0 0 1rem", padding: 0 }}>
                {row.topSubsidiesJson.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.9rem" }}>
                      {s.title}
                    </a>
                    {s.deadline && <span style={{ color: "#888", marginLeft: "0.5rem" }}>締切: {s.deadline}</span>}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
