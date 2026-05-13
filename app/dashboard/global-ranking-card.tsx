import type { DashboardProgressionView } from "@/src/application/dashboard/progression-dashboard-presenter";

export function GlobalRankingCard({
  progression
}: {
  progression: DashboardProgressionView;
}) {
  const { globalRanking } = progression;

  return (
    <article className="dashboard-card" aria-labelledby="ranking-title">
      <div>
        <p className="dashboard-card-label">Credibility gate</p>
        <h2 id="ranking-title">Global Ranking</h2>
      </div>

      {globalRanking.kind === "insufficient-data" ? (
        <div>
          <p className="dashboard-status">Insufficient Data</p>
          <p>
            {globalRanking.completedSessions} of {globalRanking.requiredSessions}{" "}
            sessions needed for ranking.
          </p>
        </div>
      ) : (
        <div>
          <p className="dashboard-status">{globalRanking.label}</p>
          <p>
            Based on session quality and completed-session evidence.
          </p>
        </div>
      )}
    </article>
  );
}
