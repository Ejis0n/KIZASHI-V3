"use client";

import { useEffect, useState, useMemo } from "react";
import { TOP_CATEGORY_OPTIONS, CATEGORY_LABELS } from "@/lib/subsidy_taxonomy";
import { buildSalesMessages, type TemplateCategory } from "@/lib/sales_templates";

type Item = {
  title: string;
  municipalityName: string | null;
  status: string;
  deadlineDate: string | null;
  endDate: string | null;
  sourceUrl: string | null;
  summary: string | null;
};

type Props = { pref: string; prefName: string; municipalityName: string; initialCategory?: string };

export function MunicipalityDetailClient({ pref, prefName, municipalityName, initialCategory }: Props) {
  const [category, setCategory] = useState(initialCategory || "ALL");
  const [data, setData] = useState<{ municipality: string; category: string; items: Item[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "upcoming">("active");
  const [copyFeedback, setCopyFeedback] = useState<"short" | "long" | null>(null);

  useEffect(() => {
    setCategory(initialCategory || "ALL");
  }, [initialCategory]);

  useEffect(() => {
    setErr(null);
    setData(null);
    const name = municipalityName === "県全域" ? "県全域" : municipalityName;
    const cat = category === "ALL" ? "" : `&category=${encodeURIComponent(category)}`;
    fetch(
      `/api/municipalities/detail?pref=${encodeURIComponent(pref)}&municipality=${encodeURIComponent(name)}${cat}`
    )
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "この県は閲覧できません" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [pref, municipalityName, category]);

  const { messageShort, messageLong, topSubsidies } = useMemo(() => {
    if (!data) return { messageShort: "", messageLong: "", topSubsidies: [] as { title: string; url: string; deadline: string | null; status: string }[] };
    const activeCount = data.items.filter((i) => i.status === "active").length;
    const upcomingCount = data.items.filter((i) => i.status === "upcoming").length;
    const withDeadline = data.items.map((i) => ({
      ...i,
      _sortKey: i.deadlineDate ?? i.endDate ?? "",
    }));
    withDeadline.sort((a, b) => (a._sortKey || "z").localeCompare(b._sortKey || "z"));
    const top3 = withDeadline.slice(0, 3).map((i) => ({
      title: i.title,
      url: i.sourceUrl ?? "",
      deadline: i.deadlineDate ?? i.endDate ?? null,
      status: i.status,
    }));
    const nearest = top3[0]?.deadline ?? null;
    const nearestStr = typeof nearest === "string" ? nearest.slice(0, 10) : nearest ? new Date(nearest).toISOString().slice(0, 10) : null;
    const out = buildSalesMessages({
      prefName,
      municipalityName: data.municipality,
      category: category as TemplateCategory,
      activeCount,
      upcomingCount,
      nearestDeadlineDate: nearestStr,
      topSubsidies: top3.map((s) => ({
        ...s,
        deadline: s.deadline ? (typeof s.deadline === "string" ? s.deadline.slice(0, 10) : new Date(s.deadline).toISOString().slice(0, 10)) : null,
      })),
    });
    return {
      messageShort: out.messageShort,
      messageLong: out.messageLong,
      topSubsidies: top3.map((s) => ({
        title: s.title,
        url: s.url,
        deadline: s.deadline ? (typeof s.deadline === "string" ? s.deadline.slice(0, 10) : new Date(s.deadline).toISOString().slice(0, 10)) : null,
        status: s.status,
      })),
    };
  }, [data, category, prefName]);

  const handleCopy = async (text: string, which: "short" | "long") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(which);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback(null);
    }
  };

  if (err) return <p style={{ color: "#f88" }}>{err}</p>;
  if (!data) return <p style={{ color: "#8b9cad" }}>読み込み中...</p>;

  const filtered = data.items.filter((i) => i.status === tab);
  const deadlineStr = (i: Item) =>
    i.deadlineDate ?? i.endDate ?? "—";

  return (
    <section style={{ color: "#e8e8e8" }}>
      <h1 style={{ color: "#fff" }}>{data.municipality}</h1>
      <p style={{ marginBottom: "0.5rem", color: "#c8d4e0" }}>
        <label>
          タイプ:{" "}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "0.3rem", background: "#1e2a3a", color: "#e8e8e8", border: "1px solid #333" }}
          >
            {TOP_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]}
              </option>
            ))}
          </select>
        </label>
      </p>

      <section style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #444", borderRadius: 8, background: "#0d1220" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem", color: "#fff" }}>営業テンプレ（コピペ用）</h2>
        <p style={{ fontSize: "0.85rem", color: "#8b9cad", marginBottom: "0.75rem" }}>
          業者がそのままコピーしてSMS・メール等に使える文面です。タイプを変えると文面が切り替わります。
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ marginBottom: "0.25rem", fontWeight: "bold", fontSize: "0.9rem", color: "#c8d4e0" }}>ショート（SMS・DM用）</p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", padding: "0.75rem", background: "#1a1a1a", color: "#e8e8e8", borderRadius: 4, fontSize: "0.85rem", margin: "0 0 0.5rem 0", maxHeight: 160, overflow: "auto" }}>
            {messageShort}
          </pre>
          <button
            type="button"
            onClick={() => handleCopy(messageShort, "short")}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem", background: "#1e2a3a", color: "#e8e8e8", border: "1px solid #444", borderRadius: 4 }}
          >
            コピー
          </button>
          {copyFeedback === "short" && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#6a6" }}>コピーしました</span>}
        </div>
        <div>
          <p style={{ marginBottom: "0.25rem", fontWeight: "bold", fontSize: "0.9rem", color: "#c8d4e0" }}>ロング（メール・提案用）</p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all", padding: "0.75rem", background: "#1a1a1a", color: "#e8e8e8", borderRadius: 4, fontSize: "0.85rem", margin: "0 0 0.5rem 0", maxHeight: 280, overflow: "auto" }}>
            {messageLong}
          </pre>
          <button
            type="button"
            onClick={() => handleCopy(messageLong, "long")}
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.9rem", background: "#1e2a3a", color: "#e8e8e8", border: "1px solid #444", borderRadius: 4 }}
          >
            コピー
          </button>
          {copyFeedback === "long" && <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "#6a6" }}>コピーしました</span>}
        </div>
        {topSubsidies.length > 0 && (
          <p style={{ fontSize: "0.85rem", color: "#8b9cad", marginTop: "0.75rem", marginBottom: 0 }}>
            代表補助金（最大3件）: {topSubsidies.map((s) => s.title).join(" / ")}。下の一覧からリンク・期限を確認できます。
          </p>
        )}
      </section>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setTab("active")}
          style={{
            padding: "0.4rem 0.8rem",
            fontWeight: tab === "active" ? "bold" : "normal",
            border: "1px solid #666",
            borderRadius: 4,
            background: tab === "active" ? "#333" : "transparent",
            color: "#e8e8e8",
          }}
        >
          募集中 ({data.items.filter((i) => i.status === "active").length})
        </button>
        <button
          type="button"
          onClick={() => setTab("upcoming")}
          style={{
            padding: "0.4rem 0.8rem",
            fontWeight: tab === "upcoming" ? "bold" : "normal",
            border: "1px solid #666",
            borderRadius: 4,
            background: tab === "upcoming" ? "#333" : "transparent",
            color: "#e8e8e8",
          }}
        >
          これから ({data.items.filter((i) => i.status === "upcoming").length})
        </button>
      </div>
      {filtered.length === 0 ? (
        <p style={{ color: "#8b9cad" }}>該当する補助金はありません。</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filtered.map((i, idx) => (
            <li
              key={idx}
              style={{
                borderBottom: "1px solid #333",
                padding: "0.75rem 0",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: "0.25rem", color: "#e8e8e8" }}>
                {i.sourceUrl ? (
                  <a href={i.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#00d4aa" }}>
                    {i.title}
                  </a>
                ) : (
                  i.title
                )}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#8b9cad" }}>
                期限: {deadlineStr(i)}
              </div>
              {i.summary && (
                <div style={{ fontSize: "0.9rem", marginTop: "0.25rem", color: "#c8d4e0" }}>{i.summary}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
