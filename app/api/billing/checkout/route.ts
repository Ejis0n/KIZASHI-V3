import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stripe Checkout Session 作成（trial 15日）。
 * homePrefCode 未設定は 400、既に subscription ありは 409。
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3002";
  const priceId = process.env.STRIPE_PRICE_ID_BETA;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRICE_ID_BETA not set" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [entitlement, link] = await Promise.all([
    prisma.entitlement.findUnique({
      where: { userId: user.id },
      select: { homePrefCode: true },
    }),
    prisma.stripeLink.findUnique({
      where: { userId: user.id },
      select: { subscriptionId: true, subscriptionStatus: true },
    }),
  ]);

  if (!entitlement?.homePrefCode) {
    return NextResponse.json(
      { error: "homePrefCode must be set before checkout" },
      { status: 400 }
    );
  }

  const hasActiveSubscription =
    link?.subscriptionId &&
    link?.subscriptionStatus &&
    !["canceled", "incomplete_expired", "unpaid"].includes(link.subscriptionStatus);
  if (hasActiveSubscription) {
    return NextResponse.json(
      { error: "Already have an active subscription" },
      { status: 409 }
    );
  }

  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 15 },
    success_url: `${appUrl}/app?checkout=success`,
    cancel_url: `${appUrl}/app?checkout=cancel`,
    client_reference_id: user.id,
    customer_email: session.user.email,
  });

  return NextResponse.json({ url: stripeSession.url });
}
