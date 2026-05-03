import { AuthEntry } from "../shared/auth-entry";

export default function LoginPage() {
  return (
    <AuthEntry
      eyebrow="Welcome back"
      title="Log in"
      description="Return to the authenticated practice loop without any lesson-style onboarding."
    />
  );
}
