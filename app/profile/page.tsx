import Link from "next/link";
import { redirect } from "next/navigation";
import { resolveNextSessionSource } from "@/src/domain/persona/session-source";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";
import { startPracticeAction } from "../practice/actions";
import { StartPracticeForm } from "../practice/start-practice-form";
import {
  clearActiveIdealCustomerProfileAction,
  createIdealCustomerProfileAction,
  selectActiveIdealCustomerProfileAction,
  updateIdealCustomerProfileAction
} from "./actions";
import { ProfileSettingsView } from "./profile-settings-view";

type ProfilePageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repository = createSupabaseIdealCustomerProfileRepository(supabase);
  const [profiles, sessionSource, params] = await Promise.all([
    repository.listForLearner(user.id),
    resolveNextSessionSource(user.id, repository),
    searchParams
  ]);
  const error = Array.isArray(params?.error) ? params.error[0] : params?.error;

  return (
    <div className="dashboard-shell">
      <aside className="landing-sidebar dashboard-sidebar" aria-label="Practice">
        <Link className="brand-link" href="/dashboard">
          The Mom Test Simulator
        </Link>
        <nav className="site-nav" aria-label="Profile navigation">
          <Link href="/dashboard">Practice Dashboard</Link>
          <StartPracticeForm
            action={startPracticeAction}
            buttonClassName="nav-action"
          />
          <Link className="login-link" href="/profile">
            Profile Settings
          </Link>
        </nav>
        <p className="sidebar-note">
          Ideal Customer Profiles shape future Sessions only.
        </p>
      </aside>

      <ProfileSettingsView
        profiles={profiles}
        sessionSource={sessionSource}
        actions={{
          createIdealCustomerProfile: createIdealCustomerProfileAction,
          updateIdealCustomerProfile: updateIdealCustomerProfileAction,
          selectActiveIdealCustomerProfile: selectActiveIdealCustomerProfileAction,
          clearActiveIdealCustomerProfile: clearActiveIdealCustomerProfileAction
        }}
        error={error}
      />
    </div>
  );
}
