import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>KIZASHI</h1>
      <p>
        <Link href="/lp">サービスについて</Link> | <Link href="/login">ログイン</Link> | <Link href="/app">ダッシュボード</Link>
      </p>
    </main>
  );
}
