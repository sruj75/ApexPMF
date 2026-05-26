import Link from "next/link";
import { redirect } from "next/navigation";
import { presentDefaultSessionSourceForDashboard } from "@/src/application/start-session/session-source-presentation";
import { getDashboardPageData } from "@/src/application/start-session/practice-entry-web-adapter";
import { PRODUCT_DISPLAY_NAME } from "@/src/product/brand";
import { startPracticeAction } from "../practice/actions";
import { StartPracticeForm } from "../practice/start-practice-form";
import { ProgressionPathCard } from "./progression-path-card";
import { GlobalRankingCard } from "./global-ranking-card";

export const dynamic = "force-dynamic";

const nextSessionSource = presentDefaultSessionSourceForDashboard();

export default async function DashboardPage() {
  const pageData = await getDashboardPageData();

  if (!pageData.ok) {
    redirect("/login");
  }

  return (
    <div className="dashboard-shell">
      <aside className="landing-sidebar dashboard-sidebar" aria-label="Practice">
        <Link className="brand-link" href="/dashboard">
          {PRODUCT_DISPLAY_NAME}
        </Link>
        <nav className="site-nav" aria-label="Dashboard navigation">
          <Link className="nav-link nav-link--active" href="/dashboard" aria-current="page">
            Practice Dashboard
          </Link>
          <StartPracticeForm
            action={startPracticeAction}
            buttonClassName="nav-action"
          />
          <Link href="/profile">Profile Settings</Link>
          <a href="#reports">Session Reports</a>
        </nav>
        <p className="sidebar-note">
          Voice-first practice for one Learner. Reports and transcripts stay
          private by default.
        </p>
      </aside>

      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Authenticated practice loop</p>
            <h1 id="dashboard-title">Practice Dashboard</h1>
            <p>
              Start a voice-first Session, then return for Progression, Global
              Ranking status, and recent Session Reports.
            </p>
          </div>
          <StartPracticeForm
            action={startPracticeAction}
            className="dashboard-start-action"
          />
        </section>

        <section className="practice-dashboard-status" aria-label="Practice status">
          <article className="dashboard-card dashboard-primary-card">
            <p className="dashboard-card-label">Next Session source</p>
            <h2>{nextSessionSource.title}</h2>
            <p>
              Until an Active Ideal Customer Profile exists, generated Customer
              Personas come from broad realistic customer contexts.
            </p>
          </article>

          <ProgressionPathCard progression={pageData.progression} />

          <GlobalRankingCard progression={pageData.progression} />
        </section>

        <section
          id="reports"
          className="dashboard-report-section"
          aria-labelledby="reports-title"
        >
          <div>
            <p className="dashboard-card-label">Feedback history</p>
            <h2 id="reports-title">Recent Session Reports</h2>
          </div>
          <div className="dashboard-card reports-panel">
            <p>No Session Reports yet.</p>
            <p>
              Complete a Session to see private post-session feedback here.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
