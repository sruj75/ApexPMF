# Run post-Session work directly in v1

Report generation and Progression updates will run in the direct post-Session app flow for v1 while the user sees Report Generating State. Effect timeouts, interruption, retries, and typed failures should control the workflow instead of introducing background queues, workers, or job orchestration early.

**Considered Options**

- Add background jobs and workers for report generation and progression from the start.
- Run post-Session work directly without any timeout or failure discipline.
- Keep the direct flow simple, controlled by Effect boundaries, and add queues only when direct generation proves too slow or unreliable.

**Consequences**

V1 avoids queue storage, worker deployment, retry job semantics, stuck job recovery, and extra observability surface area. A future queue decision should be based on measured latency or reliability pressure, not architecture habit.
