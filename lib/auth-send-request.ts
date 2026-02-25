/**
 * 開発時: メール送信せずコンソールにログインURLを出力。
 * 本番でメール送信する場合は EMAIL_SERVER を設定し、nodemailer を導入して
 * この関数内で createTransport(process.env.EMAIL_SERVER).sendMail(...) を呼ぶ。
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider?: { server?: string; from?: string };
  theme?: { brandColor?: string; buttonText?: string };
}) {
  const { identifier, url } = params;
  // トークンがDBに登録されてからURLを表示するよう短く待つ（レース条件を避ける）
  await new Promise((r) => setTimeout(r, 600));
  console.log("\n[KIZASHI] メールログイン用URL");
  console.log("  Email:", identifier);
  console.log("  以下の1行だけをコピーしてブラウザで開いてください:");
  console.log(url);
  console.log("  （有効期限: 24時間）\n");
}
