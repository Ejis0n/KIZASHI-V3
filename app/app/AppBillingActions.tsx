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
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {canStartCheckout && (
        <button type="button" onClick={handleStartCheckout}>
          無料15日で開始
        </button>
      )}
      {canCancel && (
        <button type="button" onClick={handleCancel} style={{ marginLeft: "0.5rem" }}>
          解約（即停止）
        </button>
      )}
    </div>
  );
}
