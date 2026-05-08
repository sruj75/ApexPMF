import Link from "next/link";

export default function SessionReportPlaceholderPage() {
  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="session-report-title">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Session Report</p>
            <h1 id="session-report-title">Session Report ready</h1>
            <p>
              Full report sections ship in issue #9. This placeholder confirms
              report routing after Report Generating State.
            </p>
          </div>
        </section>

        <section className="dashboard-card" aria-label="Session report navigation">
          <p className="dashboard-card-label">Navigation</p>
          <p>
            <Link href="/dashboard">Return to Practice Dashboard</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
