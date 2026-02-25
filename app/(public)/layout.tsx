import { Noto_Sans_JP } from "next/font/google";

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-noto",
  display: "swap",
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className={noto.className}>{children}</div>;
}
