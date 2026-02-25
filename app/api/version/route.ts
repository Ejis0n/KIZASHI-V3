import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Vercel では VERCEL_GIT_COMMIT_SHA が入る。ローカルでは未定義のことが多い
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? null;
  const buildId = process.env.VERCEL_URL ?? null;
  return NextResponse.json({
    version: sha ?? "local",
    buildId: buildId ?? "local",
  });
}
