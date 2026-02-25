import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
  // 認証後に /login に戻らないよう、callbackUrl が /login のときは /app にする
  let callbackUrl = params.callbackUrl ?? "/app";
  try {
    const path = new URL(callbackUrl, "http://localhost").pathname;
    if (path === "/login") callbackUrl = "/app";
  } catch {
    /* そのまま */
  }
  const isVerificationError =
    params.error === "Verification" || params.error?.startsWith("Verification/");
  const hasError = !!params.error;

  return (
    <main style={{ padding: "2rem", maxWidth: 400, margin: "0 auto" }}>
      <h1>ログイン</h1>
      {isVerificationError ? (
        <p style={{ color: "#c00", marginBottom: "1rem", fontSize: "0.95rem" }}>
          このリンクは既に使用済みか無効です。<br />
          下のフォームでメールアドレスを入力し、「ログイン用URLを送信」を押して、届いたメールの<strong>新しいリンク</strong>を<strong>1回だけ</strong>開いてください。
          {process.env.NODE_ENV !== "production" && (
            <> 開発時はターミナルに表示されたURLを開いてください。</>
          )}
        </p>
      ) : hasError ? (
        <p style={{ color: "#c00", marginBottom: "1rem", fontSize: "0.95rem" }}>
          ログインに失敗しました。もう一度「ログイン用URLを送信」からやり直してください。
        </p>
      ) : null}
      {process.env.NODE_ENV !== "production" ? (
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
          <strong>開発時:</strong> メールは送信されません。<br />
          「ログイン用URLを送信」を押したあと、<strong>npm run dev を実行しているターミナル</strong>に表示される URL をブラウザで開いてください。
        </p>
      ) : (
        <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
          メールアドレスにログイン用URLを送信します。届いたメールのリンクからログインしてください。
        </p>
      )}
      {sent && !isVerificationError ? (
        <p style={{ color: "green", marginBottom: "1rem" }}>
          ログイン用のURLをメールで送信しました。届いたリンクをクリックしてください。
          {process.env.NODE_ENV !== "production" && (
            <>
              <br />
              （開発時はターミナルに表示されたURLをブラウザで開いてください）
            </>
          )}
        </p>
      ) : null}
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = (formData.get("email") as string)?.trim();
          if (!email) return;
          // メールログイン後は必ず /app へ（NextAuth は redirectTo を callbackUrl に使う）
          await signIn("email", {
            email,
            redirectTo: "/app",
            redirect: false,
          });
          redirect("/login?sent=1");
        }}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <label>
          Email
          <input
            type="email"
            name="email"
            required
            style={{ display: "block", width: "100%", padding: "0.5rem" }}
          />
        </label>
        <button type="submit">ログイン用URLを送信</button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/">トップへ</Link>
      </p>
    </main>
  );
}
