"use server";

import { redirect } from "next/navigation";
import { recordUserQuitIntent } from "@/src/application/end-session/user-quit-intent";

export async function endSessionAction(formData: FormData) {
  const sessionId = stringFromFormData(formData, "sessionId");
  if (!sessionId) {
    throw new Error("Missing sessionId for endSessionAction.");
  }

  recordUserQuitIntent({
    sessionId
  });

  redirect("/dashboard");
}

function stringFromFormData(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
