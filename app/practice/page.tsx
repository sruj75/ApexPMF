import Link from "next/link";
import { startPracticeAction } from "./actions";
import { StartPracticeForm } from "./start-practice-form";

export const dynamic = "force-dynamic";

type PracticePageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params.error[0] : params?.error;
  const hasSessionCreationFailure = error === "session_creation_failed";

  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="practice-page-title">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Start Practice</p>
            <h1 id="practice-page-title">
              {hasSessionCreationFailure
                ? "Practice unavailable right now"
                : "Start Practice"}
            </h1>
            <p>
              {hasSessionCreationFailure
                ? "We could not start your Session. Please try again."
                : "Start a voice-first Session from this page or return to the Practice Dashboard."}
            </p>
          </div>

          <StartPracticeForm
            action={startPracticeAction}
            className="dashboard-start-action"
          />
        </section>

        <section className="dashboard-card" aria-label="Practice navigation">
          <p className="dashboard-card-label">Navigation</p>
          <p>
            <Link href="/dashboard">Return to Practice Dashboard</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
