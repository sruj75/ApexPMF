/**
 * Product identity: human-facing vs machine-facing strings must stay split.
 *
 * - Use {@link PRODUCT_DISPLAY_NAME} only in React-rendered UI (emoji allowed).
 * - Use {@link PRODUCT_TAGLINE} and {@link PRODUCT_DESCRIPTION} for marketing
 *   hero copy and HTML metadata.
 * - Use {@link PRODUCT_APP_NAME} for document title, env defaults, OpenRouter
 *   `X-Title`, and other provider/metadata surfaces (ASCII only, no emoji).
 */
export const PRODUCT_DISPLAY_NAME = "ApexPMF" as const;
export const PRODUCT_TAGLINE =
  "Your Fastest Path to Product-Market Fit" as const;
export const PRODUCT_DESCRIPTION =
  "AI agent that finds you product-market fit the fastest way possible" as const;
export const PRODUCT_APP_NAME = "ApexPMF" as const;
