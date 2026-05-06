import { describe, expect, it } from "vitest";
import { startPracticeAction } from "../app/practice/actions";
import { clearActiveIdealCustomerProfileAction } from "../app/profile/actions";

describe("Server action signatures", () => {
  it("accepts FormData in startPracticeAction for form submissions", () => {
    expect(startPracticeAction.length).toBe(1);
  });

  it("accepts FormData in clearActiveIdealCustomerProfileAction for form submissions", () => {
    expect(clearActiveIdealCustomerProfileAction.length).toBe(1);
  });
});
