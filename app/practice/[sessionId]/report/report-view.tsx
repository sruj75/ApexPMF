"use client";

import { useMemo, useState } from "react";
import type {
  SessionReport,
  SessionTranscriptTurn
} from "@/src/application/practice-route/practice-route-decision";

type SessionReportViewProps = {
  report: SessionReport;
  transcript: SessionTranscriptTurn[];
};

function formatTrapOutcomeLabel(outcome: SessionReport["trapResults"][number]["outcome"]) {
  if (outcome === "triggered") {
    return "Triggered";
  }

  if (outcome === "partial") {
    return "Partial";
  }

  return "Avoided";
}

export function SessionReportView({
  report,
  transcript
}: SessionReportViewProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const evidenceItems = useMemo(
    () => report.expandableEvidence,
    [report.expandableEvidence]
  );

  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <section className="dashboard-hero" aria-labelledby="session-report-title">
          <div className="dashboard-hero-copy">
            <p className="eyebrow">Session Report</p>
            <h1 id="session-report-title">Session Report</h1>
            <p>{report.outcome.summary}</p>
            <p>
              <strong>Source Context:</strong> {report.sourceContext}
            </p>
            <p>
              <strong>Persona Label:</strong> {report.lightPersonaLabel}
            </p>
          </div>
        </section>

        <section className="dashboard-card" aria-labelledby="outcome-title">
          <h2 id="outcome-title">Outcome</h2>
          <p>{report.outcome.summary}</p>
        </section>

        <section className="dashboard-card" aria-labelledby="missed-signals-title">
          <h2 id="missed-signals-title">Missed Signals</h2>
          {report.missedSignals.length === 0 ? (
            <p>No missed signals recorded.</p>
          ) : (
            <ul>
              {report.missedSignals.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}:</strong> {item.detail}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="bad-questions-title">
          <h2 id="bad-questions-title">Bad Questions</h2>
          {report.badQuestions.length === 0 ? (
            <p>No weak questions recorded.</p>
          ) : (
            <ul>
              {report.badQuestions.map((item) => (
                <li key={item.question}>
                  <strong>{item.question}</strong>
                  <p>{item.whyItMissed}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="strong-questions-title">
          <h2 id="strong-questions-title">Strong Questions</h2>
          {report.strongQuestions.length === 0 ? (
            <p>No strong questions recorded.</p>
          ) : (
            <ul>
              {report.strongQuestions.map((item) => (
                <li key={item.question}>
                  <strong>{item.question}</strong>
                  <p>{item.whyItWorked}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="trap-results-title">
          <h2 id="trap-results-title">Trap Results</h2>
          {report.trapResults.length === 0 ? (
            <p>No trap outcomes recorded.</p>
          ) : (
            <ul>
              {report.trapResults.map((item) => (
                <li key={item.trapLabel}>
                  <strong>{item.trapLabel}</strong>
                  <p>
                    {formatTrapOutcomeLabel(item.outcome)}: {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="skill-movement-title">
          <h2 id="skill-movement-title">Skill Movement</h2>
          {report.skillMovement.length === 0 ? (
            <p>No skill movement recorded.</p>
          ) : (
            <ul>
              {report.skillMovement.map((item) => (
                <li key={item.skill}>
                  <strong>{item.skill}</strong>
                  <p>
                    {item.movement}: {item.rationale}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="next-practice-focus-title">
          <h2 id="next-practice-focus-title">Next Practice Focus</h2>
          <p>
            <strong>{report.nextPracticeFocus.title}</strong>
          </p>
          <p>{report.nextPracticeFocus.description}</p>
        </section>

        <section className="dashboard-card" aria-labelledby="expandable-evidence-title">
          <h2 id="expandable-evidence-title">Expandable Evidence</h2>
          {evidenceItems.length === 0 ? (
            <p>No evidence snippets recorded.</p>
          ) : (
            <ul>
              {evidenceItems.map((item, index) => {
                const key = `${item.turnId ?? "turn"}-${item.sequence}-${index}`;
                const isOpen = expanded[key] ?? false;

                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => {
                        setExpanded((current) => ({
                          ...current,
                          [key]: !isOpen
                        }));
                      }}
                    >
                      Show Evidence: {item.title}
                    </button>
                    {isOpen ? (
                      <div>
                        <p>{item.detail}</p>
                        <p>
                          Turn {item.sequence}: {item.snippet ?? "No snippet available."}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="dashboard-card" aria-labelledby="session-transcript-title">
          <h2 id="session-transcript-title">Session Transcript</h2>
          {transcript.length === 0 ? (
            <p>No transcript turns available.</p>
          ) : (
            <ol>
              {transcript.map((turn) => (
                <li key={turn.turnId ?? `${turn.sequence}-${turn.speaker}`}>
                  <strong>
                    Turn {turn.sequence} ({turn.speaker})
                  </strong>
                  <p>{turn.text}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
