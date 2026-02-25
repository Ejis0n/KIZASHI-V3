import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * サブスクを即時キャンセル（cancel_at_period_end = false）。
 * Webhook で entitlement が canceled / accessPrefCodes = [] に更新される。
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const link = await prisma.stripeLink.findUnique({
    where: { userId: user.id },
    select: { subscriptionId: true },
  });

  if (!link?.subscriptionId) {
    return NextResponse.json(
      { error: "No active subscription to cancel" },
      { status: 404 }
    );
  }

  try {
    await stripe.subscriptions.cancel(link.subscriptionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Stripe cancel failed: ${message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
