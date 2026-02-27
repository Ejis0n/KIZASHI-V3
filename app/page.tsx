import { auth } from "@/auth";
import type { Metadata } from "next";
import { LpContent } from "@/app/(public)/lp/LpContent";

const title = "KIZASHI｜補助金解析による市町村優先度可視化サービス";
const description = "全国補助金を解析し、今日営業すべき市町村を可視化する。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
  },
  twitter: {
    title,
    description,
  },
};

export default async function Home() {
  const session = await auth();
  return <LpContent session={session} topUrl="/" />;
}
