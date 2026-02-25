"use client";

import { useState } from "react";

type Pref = { code: string; name: string };

export function SetHomePrefForm({ prefs }: { prefs: Pref[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const prefCode = (form.elements.namedItem("prefCode") as HTMLSelectElement)?.value;
    if (!prefCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/app/home-pref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
      <label>
        ホーム県（一度設定すると変更できません）
        <select name="prefCode" required style={{ display: "block", marginTop: "0.25rem", minWidth: 200 }}>
          <option value="">選択してください</option>
          {prefs.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {error && <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>}
      <button type="submit" disabled={loading} style={{ marginTop: "0.5rem" }}>
        {loading ? "保存中…" : "保存"}
      </button>
    </form>
  );
}
