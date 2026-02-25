import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      entitlement: {
      select: {
        status: true,
        trialEndAt: true,
        homePrefCode: true,
        accessPrefCodes: true,
      },
    },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    email: user.email,
    role: user.role,
    entitlement: user.entitlement
      ? {
          status: user.entitlement.status,
          trialEndAt: user.entitlement.trialEndAt?.toISOString() ?? null,
          homePrefCode: user.entitlement.homePrefCode,
          accessPrefCodes: user.entitlement.accessPrefCodes,
        }
      : null,
  });
}
