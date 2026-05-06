import {
  createBroadPracticePoolSessionSource,
  presentSessionSource,
  type SessionSource,
  type SessionSourcePresentation
} from "@/src/domain/persona/session-source";

export type PresentedSessionSource = SessionSourcePresentation;

export function presentSessionSourceForUi(
  sessionSource: SessionSource
): PresentedSessionSource {
  return presentSessionSource(sessionSource);
}

export function presentDefaultSessionSourceForDashboard(): PresentedSessionSource {
  return presentSessionSource(createBroadPracticePoolSessionSource());
}
