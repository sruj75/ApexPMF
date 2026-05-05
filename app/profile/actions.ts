"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseIdealCustomerProfileInput } from "@/src/domain/persona/ideal-customer-profile";
import { createSupabaseIdealCustomerProfileRepository } from "@/src/infrastructure/supabase/ideal-customer-profiles";
import { createSupabaseServerClient } from "@/src/infrastructure/supabase/server";

export async function createIdealCustomerProfileAction(formData: FormData) {
  const { learnerId, repository } = await getProfileSettingsContext();
  const parsed = parseIdealCustomerProfileInput(inputFromFormData(formData));

  if (!parsed.ok) {
    redirectWithError(parsed.errors);
  }

  await repository.create(learnerId, parsed.value);
  revalidatePath("/profile");
}

export async function updateIdealCustomerProfileAction(formData: FormData) {
  const profileId = stringFromFormData(formData, "profileId");
  const { learnerId, repository } = await getProfileSettingsContext();
  const parsed = parseIdealCustomerProfileInput(inputFromFormData(formData));

  if (!profileId) {
    redirectWithError(["Ideal Customer Profile not found."]);
  }

  if (!parsed.ok) {
    redirectWithError(parsed.errors);
  }

  await repository.update(learnerId, profileId, parsed.value);
  revalidatePath("/profile");
}

export async function selectActiveIdealCustomerProfileAction(formData: FormData) {
  const profileId = stringFromFormData(formData, "profileId");
  const { learnerId, repository } = await getProfileSettingsContext();

  if (!profileId) {
    redirectWithError(["Ideal Customer Profile not found."]);
  }

  await repository.selectActive(learnerId, profileId);
  revalidatePath("/profile");
}

export async function clearActiveIdealCustomerProfileAction(_formData: FormData) {
  void _formData;
  const { learnerId, repository } = await getProfileSettingsContext();
  await repository.clearActive(learnerId);
  revalidatePath("/profile");
}

async function getProfileSettingsContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return {
    learnerId: user.id,
    repository: createSupabaseIdealCustomerProfileRepository(supabase)
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

function redirectWithError(errors: string[]): never {
  const params = new URLSearchParams({
    error: errors.join(" ")
  });
  redirect(`/profile?${params.toString()}`);
}
