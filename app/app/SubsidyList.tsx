"use client";

import { useEffect, useState, useMemo } from "react";

type SubsidyRow = {
  title: string;
  municipalityName: string | null;
  status: string;
  deadlineDate: string | null;
  endDate: string | null;
  sourceUrl: string;
  summary: string | null;
};

type Props = {
  prefOptions: { code: string; name: string }[];
  defaultPrefCode: string;
};

export function SubsidyList({ prefOptions, defaultPrefCode }: Props) {
  const validCodes = useMemo(() => new Set(prefOptions.map((p) => p.code)), [prefOptions]);
  const [pref, setPref] = useState(() =>
    validCodes.has(defaultPrefCode) ? defaultPrefCode : prefOptions[0]?.code ?? defaultPrefCode
  );
  const [status, setStatus] = useState<"active" | "upcoming">("active");
  const [data, setData] = useState<{ items: SubsidyRow[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 親の表示県が変わったときだけ pref を同期（依存は defaultPrefCode のみで、ユーザーが補助金一覧内で県を変えたときは上書きしない）
  useEffect(() => {
    if (validCodes.has(defaultPrefCode)) {
      setPref(defaultPrefCode);
    } else if (prefOptions[0]) {
      setPref(prefOptions[0].code);
    }
  }, [defaultPrefCode, prefOptions, validCodes]);

  useEffect(() => {
    setErr(null);
    setData(null);
    const params = new URLSearchParams({ pref, status });
    fetch(`/api/subsidies?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "この県は閲覧できません" : String(r.status));
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(e.message));
  }, [pref, status]);

  if (prefOptions.length === 0) return null;

  const currentPrefName = prefOptions.find((p) => p.code === pref)?.name ?? pref;

  return (
    <section className="mt-4">
      <p className="text-sm text-[#b8b8b8] mb-3">
        契約県の「募集中」「これから」の補助金です。詳細はリンク先を参照してください。
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-[#c8d4e0]">県:</span>
          <select
            value={pref}
            onChange={(e) => {
              const next = e.target.value;
              if (validCodes.has(next)) setPref(next);
            }}
            className="min-w-[140px] px-3 py-2 rounded border border-[#1e2a3a] bg-[#0a0e17] text-[#e8e8e8] text-sm focus:outline-none focus:ring-1 focus:ring-[#00d4aa] focus:border-[#00d4aa] cursor-pointer"
            aria-label="表示する県を選択"
            title={currentPrefName}
          >
            {prefOptions.map((p) => (
              <option key={p.code} value={p.code} className="bg-[#0d1220] text-[#e8e8e8]">
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#6b7c8f]">（選択中: {currentPrefName}）</span>
        </label>
        <span className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setStatus("active")}
            className="px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer border border-[#1e2a3a] bg-[#0a0e17] text-[#c8d4e0] hover:bg-[#1e2a3a] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#00d4aa]"
            style={status === "active" ? { background: "#1e2a3a", color: "#00d4aa", borderColor: "#00d4aa" } : undefined}
          >
            募集中
          </button>
          <button
            type="button"
            onClick={() => setStatus("upcoming")}
            className="px-3 py-2 rounded text-sm font-medium transition-colors cursor-pointer border border-[#1e2a3a] bg-[#0a0e17] text-[#c8d4e0] hover:bg-[#1e2a3a] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#00d4aa]"
            style={status === "upcoming" ? { background: "#1e2a3a", color: "#00d4aa", borderColor: "#00d4aa" } : undefined}
          >
            これから
          </button>
        </span>
      </div>
      {err && <p className="text-sm text-[#ff3366]">{err}</p>}
      {!err && !data && <p className="text-sm text-[#6b7c8f]">読み込み中...</p>}
      {data && data.items.length === 0 && <p className="text-sm text-[#6b7c8f]">該当する補助金はありません。</p>}
      {data && data.items.length > 0 && (
        <ul className="list-none p-0">
          {data.items.map((i, idx) => (
            <li key={idx} className="border-b border-[#1e2a3a] py-3">
              <div>
                <a href={i.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00d4aa] hover:underline">
                  {i.title}
                </a>
              </div>
              {(i.municipalityName || i.deadlineDate || i.endDate) && (
                <div className="text-sm text-[#6b7c8f] mt-1">
                  {i.municipalityName && <span>{i.municipalityName} </span>}
                  {(i.deadlineDate || i.endDate) && (
                    <span>期限: {i.deadlineDate ? new Date(i.deadlineDate).toLocaleDateString("ja-JP") : i.endDate ? new Date(i.endDate).toLocaleDateString("ja-JP") : ""}</span>
                  )}
                </div>
              )}
              {i.summary && <p className="text-sm text-[#b8b8b8] mt-1 mb-0">{i.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
