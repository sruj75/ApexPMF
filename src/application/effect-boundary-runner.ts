import { Either, Effect } from "effect";

export async function runEffectEither<Success, Error>(
  effect: Effect.Effect<Success, Error, never>
): Promise<Either.Either<Success, Error>> {
  return Effect.runPromise(Effect.either(effect));
}

export async function runEffectOrThrow<Success, Error>(
  effect: Effect.Effect<Success, Error, never>
): Promise<Success> {
  const result = await runEffectEither(effect);
  if (Either.isLeft(result)) {
    throw result.left;
  }
  return result.right;
}

export async function runEffectOrMapError<Success, Error, MappedError>(
  effect: Effect.Effect<Success, Error, never>,
  mapError: (error: Error) => MappedError | undefined
): Promise<Success | MappedError> {
  const result = await runEffectEither(effect);
  if (Either.isRight(result)) {
    return result.right;
  }

  const mappedError = mapError(result.left);
  if (mappedError !== undefined) {
    return mappedError;
  }

  throw result.left;
}
