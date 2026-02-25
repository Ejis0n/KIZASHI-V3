import { redirect } from "next/navigation";

/** LP等からの「開始する」導線。ログイン画面へ（認証後は /app） */
export default function SignupPage() {
  redirect("/login?callbackUrl=/app");
}
