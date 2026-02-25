"use client";

import { useRouter } from "next/navigation";

type Props = {
  canStartCheckout: boolean;
  canCancel: boolean;
};

export function AppBillingActions({ canStartCheckout, canCancel }: Props) {
  const router = useRouter();

  async function handleStartCheckout() {
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    alert(data.error ?? "Checkout の作成に失敗しました");
  }

  async function handleCancel() {
    if (!confirm("解約すると即時でアクセスが停止します。よろしいですか？")) return;
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.refresh();
      return;
    }
    alert(data.error ?? "解約に失敗しました");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canStartCheckout && (
        <button
          type="button"
          onClick={handleStartCheckout}
          className="px-4 py-2.5 rounded-lg bg-[#00d4aa] text-[#0a0e17] font-semibold text-sm hover:opacity-90 transition-opacity min-h-[44px]"
        >
          無料15日で開始
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2.5 rounded-lg border border-[#3a4a5a] text-[#c8d4e0] text-sm hover:bg-[#1e2a3a] hover:border-[#4a5a6a] transition-colors min-h-[44px]"
        >
          解約（即停止）
        </button>
      )}
    </div>
  );
}
