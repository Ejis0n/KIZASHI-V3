/**
 * 利用状況確認: 登録ユーザー数・有効ユーザー数・直近の登録・日次メール送信数
 * 実行: npm run check:usage
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const totalUsers = await prisma.user.count();
  const withEntitlement = await prisma.user.count({
    where: { entitlement: { isNot: null } },
  });
  const trialing = await prisma.user.count({
    where: { entitlement: { status: "trialing" } },
  });
  const active = await prisma.user.count({
    where: { entitlement: { status: "active" } },
  });
  const digestSent = await prisma.emailDigestLog.count({
    where: { status: "sent" },
  });

  console.log("=== KIZASHI 利用状況 ===\n");
  console.log("【ユーザー】");
  console.log(`  登録済みユーザー数: ${totalUsers}`);
  console.log(`  エンタイトルメント登録済み: ${withEntitlement}`);
  console.log(`  トライアル中 (trialing): ${trialing}`);
  console.log(`  有料契約中 (active): ${active}`);
  console.log("\n【日次メール】");
  console.log(`  送信成功数 (EmailDigestLog sent): ${digestSent}`);

  if (totalUsers > 0) {
    const recent = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        email: true,
        createdAt: true,
        entitlement: { select: { status: true, homePrefCode: true } },
      },
    });
    console.log("\n【直近登録ユーザー（最大10件）】");
    for (const u of recent) {
      const ent = u.entitlement
        ? `${u.entitlement.status} (${u.entitlement.homePrefCode ?? "-"})`
        : "-";
      console.log(`  ${u.email ?? "(no email)"} | ${u.createdAt.toISOString().slice(0, 10)} | ${ent}`);
    }
  }

  console.log("\n※ 問い合わせは DB に保存されていません。メール (CONTACT_EMAIL / kizashi-contact@officet2.jp) の受信箱を確認してください。");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
