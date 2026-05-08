import Link from "next/link";
import type { StartedSession } from "@/src/domain/session/generated-session-case";
import { endSessionAction } from "./actions";

type SessionStartViewProps = {
  startedSession: StartedSession;
};

export function SessionStartView({ startedSession }: SessionStartViewProps) {
  return (
    <div className="dashboard-shell session-shell">
      <aside className="landing-sidebar dashboard-sidebar" aria-label="Practice">
        <Link className="brand-link" href="/dashboard">
          The Mom Test Simulator
        </Link>
        <div className="session-timer-panel" aria-label="Session status">
          <p className="dashboard-card-label">Session Timer</p>
          <p className="session-timer-value">00:00</p>
        </div>
        <form action={endSessionAction}>
          <input type="hidden" name="sessionId" value={startedSession.sessionId} />
          <button className="secondary-action" type="submit">
            End Session
          </button>
        </form>
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
          <div className="session-context-card">
            <p className="dashboard-card-label">Session source</p>
            <h2>{startedSession.sessionSourceLabel}</h2>
          </div>
          <div className="session-context-card">
            <p className="dashboard-card-label">Customer</p>
            <h2>{startedSession.lightPersonaLabel}</h2>
          </div>
        </section>
      </main>
    </div>
  );
}
