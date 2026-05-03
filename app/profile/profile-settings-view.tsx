import type { IdealCustomerProfile } from "@/src/domain/persona/ideal-customer-profile";
import type { SessionSource } from "@/src/domain/persona/session-source";

type ProfileSettingsViewProps = {
  profiles: IdealCustomerProfile[];
  sessionSource: SessionSource;
  actions: ProfileSettingsActions;
  error?: string;
};

export type ProfileSettingsActions = {
  createIdealCustomerProfile: (formData: FormData) => void | Promise<void>;
  updateIdealCustomerProfile: (formData: FormData) => void | Promise<void>;
  selectActiveIdealCustomerProfile: (
    formData: FormData
  ) => void | Promise<void>;
  clearActiveIdealCustomerProfile: () => void | Promise<void>;
};

export function ProfileSettingsView({
  profiles,
  sessionSource,
  actions,
  error
}: ProfileSettingsViewProps) {
  return (
    <main className="dashboard-main profile-main">
      <section className="dashboard-hero" aria-labelledby="profile-title">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Account-level practice context</p>
          <h1 id="profile-title">Profile Settings</h1>
          <p>
            Manage Ideal Customer Profiles for future Sessions while keeping
            Start Practice free of per-session setup.
          </p>
        </div>
      </section>

      <section className="profile-source-strip" aria-label="Next Session source">
        <div>
          <p className="dashboard-card-label">Next Session source</p>
          <h2>{sourceTitle(sessionSource)}</h2>
          <p>{sourceDescription(sessionSource)}</p>
        </div>
        <form action={actions.clearActiveIdealCustomerProfile}>
          <button className="secondary-action" type="submit">
            Use Broad Practice Pool
          </button>
        </form>
      </section>

      {error ? (
        <p className="profile-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="profile-grid" aria-label="Ideal Customer Profiles">
        <article className="profile-panel" aria-labelledby="create-profile-title">
          <p className="dashboard-card-label">New practice context</p>
          <h2 id="create-profile-title">Create Ideal Customer Profile</h2>
          <ProfileForm
            action={actions.createIdealCustomerProfile}
            submitLabel="Create Ideal Customer Profile"
          />
        </article>

        <div className="profile-list">
          <div>
            <p className="dashboard-card-label">Saved contexts</p>
            <h2>Ideal Customer Profiles</h2>
          </div>

          {profiles.length === 0 ? (
            <article className="profile-panel">
              <p>No Ideal Customer Profiles yet.</p>
              <p>
                Future Sessions will use the Broad Practice Pool until one is
                active.
              </p>
            </article>
          ) : (
            profiles.map((profile) => (
              <article
                className="profile-panel profile-card"
                key={profile.id}
                aria-labelledby={`profile-${profile.id}-title`}
              >
                <div className="profile-card-header">
                  <div>
                    <p className="dashboard-card-label">
                      {profile.isActive
                        ? "Active Ideal Customer Profile"
                        : "Ideal Customer Profile"}
                    </p>
                    <h3 id={`profile-${profile.id}-title`}>{profile.name}</h3>
                  </div>
                  {profile.isActive ? (
                    <span className="profile-active-badge">Active</span>
                  ) : null}
                </div>

                <p>{profile.customerDescription}</p>
                {profile.notes ? <p>{profile.notes}</p> : null}

                <ProfileForm
                  action={actions.updateIdealCustomerProfile}
                  profile={profile}
                  submitLabel="Save Ideal Customer Profile"
                />

                {!profile.isActive ? (
                  <form action={actions.selectActiveIdealCustomerProfile}>
                    <input name="profileId" type="hidden" value={profile.id} />
                    <button className="secondary-action" type="submit">
                      Make Active
                    </button>
                  </form>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

type ProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  profile?: IdealCustomerProfile;
};

function ProfileForm({ action, submitLabel, profile }: ProfileFormProps) {
  return (
    <form action={action} className="profile-form">
      {profile ? <input name="profileId" type="hidden" value={profile.id} /> : null}
      <label>
        <span>Name</span>
        <input
          name="name"
          required
          defaultValue={profile?.name}
          placeholder="Finance operators"
        />
      </label>
      <label>
        <span>Customer description</span>
        <textarea
          name="customerDescription"
          required
          defaultValue={profile?.customerDescription}
          placeholder="Controllers at growing SaaS companies"
          rows={4}
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea
          name="notes"
          defaultValue={profile?.notes ?? ""}
          placeholder="Optional practice focus"
          rows={3}
        />
      </label>
      <button className="primary-action" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function sourceTitle(source: SessionSource) {
  if (source.kind === "active-ideal-customer-profile") {
    return source.idealCustomerProfile.name;
  }

  return source.label;
}

function sourceDescription(source: SessionSource) {
  if (source.kind === "active-ideal-customer-profile") {
    return source.idealCustomerProfile.customerDescription;
  }

  return "No Active Ideal Customer Profile is selected.";
}
