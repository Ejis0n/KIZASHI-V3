import { redirect } from "next/navigation";

/** /lp はトップ（/）へ。URLに lp を出さない */
export default function LpPage() {
  redirect("/");
}
