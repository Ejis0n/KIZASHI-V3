"use client";

import Link from "next/link";
import { useState } from "react";
import { RadarDashboard } from "./RadarDashboard";
import { SubsidyList } from "./SubsidyList";
import { AppBillingActions } from "./AppBillingActions";
import { EmailDigestHealthTable } from "./EmailDigestHealthTable";
import { SourcesHealthTable } from "./SourcesHealthTable";

type PrefOption = { code: string; name: string };

type Props = {
  homePrefCode: string;
  homePrefName: string;
  prefOptions: PrefOption[];
  isAdmin: boolean;
  ent: { status?: string; trialEndAt?: string | null } | null;
  canStartCheckout: boolean;
  canCancel: boolean;
  signOutAction: () => Promise<void>;
};

export function AppDashboardContent({
  homePrefCode,
  homePrefName,
  prefOptions,
  isAdmin,
  ent,
  canStartCheckout,
  canCancel,
  signOutAction,
}: Props) {
  const [selectedPrefCode, setSelectedPrefCode] = useState(homePrefCode);
  const selectedPrefName = prefOptions.find((p) => p.code === selectedPrefCode)?.name ?? selectedPrefCode;

  return (
    <>
      {/* 県セレクト：レーダー全体の表示県を切り替え（ヘッダーに固定） */}
      <div className="sticky top-0 z-20 bg-[#0a0e17]/95 border-b border-[#1e2a3a] px-4 py-3">
        <div className="max-w-lg mx-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs tracking-widest text-[#6b7c8f] uppercase">KIZASHI RADAR</span>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[#6b7c8f]">表示県:</span>
            <select
              value={selectedPrefCode}
              onChange={(e) => setSelectedPrefCode(e.target.value)}
              className="px-3 py-2 rounded border border-[#1e2a3a] bg-[#0d1220] text-[#e8e8e8] text-sm focus:outline-none focus:ring-1 focus:ring-[#00d4aa] focus:border-[#00d4aa] cursor-pointer min-w-[140px]"
              aria-label="表示する県を選択"
            >
              {prefOptions.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <RadarDashboard prefCode={selectedPrefCode} prefName={selectedPrefName} />

      <div className="relative max-w-lg mx-auto px-4 py-6 pb-24 border-t border-[#1e2a3a]">
        <section className="rounded-lg border border-[#1e2a3a] bg-[#0d1220]/80 p-4 mb-4">
          <h2 className="text-xs tracking-widest text-[#6b7c8f] uppercase mb-3">補助金一覧</h2>
          <SubsidyList defaultPrefCode={selectedPrefCode} prefOptions={prefOptions} />
        </section>

        <section className="rounded-lg border border-[#1e2a3a] bg-[#0d1220]/80 p-4 mb-4">
          <h2 className="text-xs tracking-widest text-[#6b7c8f] uppercase mb-2">利用状態</h2>
          {isAdmin ? (
            <>
              <p className="text-sm text-[#c8d4e0] mb-2">全県閲覧（管理者）</p>
              <SourcesHealthTable />
              <EmailDigestHealthTable />
            </>
          ) : (
            <p className="text-sm text-[#c8d4e0]">
              ステータス: {ent?.status ?? "inactive"}
              {ent?.trialEndAt && ` ・ トライアル終了: ${new Date(ent.trialEndAt).toLocaleDateString("ja-JP")}`}
            </p>
          )}
        </section>

        {!isAdmin && (
          <section className="rounded-lg border border-[#00d4aa]/30 bg-[#0d1220] p-4 mb-4">
            <h2 className="text-sm font-semibold text-[#c8d4e0] mb-3">請求</h2>
            <AppBillingActions canStartCheckout={canStartCheckout} canCancel={canCancel} />
          </section>
        )}

        <div className="flex items-center justify-between pt-4 text-sm">
          <Link href="/" className="text-[#6b7c8f] hover:text-[#00d4aa]">
            トップへ
          </Link>
          <form action={signOutAction} className="inline">
            <button type="submit" className="text-[#6b7c8f] hover:text-[#00d4aa]">
              ログアウト
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
