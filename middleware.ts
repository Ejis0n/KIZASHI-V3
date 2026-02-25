import { NextResponse } from "next/server";

/**
 * 認証チェックは /app ページ（Node ランタイム）で行う。
 * middleware は Edge のため Prisma が使えず、auth() を使うと SessionTokenError になる。
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
