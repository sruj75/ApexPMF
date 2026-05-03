import type { StartedSession } from "@/src/domain/session/generated-session-case";

type SessionStartViewProps = {
  startedSession: StartedSession;
};

export function SessionStartView({ startedSession }: SessionStartViewProps) {
  return (
    <div className="dashboard-shell session-shell">
      <aside className="landing-sidebar dashboard-sidebar" aria-label="Practice">
        <a className="brand-link" href="/dashboard">
          The Mom Test Simulator
        </a>
        <div className="session-timer-panel" aria-label="Session status">
          <p className="dashboard-card-label">Session Timer</p>
          <p className="session-timer-value">00:00</p>
        </div>
        <button className="secondary-action" type="button">
          End Session
        </button>
      </aside>

      <main className="dashboard-main session-main">
        <section className="dashboard-hero" aria-labelledby="session-title">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Opening Context</p>
            <h1 id="session-title">Voice Conversation</h1>
            <p>{startedSession.openingContext}</p>
          </div>
        </section>

        <section className="session-context-strip" aria-label="Session context">
          <div>
            <p className="dashboard-card-label">Session source</p>
            <h2>{startedSession.sessionSourceLabel}</h2>
          </div>
          <div>
            <p className="dashboard-card-label">Customer</p>
            <h2>{startedSession.lightPersonaLabel}</h2>
          </div>
        </section>
      </main>
    </div>
  );
}
