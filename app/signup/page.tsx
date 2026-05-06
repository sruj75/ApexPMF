import type { Metadata } from "next";
import { AuthEntry } from "../shared/auth-entry";

export const metadata: Metadata = {
  title: "Start for free - Sign up",
  description:
    "Begin with a Free Trial Session, then review your first Session Report."
};

export default function SignupPage() {
  return (
    <AuthEntry
      eyebrow="Free trial"
      title="Start for free"
      description="Begin with a Free Trial Session, then review your first Session Report."
    />
  );
}
