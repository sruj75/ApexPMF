import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfilePageData } from "@/src/application/start-session/practice-entry-web-adapter";
import { startPracticeAction } from "../practice/actions";
import { StartPracticeForm } from "../practice/start-practice-form";
import {
  clearActiveIdealCustomerProfileAction,
  createIdealCustomerProfileAction,
  selectActiveIdealCustomerProfileAction,
  updateIdealCustomerProfileAction
} from "./actions";
import { ProfileSettingsView } from "./profile-settings-view";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [pageData, params] = await Promise.all([
    getProfilePageData(),
    searchParams
  ]);

  if (!pageData.ok) {
    redirect("/login");
  }

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
          <Link className="nav-link nav-link--active" href="/profile" aria-current="page">
            Profile Settings
          </Link>
        </nav>
        <p className="sidebar-note">
          Ideal Customer Profiles shape future Sessions only.
        </p>
      </aside>

      <ProfileSettingsView
        profiles={pageData.profiles}
        presentedSessionSource={pageData.presentedSessionSource}
        canClearActiveSource={pageData.canClearActiveSource}
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
