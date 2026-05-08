import { describe, expect, it } from "vitest";
import { startPracticeAction } from "../app/practice/actions";
import { endSessionAction } from "../app/practice/[sessionId]/actions";
import { clearActiveIdealCustomerProfileAction } from "../app/profile/actions";

describe("Server action signatures", () => {
  it("accepts FormData in startPracticeAction for form submissions", () => {
    expect(startPracticeAction.length).toBe(1);
  });

  it("accepts FormData in clearActiveIdealCustomerProfileAction for form submissions", () => {
    expect(clearActiveIdealCustomerProfileAction.length).toBe(1);
  });

  it("accepts FormData in endSessionAction for form submissions", () => {
    expect(endSessionAction.length).toBe(1);
  });
});
