/**
 * Product identity: human-facing vs machine-facing strings must stay split.
 *
 * - Use {@link PRODUCT_DISPLAY_NAME} only in React-rendered UI (emoji allowed).
 * - Use {@link PRODUCT_APP_NAME} for document title, env defaults, OpenRouter
 *   `X-Title`, and other provider/metadata surfaces (ASCII only, no emoji).
 */
export const PRODUCT_DISPLAY_NAME = "ZERO 🚀 ONE" as const;
export const PRODUCT_APP_NAME = "zeroone" as const;
