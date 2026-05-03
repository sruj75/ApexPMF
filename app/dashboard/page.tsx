import Link from "next/link";
import { startPracticeAction } from "../practice/actions";
import { StartPracticeForm } from "../practice/start-practice-form";

export default function DashboardPage() {
  return (
    <div className="dashboard-shell">
      <aside className="landing-sidebar dashboard-sidebar" aria-label="Practice">
        <Link className="brand-link" href="/dashboard">
          The Mom Test Simulator
        </Link>
        <nav className="site-nav" aria-label="Dashboard navigation">
          <Link className="login-link" href="/dashboard">
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

        <section className="dashboard-command" aria-label="Practice status">
          <article className="dashboard-card dashboard-primary-card">
            <p className="dashboard-card-label">Next Session source</p>
            <h2>Broad Practice Pool</h2>
            <p>
              Until an Active Ideal Customer Profile exists, generated Customer
              Personas come from broad realistic customer contexts.
            </p>
          </article>

          <article className="dashboard-card" aria-labelledby="progression-title">
            <p className="dashboard-card-label">Skill growth</p>
            <h2 id="progression-title">Progression</h2>
            <p>
              Progression begins after completed Sessions produce saved Session
              Reports.
            </p>
          </article>

          <article className="dashboard-card" aria-labelledby="ranking-title">
            <p className="dashboard-card-label">Credibility gate</p>
            <h2 id="ranking-title">Global Ranking</h2>
            <p className="dashboard-status">Insufficient Data State</p>
            <p>
              Ranking appears only after there is enough credible user and
              population evidence.
            </p>
          </article>
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
