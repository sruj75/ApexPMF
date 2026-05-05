import { ParseResult, Schema } from "effect";

export type IdealCustomerProfile = {
  id: string;
  learnerId: string;
  name: string;
  customerDescription: string;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type IdealCustomerProfileInput = {
  name: string;
  customerDescription: string;
  notes: string | null;
};

export type IdealCustomerProfileInputResult =
  | {
      ok: true;
      value: IdealCustomerProfileInput;
    }
  | {
      ok: false;
      errors: string[];
    };

const UserCreatedIdealCustomerProfileInput = Schema.Struct({
  name: Schema.String,
  customerDescription: Schema.String,
  notes: Schema.optional(Schema.NullOr(Schema.String))
});

export function parseIdealCustomerProfileInput(
  input: unknown
): IdealCustomerProfileInputResult {
  const decoded = Schema.decodeUnknownEither(
    UserCreatedIdealCustomerProfileInput
  )(input);

  if (decoded._tag === "Left") {
    return {
      ok: false,
      errors: [ParseResult.TreeFormatter.formatErrorSync(decoded.left)]
    };
  }

  const name = decoded.right.name.trim();
  const customerDescription = decoded.right.customerDescription.trim();
  const notes = decoded.right.notes?.trim() ?? "";
  const errors: string[] = [];

  if (name.length === 0) {
    errors.push("Name is required.");
  }

  if (customerDescription.length === 0) {
    errors.push("Customer description is required.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    value: {
      name,
      customerDescription,
      notes: notes.length > 0 ? notes : null
    }
  };
}
