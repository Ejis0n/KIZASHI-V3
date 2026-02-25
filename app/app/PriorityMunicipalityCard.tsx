"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CATEGORY_LABEL: Record<string, string> = {
  DEMOLITION: "解体",
  VACANT_HOUSE: "空き家",
  ESTATE_CLEARING: "残置物・片付け",
  ELDERLY_REFORM: "高齢者改修",
  ENERGY: "省エネ",
  OTHER: "その他",
};

type Props = { prefCode: string };

export function PriorityMunicipalityCard({ prefCode }: Props) {
  const [data, setData] = useState<{
    priority: {
      municipalityName: string;
      score: number;
      reasonJson: { active?: number; upcoming?: number; deadline7?: number; deadline3?: number; categoryBoost?: string };
      detailLink: string;
    } | null;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setData(null);
    fetch(`/api/municipalities/priority?pref=${encodeURIComponent(prefCode)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "閲覧できません" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [prefCode]);

  if (err) return null;
  if (!data || !data.priority) return null;

  const p = data.priority;
  const r = p.reasonJson;
  const categoryLabel = r.categoryBoost ? CATEGORY_LABEL[r.categoryBoost] || r.categoryBoost : null;

  return (
    <section
      style={{
        marginTop: "1rem",
        padding: "1rem",
        border: "2px solid #c00",
        borderRadius: 8,
        background: "rgba(200,0,0,0.08)",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>🔴 本日最優先</h2>
      <p style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
        {p.municipalityName}（スコア {p.score}）
      </p>
      <ul style={{ margin: "0.5rem 0", paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
        {typeof r.active === "number" && <li>募集中 {r.active}件</li>}
        {typeof r.deadline7 === "number" && r.deadline7 > 0 && <li>7日以内締切 {r.deadline7}件</li>}
        {typeof r.deadline3 === "number" && r.deadline3 > 0 && <li>3日以内締切 {r.deadline3}件</li>}
        {categoryLabel && <li>{categoryLabel}系が強い</li>}
      </ul>
      <p style={{ marginBottom: 0 }}>
        <Link href={p.detailLink} style={{ fontWeight: "bold" }}>
          詳細を見る
        </Link>
      </p>
    </section>
  );
}
