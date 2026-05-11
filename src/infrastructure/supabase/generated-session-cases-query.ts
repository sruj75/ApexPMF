import { Effect } from "effect";
import {
  GeneratedSessionCaseRepositoryPersistenceError,
  type GeneratedSessionCaseRepositoryOperation
} from "@/src/domain/session/generated-session-case-repository";

export function querySupabase<T>(input: {
  operation: GeneratedSessionCaseRepositoryOperation;
  run: () => PromiseLike<{ data: T; error: { message: string } | null }>;
}): Effect.Effect<
  { data: T; error: { message: string } | null },
  GeneratedSessionCaseRepositoryPersistenceError,
  never
> {
  return Effect.tryPromise({
    try: input.run,
    catch: (cause) =>
      new GeneratedSessionCaseRepositoryPersistenceError({
        operation: input.operation,
        cause
      })
  }).pipe(
    Effect.flatMap((result) =>
      result.error
        ? Effect.fail(
            new GeneratedSessionCaseRepositoryPersistenceError({
              operation: input.operation,
              cause: new Error(result.error.message)
            })
          )
        : Effect.succeed(result)
    )
  );
}
