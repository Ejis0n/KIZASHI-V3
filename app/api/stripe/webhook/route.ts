import { prisma } from "@/lib/prisma";
import { getAccessPrefCodesForTrial } from "@/lib/prefs";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

function parseSubscriptionStatus(sub: Stripe.Subscription): "trialing" | "active" | "canceled" | null {
  if (sub.status === "trialing") return "trialing";
  if (sub.status === "active") return "active";
  if (sub.status === "canceled" || sub.canceled_at) return "canceled";
  return null;
}

async function syncSubscriptionToDb(subscriptionId: string, userIdFromSession?: string | null) {
  if (!stripe) return;
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
  let userId = userIdFromSession ?? null;
  if (!userId) {
    const link = await prisma.stripeLink.findFirst({
      where: { subscriptionId },
      select: { userId: true },
    });
    userId = link?.userId ?? null;
  }
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const status = parseSubscriptionStatus(sub);
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  await prisma.stripeLink.upsert({
    where: { userId },
    create: {
      userId,
      customerId: sub.customer as string,
      subscriptionId: sub.id,
      priceId,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    },
    update: {
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd,
      priceId,
      updatedAt: new Date(),
    },
  });

  const ent = await prisma.entitlement.findUnique({
    where: { userId },
    select: { homePrefCode: true },
  });
  const homePrefCode = ent?.homePrefCode ?? null;

  if (status === "trialing" && homePrefCode) {
    const accessPrefCodes = getAccessPrefCodesForTrial(homePrefCode);
    await prisma.entitlement.update({
      where: { userId },
      data: {
        status: "trialing",
        trialEndAt: trialEnd,
        accessPrefCodes,
        updatedAt: new Date(),
      },
    });
  } else if (status === "active" && homePrefCode) {
    await prisma.entitlement.update({
      where: { userId },
      data: {
        status: "active",
        trialEndAt: trialEnd,
        accessPrefCodes: [homePrefCode],
        updatedAt: new Date(),
      },
    });
  } else if (status === "canceled" || !["trialing", "active"].includes(sub.status)) {
    await prisma.entitlement.update({
      where: { userId },
      data: {
        status: "canceled",
        accessPrefCodes: [],
        updatedAt: new Date(),
      },
    });
  }
}

export async function POST(request: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const eventId = event.id;
  const existing = await prisma.webhookEvent.findUnique({
    where: { eventId },
    select: { status: true },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  let status: "ok" | "error" = "ok";
  let errorMsg: string | null = null;

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = session.subscription as string | null;
      const userId = (session.client_reference_id as string) ?? null;
      if (subscriptionId && userId) {
        await prisma.stripeLink.upsert({
          where: { userId },
          create: {
            userId,
            customerId: (session.customer as string) ?? null,
            subscriptionId,
            subscriptionStatus: "trialing",
            updatedAt: new Date(),
          },
          update: {
            subscriptionId,
            customerId: (session.customer as string) ?? undefined,
            subscriptionStatus: "trialing",
            updatedAt: new Date(),
          },
        });
        await syncSubscriptionToDb(subscriptionId, userId);
      }
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const subscriptionId = sub.id;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      const userId = await findUserIdByCustomerOrSubscription(customerId ?? null, subscriptionId);
      if (userId) {
        await syncSubscriptionToDb(subscriptionId, userId);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const subscriptionId = sub.id;
      const link = await prisma.stripeLink.findFirst({
        where: { subscriptionId },
        select: { userId: true },
      });
      if (link) {
        await prisma.stripeLink.update({
          where: { userId: link.userId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionId: null,
            currentPeriodEnd: null,
            updatedAt: new Date(),
          },
        });
        await prisma.entitlement.update({
          where: { userId: link.userId },
          data: { status: "canceled", accessPrefCodes: [], updatedAt: new Date() },
        });
      }
    }
  } catch (err) {
    status = "error";
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  await prisma.webhookEvent.upsert({
    where: { eventId },
    create: {
      eventId,
      type: event.type,
      processedAt: new Date(),
      status,
      error: errorMsg,
    },
    update: {
      processedAt: new Date(),
      status,
      error: errorMsg,
    },
  });

  if (status === "error") {
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function findUserIdByCustomerOrSubscription(
  customerId: string | null,
  subscriptionId: string
): Promise<string | null> {
  const bySub = await prisma.stripeLink.findFirst({
    where: { subscriptionId },
    select: { userId: true },
  });
  if (bySub) return bySub.userId;
  if (customerId) {
    const byCustomer = await prisma.stripeLink.findFirst({
      where: { customerId },
      select: { userId: true },
    });
    if (byCustomer) return byCustomer.userId;
  }
  return null;
}
