import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登録・開始｜KIZASHI",
  description: "KIZASHIを15日間無料でお試しください。",
};

/** LP等からの「開始する」導線。ログイン画面へ（認証後は /app） */
export default function SignupPage() {
  redirect("/login?callbackUrl=/app");
}
