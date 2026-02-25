import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";
  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    env,
  });
}
