import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileSettingsView } from "../app/profile/profile-settings-view";
import { makeIdealCustomerProfile } from "./ideal-customer-profile.test";

const actions = {
  createIdealCustomerProfile() {},
  updateIdealCustomerProfile() {},
  selectActiveIdealCustomerProfile() {},
  clearActiveIdealCustomerProfile() {}
};

describe("Profile Settings", () => {
  it("renders the Broad Practice Pool state and create form when no Ideal Customer Profile exists", () => {
    render(
      <ProfileSettingsView
        profiles={[]}
        sessionSource={{
          kind: "broad-practice-pool",
          label: "Broad Practice Pool"
        }}
        actions={actions}
      />
    );

    expect(
      screen.getByRole("heading", { name: /profile settings/i })
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /broad practice pool/i })
    ).toBeVisible();
    expect(screen.getByText(/no ideal customer profiles yet/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /create ideal customer profile/i })
    ).toBeVisible();
    expect(screen.queryByText(/startup idea/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/segmentation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/fixed persona/i)).not.toBeInTheDocument();
  });

  it("renders saved Ideal Customer Profiles with one active profile and switching controls", () => {
    render(
      <ProfileSettingsView
        profiles={[
          makeIdealCustomerProfile({
            id: "profile-1",
            name: "Finance operators",
            isActive: true
          }),
          makeIdealCustomerProfile({
            id: "profile-2",
            name: "Clinical operators",
            customerDescription: "Practice managers in small clinics",
            notes: "Probe scheduling workarounds.",
            isActive: false
          })
        ]}
        sessionSource={{
          kind: "active-ideal-customer-profile",
          idealCustomerProfile: {
            id: "profile-1",
            name: "Finance operators",
            customerDescription: "Controllers at growing SaaS companies",
            notes: null
          }
        }}
        actions={actions}
      />
    );

    const financeProfile = screen.getByRole("article", {
      name: /finance operators/i
    });
    const clinicalProfile = screen.getByRole("article", {
      name: /clinical operators/i
    });

    expect(within(financeProfile).getByText(/^active$/i)).toBeVisible();
    expect(
      within(clinicalProfile).getByRole("button", { name: /make active/i })
    ).toBeVisible();
    expect(
      screen.getAllByRole("button", {
        name: /save ideal customer profile/i
      })
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /use broad practice pool/i })
    ).toBeVisible();
  });
});
