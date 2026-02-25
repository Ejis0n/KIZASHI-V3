import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import type { Metadata } from "next";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "ログイン｜KIZASHI",
  description: "KIZASHIにログイン。メールアドレスでログイン用URLを受け取れます。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sent = params.sent === "1";
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
    <main className={styles.wrapper}>
      <div className={styles.inner}>
        <p className={styles.header}>
          <Link href="/" className={styles.headerLink}>← トップへ</Link>
        </p>
        <h1 className={styles.title}>ログイン</h1>
        {isVerificationError ? (
          <p className={`${styles.message} ${styles.messageError}`}>
            このリンクは既に使用済みか無効です。<br />
            下のフォームでメールアドレスを入力し、「ログイン用URLを送信」を押して、届いたメールの<strong>新しいリンク</strong>を<strong>1回だけ</strong>開いてください。
            {process.env.NODE_ENV !== "production" && (
              <> 開発時はターミナルに表示されたURLを開いてください。</>
            )}
          </p>
        ) : hasError ? (
          <p className={`${styles.message} ${styles.messageError}`}>
            ログインに失敗しました。もう一度「ログイン用URLを送信」からやり直してください。
          </p>
        ) : null}
        {process.env.NODE_ENV !== "production" ? (
          <p className={`${styles.message} ${styles.messageMuted}`}>
            <strong>開発時:</strong> メールは送信されません。<br />
            「ログイン用URLを送信」を押したあと、<strong>npm run dev を実行しているターミナル</strong>に表示される URL をブラウザで開いてください。
          </p>
        ) : (
          <p className={`${styles.message} ${styles.messageMuted}`}>
            メールアドレスにログイン用URLを送信します。届いたメールのリンクからログインしてください。
          </p>
        )}
        {sent && !isVerificationError ? (
          <p className={`${styles.message} ${styles.messageSuccess}`}>
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
            await signIn("email", {
              email,
              redirectTo: "/app",
              redirect: false,
            });
            redirect("/login?sent=1");
          }}
          className={styles.form}
        >
          <label className={styles.label}>
            Email
            <input
              type="email"
              name="email"
              required
              className={styles.input}
              placeholder="example@company.co.jp"
              autoComplete="email"
            />
          </label>
          <button type="submit" className={styles.submit}>ログイン用URLを送信</button>
        </form>
        <Link href="/" className={styles.backLink}>トップへ戻る</Link>
      </div>
    </main>
  );
}
