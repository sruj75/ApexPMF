import { ParseResult } from "effect";

export class SupabaseRowDecodeError extends Error {
  readonly name = "SupabaseRowDecodeError";
  readonly adapter: string;
  readonly operation: string;
  readonly rowIndex?: number;
  readonly details: string[];

  constructor(input: {
    adapter: string;
    operation: string;
    rowIndex?: number;
    details: string[];
  }) {
    super(formatSupabaseRowDecodeErrorMessage(input));
    this.adapter = input.adapter;
    this.operation = input.operation;
    this.rowIndex = input.rowIndex;
    this.details = input.details;
  }
}

export function formatParseErrorDetails(error: ParseResult.ParseError): string[] {
  return [ParseResult.TreeFormatter.formatErrorSync(error)];
}

function formatSupabaseRowDecodeErrorMessage(input: {
  adapter: string;
  operation: string;
  rowIndex?: number;
  details: string[];
}): string {
  const rowIndexPart =
    typeof input.rowIndex === "number" ? ` rowIndex=${input.rowIndex}` : "";

  return `Supabase row decode failed: adapter=${input.adapter} operation=${input.operation}${rowIndexPart} details=${input.details.join(" | ")}`;
}
