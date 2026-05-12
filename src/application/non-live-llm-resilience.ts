import { Effect, Schedule } from "effect";

export type NonLiveLlmResiliencePolicy<Failure> = {
  attemptTimeoutMillis: number;
  retrySchedule: Schedule.Schedule<unknown, Failure>;
  isRetryable(failure: Failure): boolean;
  timeoutFailure(): Failure;
  attemptFailureAttributes(failure: Failure): Record<string, unknown>;
  finalFailureAttributes(failure: Failure): Record<string, unknown>;
};

export function withNonLiveLlmResilience<Success, Failure, Requirements>(
  effect: Effect.Effect<Success, Failure, Requirements>,
  policy: NonLiveLlmResiliencePolicy<Failure>
): Effect.Effect<Success, Failure, Requirements> {
  const attemptWithTimeout = effect.pipe(
    Effect.timeoutFail({
      duration: `${policy.attemptTimeoutMillis} millis`,
      onTimeout: policy.timeoutFailure
    }),
    Effect.tapError((failure) =>
      Effect.logDebug("non-live-llm.attempt_failed", {
        ...policy.attemptFailureAttributes(failure),
        retryable: policy.isRetryable(failure)
      })
    )
  );

  return Effect.retry(attemptWithTimeout, {
    schedule: policy.retrySchedule,
    while: policy.isRetryable
  }).pipe(
    Effect.tapError((failure) =>
      Effect.logWarning(
        "non-live-llm.request_failed",
        policy.finalFailureAttributes(failure)
      )
    )
  );
}
