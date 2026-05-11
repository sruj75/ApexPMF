"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createEntryFailure,
  mapProfileFailureToRedirectPath
} from "@/src/application/start-session/entry-failure";
import {
  getLearnerEntryContext,
  parseProfileInput,
  createIdealCustomerProfileForLearner,
  updateIdealCustomerProfileForLearner,
  selectActiveIdealCustomerProfileForLearner,
  clearActiveIdealCustomerProfileForLearner
} from "@/src/application/start-session/practice-entry-web-adapter";

export async function createIdealCustomerProfileAction(formData: FormData) {
  const { learnerId, repository } = await getProfileSettingsContext();
  const parsed = parseProfileInput(inputFromFormData(formData));

  if (!parsed.ok) {
    redirectWithEntryFailure(
      createEntryFailure({
        category: "input_invalid",
        details: parsed.errors
      })
    );
  }

  await createIdealCustomerProfileForLearner(learnerId, repository, parsed.value);
  revalidatePath("/profile");
}

export async function updateIdealCustomerProfileAction(formData: FormData) {
  const profileId = stringFromFormData(formData, "profileId");
  const { learnerId, repository } = await getProfileSettingsContext();
  const parsed = parseProfileInput(inputFromFormData(formData));

  if (!profileId) {
    redirectWithEntryFailure(
      createEntryFailure({
        category: "input_invalid",
        details: ["Ideal Customer Profile not found."]
      })
    );
  }

  if (!parsed.ok) {
    redirectWithEntryFailure(
      createEntryFailure({
        category: "input_invalid",
        details: parsed.errors
      })
    );
  }

  await updateIdealCustomerProfileForLearner(learnerId, repository, profileId, parsed.value);
  revalidatePath("/profile");
}

export async function selectActiveIdealCustomerProfileAction(formData: FormData) {
  const profileId = stringFromFormData(formData, "profileId");
  const { learnerId, repository } = await getProfileSettingsContext();

  if (!profileId) {
    redirectWithEntryFailure(
      createEntryFailure({
        category: "input_invalid",
        details: ["Ideal Customer Profile not found."]
      })
    );
  }

  await selectActiveIdealCustomerProfileForLearner(learnerId, repository, profileId);
  revalidatePath("/profile");
}

export async function clearActiveIdealCustomerProfileAction(_formData: FormData) {
  void _formData;
  const { learnerId, repository } = await getProfileSettingsContext();
  await clearActiveIdealCustomerProfileForLearner(learnerId, repository);
  revalidatePath("/profile");
}

async function getProfileSettingsContext() {
  const context = await getLearnerEntryContext();
  if (!context.ok) {
    redirectWithEntryFailure(
      createEntryFailure({
        category: "auth_missing"
      })
    );
  }

  return {
    learnerId: context.learnerId,
    repository: context.idealCustomerProfileRepository
  };
}

function inputFromFormData(formData: FormData) {
  return {
    name: stringFromFormData(formData, "name"),
    customerDescription: stringFromFormData(formData, "customerDescription"),
    notes: stringFromFormData(formData, "notes")
  };
}

function stringFromFormData(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithEntryFailure(failure: ReturnType<typeof createEntryFailure>): never {
  redirect(mapProfileFailureToRedirectPath(failure));
}
