import type { DashboardProgressionView } from "@/src/application/dashboard/progression-dashboard-presenter";

export function ProgressionPathCard({
  progression
}: {
  progression: DashboardProgressionView;
}) {
  return (
    <article className="dashboard-card" aria-labelledby="progression-title">
      <div>
        <p className="dashboard-card-label">Skill growth</p>
        <h2 id="progression-title">Progression</h2>
      </div>

      <div className="achievement-path" role="list" aria-label="Achievement path">
        {progression.achievementPath.map((node) => (
          <div
            key={node.id}
            className={`achievement-node ${node.unlocked ? "achievement-node--unlocked" : "achievement-node--locked"}`}
            role="listitem"
            aria-label={`${node.label}: ${node.unlocked ? "unlocked" : "locked"}`}
          >
            <div className="achievement-node-dot" />
            <span className="achievement-node-label">{node.label}</span>
          </div>
        ))}
      </div>

      <p className="dashboard-progression-stats">
        {progression.completedSessionCount === 0
          ? "Complete a Session to begin your progression path."
          : `${progression.completedSessionCount} session${progression.completedSessionCount !== 1 ? "s" : ""} completed`}
      </p>
    </article>
  );
}
