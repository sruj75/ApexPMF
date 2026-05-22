# Factory.ai — Style Reference
> Architectural blueprint on black marble. Lines are crisp, colors are limited, and every element serves a clear, functional purpose.

**Theme:** dark

Factory.ai embraces a 'technical brutalism meets digital precision' aesthetic, prioritizing informational clarity and directness. The near-monochromatic palette, dominated by near-black surfaces and light gray type, provides a stark, high-contrast backdrop for technical content. A single vivid orange accent color is deployed sparingly as a functional indicator, highlighting interactive elements and key information without visual noise. The strong typographic voice, characterized by precise letter-spacing and a monospace variant for code, reinforces the structured, engineering-focused identity.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Factory Black | `#020202` | `--color-factory-black` | Page background, darkest surfaces (e.g., active navigation items), dark filled buttons. |
| Factory Light Gray | `#eeeeee` | `--color-factory-light-gray` | Primary text on dark, light filled button backgrounds, default foreground. |
| Elevated Charcoal | `#1f1d1c` | `--color-elevated-charcoal` | Elevated card and panel backgrounds on dark (`neutral-1000`). |
| Cool Gray | `#b8b3b0` | `--color-cool-gray` | Subtle borders, inactive button outlines. Establishes divisions without harshness. |
| Graphite | `#3d3a39` | `--color-graphite` | Strong borders on elevated surfaces. |
| Muted Gray | `#8a8380` | `--color-muted-gray` | Secondary / subdued body text. |
| Ash Gray | `#a49d9a` | `--color-ash-gray` | Subtle interactive borders and outlines. |
| Code Orange | `#ef6f2e` | `--color-code-orange` | Accent color for 'NEW' badges, interactive indicators, and small, high-attention elements. Its vividness cuts through the neutral palette. |

## Tokens — Typography

### Geist — Primary typeface for all headings, body text, navigation, and general UI. The carefully tuned negative letter-spacing, particularly at larger sizes, creates a composed, intentional feel, preventing headlines from feeling loose. · `--font-geist`
- **Substitute:** Inter
- **Weights:** 400
- **Sizes:** 14px, 16px, 18px, 24px, 48px, 60px
- **Line height:** 1.00, 1.20, 1.50
- **Letter spacing:** -0.0480em, -0.0300em
- **Role:** Primary typeface for all headings, body text, navigation, and general UI. The carefully tuned negative letter-spacing, particularly at larger sizes, creates a composed, intentional feel, preventing headlines from feeling loose.

### Geist Mono — Used for code snippets, CLI instructions, and any content requiring a fixed-width, precise presentation. Its subtle negative letter-spacing maintains a tight, readable block structure. · `--font-geist-mono`
- **Substitute:** JetBrains Mono
- **Weights:** 400
- **Sizes:** 12px, 14px, 16px, 18px
- **Line height:** 1.00, 1.20, 1.38, 1.50
- **Letter spacing:** -0.0200em
- **Role:** Used for code snippets, CLI instructions, and any content requiring a fixed-width, precise presentation. Its subtle negative letter-spacing maintains a tight, readable block structure.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token |
|------|------|-------------|----------------|-------|
| caption | 12px | 1.5 | -0.24px | `--text-caption` |
| body-sm | 14px | 1.5 | — | `--text-body-sm` |
| body | 16px | 1.5 | — | `--text-body` |
| subheading | 18px | 1.2 | — | `--text-subheading` |
| heading | 24px | 1.2 | — | `--text-heading` |
| heading-lg | 48px | 1.2 | -2.3px | `--text-heading-lg` |
| display | 60px | 1 | -2.88px | `--text-display` |

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** comfortable

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 20 | 20px | `--spacing-20` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 36 | 36px | `--spacing-36` |
| 40 | 40px | `--spacing-40` |
| 48 | 48px | `--spacing-48` |
| 56 | 56px | `--spacing-56` |
| 64 | 64px | `--spacing-64` |
| 80 | 80px | `--spacing-80` |
| 120 | 120px | `--spacing-120` |

### Border Radius

| Element | Value |
|---------|-------|
| cards | 6px |
| header | 0px |
| buttons | 4px |
| default | 4px |

### Layout

- **Section gap:** 72px
- **Card padding:** 16px
- **Element gap:** 4px

## Components

### Text Link
**Role:** Navigation, inline links, 'Learn More' buttons

Color Factory Light Gray (#eeeeee) for primary links, transitioning to Muted Gray (#8a8380) for secondary. No explicit underline until hover, relying on contrast and context for discoverability. Uses Geist, 14-16px, weight 400.

### Navigation Link
**Role:** Top navigation menu items

Color Factory Light Gray (#eeeeee) on Factory Black (#020202) background. No special styling, relying solely on typography (Geist, 14px, 400 weight) for visual presence. Active items use the same styling with a subtle visual cue or background change.

### Ghost Button
**Role:** Secondary actions, grouped options (macOS / Linux)

Transparent background with text color Factory Light Gray (#eeeeee). Has a subtle Cool Gray (#b8b3b0) border. Padding 0 for inline context. Radius 0px.

### Outlined Button
**Role:** Download buttons, secondary calls to action

Transparent background with Factory Light Gray (#eeeeee) text. Border color Cool Gray (#b8b3b0), 1px solid. Padding 0 vertically, 12px horizontally. Radius 4px. Font Geist, 16px, 400 weight.

### Filled Button (Primary)
**Role:** Download buttons, primary calls to action on dark backgrounds

Background Factory Light Gray (#eeeeee), text Factory Black (#020202). Border color Ash Gray (#a49d9a). Padding 0 vertically, 12px horizontally. Radius 4px. Font Geist, 16px, 400 weight.

### Filled Button (Subtle)
**Role:** Nav actions (e.g. Log In) on dark backgrounds

Background Factory Black (#020202), text Factory Light Gray (#eeeeee). Border color Ash Gray (#a49d9a). Padding 6px vertically, 12px horizontally. Radius 8px.

### List Item Card
**Role:** Content blocks in feature sections

Transparent background, no shadow, 0px border radius. Padding 0 vertically, 16px horizontally. Used as a container for grouped information. Text uses Factory Light Gray (#eeeeee).

### Elevated Content Card
**Role:** Featured content blocks, forms, interactive elements

Background Elevated Charcoal (#1f1d1c), no shadow, 6px border radius. Padding 16px vertically, 0 horizontally. Provides a slight visual lift from the main background (#020202).

### Code Input Block
**Role:** CLI instruction display, interactive code examples

Background Elevated Charcoal (#1f1d1c), no shadow, 6px border radius. Padding 0. Contains monospaced text for commands in Factory Light Gray (#eeeeee). May feature interactive elements like a copy button.

### 'NEW' Badge
**Role:** Highlights new features or content

Transparent background, text Code Orange (#ef6f2e). Radius 0px, padding 0. Appears as a small, vivid text label next to titles, using Geist Mono 12px.

## Do's and Don'ts

### Do
- Prioritize Factory Light Gray (#eeeeee) for primary text and Factory Black (#020202) for background, ensuring AAA contrast.
- Apply Geist font consistently for all UI text, utilizing negative letter-spacing for large headlines (e.g., -0.0480em at 60px) to achieve a condensed, precise appearance.
- Use Geist Mono for all code snippets and CLI instructions at weights 400 and sizes 12-18px for clear distinction.
- Implement Cool Gray (#b8b3b0) for subtle borders and dividers to maintain visual structure without heavy lines.
- Reserve Code Orange (#ef6f2e) strictly for highlighting functional elements like 'NEW' badges and active indicators.
- Maintain a default border radius of 4px for buttons and form elements, extending to 6px for elevated cards.
- Ensure consistent vertical spacing of 24px and horizontal elements gaps of 12px or 8px using the base 4px unit.

### Don't
- Avoid using chromatic colors beyond Code Orange (#ef6f2e) to maintain the stark, technical aesthetic.
- Do not introduce shadows or complex gradients; rely on color and typography for hierarchy and depth.
- Do not use generic system fonts; always specify Geist or Geist Mono for design consistency.
- Avoid excessive padding or large border radii; the design favors a compressed, precise feel.
- Do not use underlines for links unless on hover, rely on color and context (Factory Light Gray on dark backgrounds).
- Avoid arbitrary text styling (bolding, italics); rely on the established type scale (Geist, 400 weight) for hierarchy.
- Do not deviate from the specified negative letter-spacing values, especially for headlines, as it is a core characteristic of the brand's typography.

## Imagery

The visual language for imagery is primarily functional and technical, leaning heavily on abstract conceptual graphics, UI screenshots, and code blocks. Product screenshots are contained within precise, slightly rounded frames, often featuring stylized UI elements rather than raw interfaces. Graphics are typically monochromatic or use a limited palette, often employing dotted patterns (like the 'grid' in the hero section) and stark lines. There's an absence of photography or human elements, focusing instead on the tools and concepts of software development. Imagery serves an explanatory role, illustrating functionality or abstracting complex ideas, with a high density relative to other pure UI sites.

## Layout

The page structure employs a full-width layout with a primary content area constrained by a clear maximum width, centered on the screen. The hero section is a split two-column design: text-dominant on the left with a headline and descriptive copy, and abstract/UI visuals on the right, punctuated by sparse dot patterns. Sections generally follow a consistent vertical rhythm, often alternating between text-heavy content and content paired with product screenshots or conceptual graphics, typically in a two-column arrangement (text left, image right, or vice versa). There are occasional three-column card grids for presenting features or articles. The navigation is a persistent top bar, clean and functional, with a clear separation of branding and menu items. The layout emphasizes clarity and content organization, feeling spacious yet structured.

## Agent Prompt Guide

### Quick Color Reference
- **Text Primary:** #eeeeee
- **Page Background:** #020202
- **Card Background (elevated):** #1f1d1c
- **Text Secondary:** #8a8380
- **Border/Divider:** #b8b3b0
- **Border Strong:** #3d3a39
- **Accent:** #ef6f2e

### Example Component Prompts
1. **Create a Hero Section:** Set page background to Factory Black (#020202). Left half: headline 'Agent-Native Software Development' in Geist, 60px, weight 400, letter-spacing -0.0480em, color Factory Light Gray (#eeeeee). Subheading 'The only software development agents that work everywhere you do.' in Geist, 18px, weight 400, color Muted Gray (#8a8380). Right half: an abstract graphic with subtle dotted patterns.
2. **Generate an Outlined Button:** Label 'Download macOS (Apple Silicon)'. Use transparent background, Factory Light Gray (#eeeeee) text, Cool Gray (#b8b3b0) 1px border. Padding top/bottom 0px, left/right 12px. Border radius 4px. Font Geist, 16px, weight 400.
3. **Design a Code Input Block:** Use background Elevated Charcoal (#1f1d1c), no border, 6px border-radius. Inside, display code `curl -fsSL https://app.factory.ai/cli | sh` in Geist Mono, 16px, weight 400, letter-spacing -0.0200em, color Factory Light Gray (#eeeeee). Add a copy icon next to it.
4. **Create an Elevated Content Card:** Use background Elevated Charcoal (#1f1d1c), no box-shadow, 6px border-radius. Padding 16px top/bottom, 0px left/right. Insert a 'NEW' badge next to a section title. The 'NEW' badge should be text 'NEW' in Geist Mono, 12px, weight 400, color Code Orange (#ef6f2e).
5. **Build a Navigation Bar:** Use background Factory Black (#020202) with no border. Nav links like 'Product', 'Enterprise' use Geist, 14px, weight 400, color Factory Light Gray (#eeeeee). Include 'Log In' button as a Filled Button (Subtle) variant and 'Contact Sales' as an Outlined Button.

## Similar Brands

- **Vercel** — Monochromatic color palette with a single bright accent color and a focus on developer tools and precise typography.
- **Linear** — Minimalist UI with high-contrast text on dark backgrounds and a strong emphasis on functional, clear typography.
- **Tailwind CSS** — Documentation-heavy site with a preference for stark neutrals, code blocks, and a straightforward, unadorned aesthetic.
- **Supabase** — Developer-focused design with clear content separation, high-contrast dark UI, and precise type choices for readability.

## Quick Start

### CSS Custom Properties

```css
:root {
  color-scheme: dark;

  /* Colors */
  --color-factory-black: #020202;
  --color-factory-light-gray: #eeeeee;
  --color-elevated-charcoal: #1f1d1c;
  --color-muted-gray: #8a8380;
  --color-cool-gray: #b8b3b0;
  --color-graphite: #3d3a39;
  --color-ash-gray: #a49d9a;
  --color-code-orange: #ef6f2e;

  /* Typography — Font Families */
  --font-geist: 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.5;
  --tracking-caption: -0.24px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --text-subheading: 18px;
  --leading-subheading: 1.2;
  --text-heading: 24px;
  --leading-heading: 1.2;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: -2.3px;
  --text-display: 60px;
  --leading-display: 1;
  --tracking-display: -2.88px;

  /* Typography — Weights */
  --font-weight-regular: 400;

  /* Spacing */
  --spacing-unit: 4px;
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-56: 56px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  /* Layout */
  --section-gap: 72px;
  --card-padding: 16px;
  --element-gap: 4px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;

  /* Named Radii */
  --radius-cards: 6px;
  --radius-header: 0px;
  --radius-buttons: 4px;
  --radius-default: 4px;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-factory-black: #020202;
  --color-factory-light-gray: #eeeeee;
  --color-elevated-charcoal: #1f1d1c;
  --color-muted-gray: #8a8380;
  --color-cool-gray: #b8b3b0;
  --color-graphite: #3d3a39;
  --color-ash-gray: #a49d9a;
  --color-code-orange: #ef6f2e;

  /* Typography */
  --font-geist: 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-geist-mono: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Typography — Scale */
  --text-caption: 12px;
  --leading-caption: 1.5;
  --tracking-caption: -0.24px;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --text-subheading: 18px;
  --leading-subheading: 1.2;
  --text-heading: 24px;
  --leading-heading: 1.2;
  --text-heading-lg: 48px;
  --leading-heading-lg: 1.2;
  --tracking-heading-lg: -2.3px;
  --text-display: 60px;
  --leading-display: 1;
  --tracking-display: -2.88px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-36: 36px;
  --spacing-40: 40px;
  --spacing-48: 48px;
  --spacing-56: 56px;
  --spacing-64: 64px;
  --spacing-80: 80px;
  --spacing-120: 120px;

  /* Border Radius */
  --radius-md: 4px;
  --radius-lg: 8px;
  --radius-2xl: 16px;
  --radius-3xl: 24px;
}
```
