import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.APP_URL ?? "https://kizashi.officet2.jp";
const title = "KIZASHI｜補助金解析による市町村優先度可視化サービス";
const description = "全国補助金を解析し、今日営業すべき市町村を可視化する。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s｜KIZASHI" },
  description,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "KIZASHI",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
