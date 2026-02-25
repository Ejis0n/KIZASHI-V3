import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAllPrefs } from "@/lib/prefs";
import { ALLOW_DEMO_PREFS } from "@/lib/demo_prefs";
import type { Metadata } from "next";
import { AppDashboardContent } from "./AppDashboardContent";
import { SetHomePrefForm } from "./SetHomePrefForm";

export const metadata: Metadata = {
  title: "ダッシュボード｜KIZASHI",
  description: "KIZASHI 補助金レーダー・契約県の補助金一覧",
};

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/app");
  }

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      role: true,
      entitlement: true,
      stripeLink: { select: { subscriptionId: true, subscriptionStatus: true } },
    },
  });

  if (!user) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>ユーザー情報を取得できませんでした。一度ログアウトして、ターミナルに表示されたログインURLから再度ログインしてください。</p>
        <Link href="/login">ログインへ</Link>
      </main>
    );
  }

  const ent = user.entitlement;
  const homePrefCode = ent?.homePrefCode ?? null;
  const prefs = getAllPrefs();
  const homePrefName = homePrefCode ? prefs.find((p) => p.code === homePrefCode)?.name ?? homePrefCode : null;

  const hasActiveOrTrialing = Boolean(
    user.stripeLink?.subscriptionStatus &&
      ["active", "trialing"].includes(user.stripeLink.subscriptionStatus)
  );
  const canStartCheckout = Boolean(homePrefCode && !hasActiveOrTrialing);
  const canCancel = Boolean(hasActiveOrTrialing);
  const isAdmin = user.role === "admin";

  // 本番: 契約県（home + accessPrefCodes）のみ。デモ: ALLOW_DEMO_PREFS=true のとき全47県を選択可能
  const prefOptionsForDashboard =
    isAdmin
      ? prefs.map((p) => ({ code: p.code, name: p.name }))
      : (ent?.accessPrefCodes?.length
          ? ent.accessPrefCodes.map((c: string) => ({ code: c, name: prefs.find((p) => p.code === c)?.name ?? c }))
          : ALLOW_DEMO_PREFS
            ? prefs.map((p) => ({ code: p.code, name: p.name }))
            : homePrefCode ? [{ code: homePrefCode, name: homePrefName ?? homePrefCode }] : []);

  if (!homePrefCode) {
    return (
      <main className="min-h-screen bg-[#0a0e17] text-[#c8d4e0] p-4">
        <div className="max-w-md mx-auto py-8">
          <h1 className="text-lg font-semibold mb-2">ホーム県を選択</h1>
          <p className="text-sm text-[#6b7c8f] mb-6">一度だけ設定できます。保存後に変更はできません。</p>
          <SetHomePrefForm prefs={prefs.map((p) => ({ code: p.code, name: p.name }))} />
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }} className="mt-8">
            <button type="submit" className="text-sm text-[#6b7c8f] hover:text-[#00d4aa]">ログアウト</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0e17]">
      {params.checkout === "success" && (
        <div className="sticky top-0 z-10 bg-[#00d4aa]/20 border-b border-[#00d4aa]/40 px-4 py-2 text-center text-sm text-[#00d4aa]">
          チェックアウトが完了しました。しばらくすると反映されます。
        </div>
      )}
      {params.checkout === "cancel" && (
        <div className="sticky top-0 z-10 bg-[#6b7c8f]/20 px-4 py-2 text-center text-sm text-[#6b7c8f]">
          チェックアウトをキャンセルしました。
        </div>
      )}

      <AppDashboardContent
        homePrefCode={homePrefCode}
        homePrefName={homePrefName ?? homePrefCode}
        prefOptions={prefOptionsForDashboard}
        isAdmin={isAdmin}
        ent={ent ? { status: ent.status, trialEndAt: ent.trialEndAt?.toISOString() ?? null } : null}
        canStartCheckout={canStartCheckout}
        canCancel={canCancel}
        signOutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      />
    </main>
  );
}
