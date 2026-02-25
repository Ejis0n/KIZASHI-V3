import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("STRIPE_SECRET_KEY is required in production");
}

export const stripe = secret ? new Stripe(secret, { apiVersion: "2025-02-24.acacia" }) : null;
