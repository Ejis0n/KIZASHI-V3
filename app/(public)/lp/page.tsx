import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import styles from "./lp.module.css";

export const metadata: Metadata = {
  title: "KIZASHI｜補助金解析による市町村優先度可視化サービス",
  description: "全国補助金を解析し、今日営業すべき市町村を可視化する。",
};

const SECTION_STYLE: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "clamp(48px, 10vw, 100px) clamp(24px, 5vw, 48px)",
  color: "#fff",
};

const SUBTEXT_STYLE: React.CSSProperties = { color: "#b8b8b8" };

export default async function LpPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/app" : "/signup";

  return (
    <main style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      {/* グローバルヘッダー：トップ・ログイン（スマホでも常に表示） */}
      <header className={styles.globalHeader}>
        <div className={styles.globalHeaderInner}>
          <Link href="/lp" className={styles.globalHeaderLogo}>
            KIZASHI
          </Link>
          <nav className={styles.globalHeaderNav}>
            <Link href="/lp" className={styles.globalHeaderLink}>トップ</Link>
            <Link href="/login" className={styles.globalHeaderLink}>ログイン</Link>
            {session?.user && (
              <Link href="/app" className={styles.globalHeaderLinkCta}>ダッシュボード</Link>
            )}
          </nav>
        </div>
      </header>

      {/* SECTION 01｜CONCEPT（Hero） */}
      <section
        className={styles.heroGrid}
        style={{
          ...SECTION_STYLE,
          paddingTop: "clamp(80px, 15vw, 160px)",
          paddingBottom: "clamp(80px, 15vw, 160px)",
        }}
      >
        <span className={styles.sectionLabel}>CONCEPT</span>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 700,
            lineHeight: 1.4,
            marginBottom: 20,
          }}
        >
          公的資金の動きは、需要の兆しである。
        </h1>
        <p
          className={styles.lead}
          style={{ ...SUBTEXT_STYLE, marginBottom: 48 }}
        >
          補助金の動きを解析し、
          <br />
          市町村単位で&quot;需要の兆し&quot;を可視化する。
        </p>
        <Link
          href={ctaHref}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          15日無料で開始する
        </Link>
        <p style={{ fontSize: "0.8rem", ...SUBTEXT_STYLE, marginTop: 48 }}>
          Beta　9,800円 / 月 / 県　解約即停止
        </p>
      </section>

      {/* SECTION 02｜WHAT IT DOES（図解：処理の流れ） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>WHAT IT DOES</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          補助金を見るのではない。構造を読む。
        </h2>
        <p className={`${styles.bodyText} ${styles.sectionLead}`} style={{ marginBottom: 8 }}>
          KIZASHIは、公開されている補助金情報を取得し、業種別に分類したうえで市町村ごとに集約します。締切の近さと需要の密度をスコア化し、今まさに動きが生まれている市町村を算出します。
        </p>
        <p style={{ ...SUBTEXT_STYLE, fontSize: "0.9rem", marginBottom: 4 }}>処理の流れ</p>
        <div className={styles.flowDiagram} role="img" aria-label="全国の補助金を取得から業種別に分類、市町村単位で集約、締切・需要を加点、最優先市町村を算出へ">
          <span className={styles.flowBox}>全国の補助金を取得</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowBox}>業種別に分類</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowBox}>市町村単位で集約</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowBox}>締切・需要を加点</span>
          <span className={styles.flowArrow} aria-hidden>→</span>
          <span className={styles.flowBox}>最優先市町村を算出</span>
        </div>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, lineHeight: 1.8 }}>
          結果として、「どこに、どのタイプの需要が、いつまでに集中しているか」が一覧で見えるようになります。
        </p>
      </section>

      {/* SECTION 03｜PRIORITY INDEX（カード図解） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>PRIORITY INDEX</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          今日、どこを優先すべきか（Priority Index）
        </h2>
        <p className={`${styles.bodyText} ${styles.sectionLead}`} style={{ marginBottom: 16 }}>
          県内の市町村ごとにスコアを算出し、本日いちばん「需要の動き」が活発な1市町村を表示します。スコアは次の3つを数値化したものです。
        </p>
        <ul className={styles.priorityGlossary} style={{ ...SUBTEXT_STYLE, fontSize: "0.95rem", marginBottom: 20, paddingLeft: "1.2em" }}>
          <li><strong style={{ color: "#e0e0e0" }}>募集中</strong> … その市町村で、<strong style={{ color: "#e0e0e0" }}>いま申請を受け付けている補助金</strong>の件数。件数が多いほど、今すぐ営業できる案件が多い。</li>
          <li><strong style={{ color: "#e0e0e0" }}>締切の近さ</strong> … 7日以内に締め切られる補助金の件数。締切が近いほど、顧客への訴求がしやすい。</li>
          <li><strong style={{ color: "#e0e0e0" }}>業種の偏り</strong> … 解体・空き家・残置物など、タイプが集中しているほどニーズが読みやすい。</li>
        </ul>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, marginBottom: 12, fontSize: "0.9rem" }}>
          例：東京都で本日いちばんスコアが高かった市町村
        </p>
        <div className={styles.priorityCard}>
          <div className={styles.priorityCardLocation}>東京都　足立区</div>
          <div className={`${styles.priorityCardScore} ${styles.neonScore}`} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Score 42
          </div>
          <div className={styles.priorityCardBreakdown}>
            ・募集中 4件（申請受付中の補助金が4件）
            <br />
            ・7日以内締切 2件
            <br />
            ・解体関連が集中
          </div>
        </div>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, fontSize: "0.95rem" }}>
          判断は感覚ではなく、データで行う。
        </p>
      </section>

      {/* SECTION 04｜HOW IT IS USED（ステップ図＋通知パターン例） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>HOW IT IS USED</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          使い方
        </h2>
        <p className={`${styles.bodyText} ${styles.sectionLead}`} style={{ marginBottom: 24 }}>
          登録後、ホーム県を1つ選ぶとその県を対象に毎日メールが届きます。メールには「本日最優先の1市町村」と県内TOP5・タイプ別TOP3・直近締切が含まれます。アプリで詳細を開けば、営業でそのまま使える短文テンプレをコピーできます。
        </p>
        <div className={styles.stepFlow}>
          <div className={styles.stepFlowItem}>
            <div className={styles.stepFlowNum}>1</div>
            <div className={styles.stepFlowText}>登録し、ホーム県を1つ選択する（変更不可）</div>
          </div>
          <div className={styles.stepFlowItem}>
            <div className={styles.stepFlowNum}>2</div>
            <div className={styles.stepFlowText}>毎朝、届くメールを開く</div>
          </div>
          <div className={styles.stepFlowItem}>
            <div className={styles.stepFlowNum}>3</div>
            <div className={styles.stepFlowText}>本日最優先の市町村とTOP5を確認する</div>
          </div>
          <div className={styles.stepFlowItem}>
            <div className={styles.stepFlowNum}>4</div>
            <div className={styles.stepFlowText}>アプリで該当市町村の詳細を開き、補助金一覧・締切・営業テンプレを確認</div>
          </div>
          <div className={styles.stepFlowItem}>
            <div className={styles.stepFlowNum}>5</div>
            <div className={styles.stepFlowText}>必要ならテンプレをコピーし、既存顧客または新規へアプローチ</div>
          </div>
        </div>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, marginBottom: 8 }}>
          営業の判断を構造化する。
        </p>

        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 48, marginBottom: 12 }}>
          実際の通知パターン（例）
        </h3>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, marginBottom: 16, fontSize: "0.95rem" }}>
          毎日1通、選択した県向けに送られるメールのイメージです。県や日によって最優先市町村・件数・タイプ別の並びは変わります。
        </p>
        <div className={styles.notifyPatterns}>
          <div className={styles.notifyCard}>
            <div className={styles.notifyCardLabel}>パターンA　東京都</div>
            <div className={styles.notifySubject}>KIZASHI｜本日の動き（東京都）</div>
            <div className={styles.notifyPriority}>
              <span className={styles.notifyPriorityMark} aria-hidden />
              本日最優先：足立区（締切2件、募集中4件）
            </div>
            <div className={styles.notifyBlockTitle}>■ 県内TOP5（全体）</div>
            <div className={styles.notifyRow}>足立区 募集中4 これから1 締切2025-03-15</div>
            <div className={styles.notifyRow}>江戸川区 募集中3 これから0 締切2025-03-22</div>
            <div className={styles.notifyRow}>葛飾区 募集中2 これから2 締切2025-04-01</div>
            <div className={styles.notifyBlockTitle}>■ タイプ別TOP3【解体】</div>
            <div className={styles.notifyRow}>足立区 締切2025-03-15</div>
            <div className={styles.notifyRow}>江戸川区 締切2025-03-22</div>
            <div className={styles.notifyBlockTitle}>■ 直近締切（今日〜7日）</div>
            <div className={styles.notifyRow}>老朽家屋除却補助 期限 2025-03-18</div>
            <div className={styles.notifyRow}>空き家解消支援 期限 2025-03-22</div>
          </div>

          <div className={styles.notifyCard}>
            <div className={styles.notifyCardLabel}>パターンB　神奈川県</div>
            <div className={styles.notifySubject}>KIZASHI｜本日の動き（神奈川県）</div>
            <div className={styles.notifyPriority}>
              <span className={styles.notifyPriorityMark} aria-hidden />
              本日最優先：横浜市（締切4件、募集中6件）
            </div>
            <div className={styles.notifyBlockTitle}>■ 県内TOP5（全体）</div>
            <div className={styles.notifyRow}>横浜市 募集中6 これから2 締切2025-03-10</div>
            <div className={styles.notifyRow}>川崎市 募集中3 これから1 締切2025-03-20</div>
            <div className={styles.notifyRow}>県全域 募集中2 これから3 締切2025-03-25</div>
            <div className={styles.notifyBlockTitle}>■ タイプ別TOP3【空き家】</div>
            <div className={styles.notifyRow}>横浜市 締切2025-03-10</div>
            <div className={styles.notifyRow}>藤沢市 締切2025-03-28</div>
            <div className={styles.notifyBlockTitle}>■ 直近締切（今日〜7日）</div>
            <div className={styles.notifyRow}>空き家除却助成 期限 2025-03-10</div>
            <div className={styles.notifyRow}>住宅改修補助 期限 2025-03-12</div>
            <div className={styles.notifyRow}>小規模改修支援 期限 2025-03-14</div>
            <div className={styles.notifyRow}>地域型補助 期限 2025-03-16</div>
          </div>

          <div className={styles.notifyCard}>
            <div className={styles.notifyCardLabel}>パターンC　埼玉県</div>
            <div className={styles.notifySubject}>KIZASHI｜本日の動き（埼玉県）</div>
            <div className={styles.notifyPriority}>
              <span className={styles.notifyPriorityMark} aria-hidden />
              本日最優先：県全域（締切1件、募集中3件）
            </div>
            <div className={styles.notifyBlockTitle}>■ 県内TOP5（全体）</div>
            <div className={styles.notifyRow}>県全域 募集中3 これから2 締切2025-03-08</div>
            <div className={styles.notifyRow}>さいたま市 募集中2 これから1 締切2025-03-30</div>
            <div className={styles.notifyRow}>川口市 募集中1 これから2 締切2025-04-05</div>
            <div className={styles.notifyBlockTitle}>■ タイプ別TOP3【残置物・片付け】</div>
            <div className={styles.notifyRow}>県全域 締切2025-03-08</div>
            <div className={styles.notifyRow}>さいたま市 締切2025-03-30</div>
            <div className={styles.notifyBlockTitle}>■ 直近締切（今日〜7日）</div>
            <div className={styles.notifyRow}>遺品整理等支援事業 期限 2025-03-08</div>
          </div>
        </div>
      </section>

      {/* SECTION 05｜WHY IT MATTERS（対比図） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>WHY IT MATTERS</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          情報はある。構造がない。
        </h2>
        <p className={`${styles.bodyText} ${styles.sectionLead}`} style={{ marginBottom: 8 }}>
          補助金情報は自治体のサイトなどで公開されています。しかし件数が多く、市町村や締切で整理されていないため、多くの業者は追いきれていません。
        </p>
        <div className={styles.contrastBlock}>
          <div className={styles.contrastRow}>
            <div className={styles.contrastRowLabel}>現状</div>
            <div className={styles.contrastRowText}>
              ・補助金を追えていない<br />
              ・市町村単位で整理していない<br />
              ・締切の圧力を計算していない
            </div>
          </div>
          <div className={styles.contrastRow} style={{ borderLeftColor: "#444" }}>
            <div className={styles.contrastRowLabel}>あるもの</div>
            <div className={styles.contrastRowText}>
              情報は公開されている。しかし優先順位は可視化されていない。
            </div>
          </div>
        </div>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, lineHeight: 1.8 }}>
          KIZASHIは、その「優先順位」を市町村×業種×締切で構造化し、一目でわかる形にします。
        </p>
      </section>

      {/* SECTION 06｜WHO IT IS FOR（タグ＋説明） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>WHO IT IS FOR</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          対象
        </h2>
        <p className={`${styles.bodyText} ${styles.sectionLead}`} style={{ marginBottom: 8 }}>
          補助金の動きと地域の需要の関係を、営業や提案の判断材料として使いたい事業者向けです。
        </p>
        <div className={styles.tagList}>
          <span className={styles.tag}>解体業</span>
          <span className={styles.tag}>空き家関連</span>
          <span className={styles.tag}>遺品整理</span>
          <span className={styles.tag}>不用品回収</span>
          <span className={styles.tag}>住宅改修</span>
        </div>

        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#c8c8c8", marginTop: 32, marginBottom: 12 }}>
          企業側の使い方（ユースケース例）
        </h3>
        <div className={styles.useCaseList}>
          <div className={styles.useCaseItem}>
            <div className={styles.useCaseRole}>遺品整理・不用品回収</div>
            <div className={styles.useCaseTitle}>遺品整理業</div>
            <p className={styles.useCaseDesc}>
              補助金が動いている市町村を毎朝把握し、残置物・片付け系の需要が集中しているエリアに営業を集中できます。メールの「本日最優先」とタイプ別TOP3で、どこに何のニーズがあるかが一目でわかります。
            </p>
          </div>
          <div className={styles.useCaseItem}>
            <div className={styles.useCaseRole}>空き家・不動産</div>
            <div className={styles.useCaseTitle}>不動産会社・空き家対策事業者</div>
            <p className={styles.useCaseDesc}>
              空き家除却・改修補助が活発な市町村を可視化できます。大家や売主への「このエリアでは補助金が動いている」という提案材料に使え、地域に応じた営業トークやチラシのエリア選定に役立ちます。
            </p>
          </div>
          <div className={styles.useCaseItem}>
            <div className={styles.useCaseRole}>地域マーケティング</div>
            <div className={styles.useCaseTitle}>広告会社・PR・地域担当</div>
            <p className={styles.useCaseDesc}>
              自治体の補助金施策がどこでどのタイプに集中しているかを市町村単位で把握できます。クライアントの地域広告や自治体向け提案、ターゲットエリアの選定の根拠として使えます。
            </p>
          </div>
          <div className={styles.useCaseItem}>
            <div className={styles.useCaseRole}>解体・改修工事</div>
            <div className={styles.useCaseTitle}>解体業・住宅改修業</div>
            <p className={styles.useCaseDesc}>
              解体・空き家・改修系の補助金が「いまどこで募集中か」「いつ締切か」を毎日確認できます。既存顧客への「〇〇市で補助金が動いています」の一声や、新規開拓エリアの優先順位づけに活用できます。
            </p>
          </div>
        </div>

        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, lineHeight: 1.8 }}>
          地域密着型事業者向けの需要解析エンジンです。
        </p>
      </section>

      {/* SECTION 07｜PRICING（無料・有料の差＋料金） */}
      <section style={SECTION_STYLE}>
        <span className={styles.sectionLabel}>PRICING</span>
        <h2
          style={{
            fontSize: "clamp(1.25rem, 3vw, 1.5rem)",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Beta Plan
        </h2>
        <p className={styles.bodyText} style={{ ...SUBTEXT_STYLE, marginBottom: 16 }}>
          15日無料トライアル後、9,800円/月/県。解約即停止。
        </p>

        <div className={styles.priceCompare}>
          <div className={styles.priceCompareCol}>
            <div className={styles.priceCompareLabel}>無料トライアル（15日間）</div>
            <ul className={styles.priceCompareList}>
              <li>ホーム県 ＋ 近隣4県まで閲覧</li>
              <li>毎朝の日次メール</li>
              <li>レーダー・優先度・補助金一覧</li>
            </ul>
          </div>
          <div className={styles.priceCompareCol}>
            <div className={styles.priceCompareLabel}>有料（9,800円/月/県）</div>
            <ul className={styles.priceCompareList}>
              <li>契約した1県のみ閲覧</li>
              <li>毎朝の日次メール</li>
              <li>レーダー・優先度・補助金一覧</li>
              <li>解約すると即時停止</li>
            </ul>
          </div>
        </div>

        <Link
          href={ctaHref}
          style={{
            display: "inline-block",
            padding: "14px 28px",
            background: "#fff",
            color: "#000",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: 4,
            marginTop: 8,
          }}
        >
          15日無料で開始する
        </Link>
      </section>

      {/* フッター：運営・お問い合わせ（目立たない表示） */}
      <footer className={styles.siteFooter}>
        <div className={styles.siteFooterInner}>
          <p className={styles.siteFooterItem}>
            {process.env.OPERATOR_NAME ?? "Office T2"}
            {" · "}
            <a
              href={`mailto:${process.env.CONTACT_EMAIL ?? "contact@kizashi.officet2.jp"}`}
              className={styles.siteFooterLink}
            >
              {process.env.CONTACT_EMAIL ?? "contact@kizashi.officet2.jp"}
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
