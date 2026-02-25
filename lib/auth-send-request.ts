import type { EmailProviderSendVerificationRequestParams } from "@auth/core/providers/email";
import nodemailer from "nodemailer";

/**
 * ログイン用URLの送信。
 * EMAIL_SERVER_HOST（または SMTP_HOST）と認証情報が設定されていればメール送信。
 * 未設定の場合はコンソールに出力（開発用）。
 */
export async function sendVerificationRequest(params: EmailProviderSendVerificationRequestParams) {
  const { identifier, url } = params;
  await new Promise((r) => setTimeout(r, 600));

  const host = process.env.EMAIL_SERVER_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SERVER_PORT || process.env.SMTP_PORT || "587", 10);
  const user = process.env.EMAIL_SERVER_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD || process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || process.env.MAIL_FROM || "KIZASHI <noreply@example.com>";

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: identifier,
      subject: "KIZASHI ログイン用リンク",
      text: `以下のリンクをクリックしてログインしてください。有効期限は24時間です。\n\n${url}\n`,
      html: `<p>以下のリンクをクリックしてログインしてください。有効期限は24時間です。</p><p><a href="${url}">ログインする</a></p><p>リンクが開けない場合は次のURLをブラウザにコピーしてください:<br><code>${url}</code></p>`,
    });
    return;
  }

  console.log("\n[KIZASHI] メールログイン用URL（メール未送信・開発用）");
  console.log("  Email:", identifier);
  console.log("  以下の1行だけをコピーしてブラウザで開いてください:");
  console.log(url);
  console.log("  （有効期限: 24時間）\n");
}
