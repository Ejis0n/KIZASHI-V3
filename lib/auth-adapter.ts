import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const base = PrismaAdapter(prisma);

/** トークン作成後に待機（Neon の反映待ち） */
const AFTER_CREATE_DELAY_MS = 2000;
/** 照合リトライ: 待機時間の配列（ミリ秒） */
const LOOKUP_RETRY_DELAYS_MS = [1500, 2500, 2500];

/**
 * PrismaAdapter をラップ。
 * - createVerificationToken: 作成後に少し待ってから返す（Neon 反映待ち）
 * - useVerificationToken: findFirst → 見つかれば deleteMany で返す。未検出時はリトライ。
 */
export const authAdapter = {
  ...base,
  async createVerificationToken(data: { identifier: string; token: string; expires: Date }) {
    const created = await base.createVerificationToken!(data);
    await new Promise((r) => setTimeout(r, AFTER_CREATE_DELAY_MS));
    return created;
  },
  async useVerificationToken(identifier_token: { identifier: string; token: string }) {
    const norm = (s: string) => s?.trim().toLowerCase() ?? "";
    // URLをコピー時に「有効期限: 24時間」が含まれた場合に備え、先頭のメール部分だけ使う
    let raw = norm(identifier_token.identifier);
    if (raw.includes(" ")) raw = raw.split(/\s/)[0] ?? raw;
    const identifier = raw;
    const token = identifier_token.token;

    console.log("[KIZASHI] useVerificationToken: 照合開始 identifier=", identifier);

    const find = async () =>
      prisma.verificationToken.findFirst({
        where: { identifier, token },
      });

    let row = await find();
    console.log("[KIZASHI] useVerificationToken: 1回目", row ? "見つかった" : "見つからず");
    for (let i = 0; i < LOOKUP_RETRY_DELAYS_MS.length; i++) {
      if (row) break;
      await new Promise((r) => setTimeout(r, LOOKUP_RETRY_DELAYS_MS[i]));
      row = await find();
      console.log("[KIZASHI] useVerificationToken: リトライ" + (i + 1), row ? "見つかった" : "見つからず");
    }
    if (!row) {
      const count = await prisma.verificationToken.count({ where: { identifier } });
      console.log("[KIZASHI] useVerificationToken: 照合失敗（トークン未検出）。この identifier のトークン件数:", count);
      return null;
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: row.identifier, token: row.token },
    });

    return {
      identifier: row.identifier,
      token: row.token,
      expires: row.expires,
    };
  },
};
