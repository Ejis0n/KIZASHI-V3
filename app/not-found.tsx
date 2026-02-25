import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: 700, marginBottom: "0.5rem" }}>
        ページが見つかりません
      </h1>
      <p style={{ color: "#b8b8b8", marginBottom: "1.5rem" }}>
        お探しのURLは存在しないか、移動した可能性があります。
      </p>
      <Link
        href="/"
        style={{
          display: "inline-block",
          padding: "14px 28px",
          background: "#fff",
          color: "#000",
          fontWeight: 600,
          textDecoration: "none",
          borderRadius: 8,
        }}
      >
        トップへ戻る
      </Link>
    </main>
  );
}
