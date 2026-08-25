---
name: CarsDB
description: A collector-first catalog with personal collection tracking for Cars-universe die-cast toys.
colors:
  primary: "#e31c1c"
  primary-dinoco: "#4fb3f5"
  primary-cruz: "#cddc1f"
  primary-mater: "#b5622c"
  primary-doc: "#2a4d8f"
  primary-ramone: "#7c3fd4"
  primary-chick: "#2f9e54"
  accent-neutral: "#c2c4c9"
  surface-dark: "#0b0c0e"
  panel-dark: "#1a1c20"
  border-dark: "#26282d"
  text-dark: "#f2f1ee"
  surface-light: "#f2f0ec"
  panel-light: "#fbfaf8"
  border-light: "#e4e1da"
  text-light: "#17181b"
  secondary: "#f5f5f0"
  success: "#3f9f5f"
  warning: "#d98a2b"
  error: "#ff5a5a"
typography:
  display:
    fontFamily: "Titillium Web, Trebuchet MS, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Titillium Web, Trebuchet MS, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  selector: "0.5rem"
  field: "0.5rem"
  box: "0.9rem"
  card: "0.75rem"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.selector}"
    padding: "0.5rem 1rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.selector}"
    padding: "0.5rem 1rem"
  input:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.field}"
    padding: "0.5rem 0.75rem"
  card:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.card}"
    padding: "0.625rem"
  chip:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-dark}"
    rounded: "{rounded.selector}"
    padding: "0.125rem 0.375rem"
---

# Design System: CarsDB

## Overview

**Creative North Star: "Simplicity"**

CarsDB keeps the collector's attention on the catalog. The interface is compact and information-forward, with a playful layer supplied by the character theme selector rather than by decorative clutter. It should feel like a capable collector tool that happens to have personality: professional enough to trust with a collection, lively enough to make browsing enjoyable.

The incumbent system uses a dark-first, softly layered surface model with rounded containers, thin borders, compact metadata, and small moments of lift on interaction. The active character palette changes the accent and supporting surfaces while the information hierarchy stays stable. Light mode is a supported alternate surface, not a separate visual language.

**Key Characteristics:**

- Simplicity before decoration.
- Playful character color with professional structure.
- Soft tonal layering and restrained elevation.
- Compact, scan-friendly catalog cards.
- Innovative controls expressed through useful interaction, not novelty.

## Colors

The palette is a semantic system with a character selector: McQueen, Dinoco, Cruz, Mater, Doc Hudson, Ramone, and Chick Hicks each provide a distinct accent family, while dark/light surfaces preserve the same hierarchy.

### Primary

- **Circuit Red** (`{colors.primary}`): The default McQueen accent for primary actions, selected states, links, rating stars, logo highlights, and search matches.
- **Dinoco Blue** (`{colors.primary-dinoco}`): A cool alternate accent exposed by the Dinoco theme.
- **Cruz Lime** (`{colors.primary-cruz}`): A high-visibility alternate accent exposed by the Cruz theme.
- **Mater Rust** (`{colors.primary-mater}`): A warm, grounded alternate accent exposed by the Mater theme.
- **Doc Navy** (`{colors.primary-doc}`): A restrained alternate accent exposed by the Doc Hudson theme.
- **Ramone Purple** (`{colors.primary-ramone}`): A saturated alternate accent exposed by the Ramone theme.
- **Chick Green** (`{colors.primary-chick}`): A racing-green alternate accent exposed by the Chick Hicks theme.

### Secondary

- **Warm White** (`{colors.secondary}`): High-contrast secondary content and light text surfaces.

### Neutral

- **Near-Black Canvas** (`{colors.surface-dark}`): The default dark page background.
- **Graphite Panel** (`{colors.panel-dark}`): Navigation, controls, forms, and card surfaces in dark mode.
- **Graphite Border** (`{colors.border-dark}`): One-pixel borders, dividers, and low-contrast separation.
- **Ivory Text** (`{colors.text-dark}`): Primary content on dark surfaces.
- **Warm Light Canvas** (`{colors.surface-light}`): The light-mode page background.
- **Paper Panel** (`{colors.panel-light}`): Light-mode navigation, controls, and card surfaces.
- **Warm Light Border** (`{colors.border-light}`): Light-mode dividers and container edges.
- **Ink Text** (`{colors.text-light}`): Primary content on light surfaces.
- **Character-Neutral Accent** (`{colors.accent-neutral}`): Neutral accent and icon treatment in the default dark theme.

### Named Rules

**The One Palette, Many Personalities Rule.** Theme changes may change the accent family and supporting tones, but they must not change the product's hierarchy, terminology, or interaction model.

## Typography

**Display Font:** Titillium Web (with Trebuchet MS fallback)

**Body Font:** Titillium Web (with Trebuchet MS fallback)

**Label/Mono Font:** Martian Mono (with `ui-monospace` fallback)

**Character:** Titillium Web keeps the interface open, legible, and slightly athletic. Martian Mono is reserved for compact metadata, labels, uppercase utility text, and rating/count details, giving those small signals a technical collector-inventory character.

### Hierarchy

- **Display** (700, 1.875rem at the largest observed heading, 1.2 line-height): Page and dashboard headings.
- **Headline** (700, 1.5rem, responsive to 1.875rem): Profile and authentication section headings.
- **Title** (600, 0.875rem, tight line-height): Car names and compact card titles.
- **Body** (400, 1rem, 1.5 line-height): Form labels, explanatory copy, empty states, and normal interface text.
- **Label** (500, 0.75rem, 0.08em tracking, uppercase where used): Theme names, card metadata, status labels, ratings, and compact controls.
- **Micro-label** (500, 0.5rem–0.5625rem, tracking-wide, uppercase where used): Car-card tags and dense inventory metadata.

### Named Rules

**The Signal Scale Rule.** Use Titillium Web for reading and action; use Martian Mono only when a value benefits from compact, instrument-like emphasis.

## Layout

CarsDB uses a centered, full-width application shell capped at 72rem (`max-w-6xl`). The root page uses 0.75rem padding on narrow screens and 1rem at the small breakpoint, with the navigation and primary content aligned to the same maximum width.

The catalog is a responsive card grid: two columns by default, four at the medium breakpoint, and six at the large breakpoint. Profile views use a slightly more spacious three-column medium layout before reaching six columns. Controls are grouped into rounded full-width panels with 1rem internal padding, and larger vertical gaps separate major regions without adding ornamental whitespace.

Responsive behavior favors progressive wrapping over horizontal overflow. Header actions can hide secondary labels on narrow screens, while filters, search, sorting, and collection state remain available as stacked controls.

## Elevation & Depth

Depth is softly layered. Tonal differences between canvas, panel, border, and card surfaces do most of the work; ambient shadows support navigation bars, control panels, authentication cards, and the admin dashboard. Car cards add a small hover lift and border response, so interaction feels tactile without becoming theatrical.

### Shadow Vocabulary

- **Ambient panel lift:** Large soft shadows on navigation, filter bars, authentication panels, and admin containers.
- **Card rest:** Tonal layering and a quiet border carry most of the card's separation.
- **Interaction lift:** A short, 0.125rem upward translation and accent-border response on car-card hover.

### Named Rules

**The Soft-Layer Rule.** Prefer tonal surface steps and restrained shadows; reserve stronger elevation for containers that organize a workflow or respond to interaction.

## Shapes

The form language is gently rounded rather than bubbly. Selectors and fields use 0.5rem corners, larger boxes use 0.9rem corners, and car cards use a 0.75rem radius with overflow clipping around the image. Pills are reserved for status badges and compact tags. Borders are thin and low-contrast at rest, with the active character accent appearing on selected or interactive states.

## Components

### Buttons

Buttons feel compact, responsive, and slightly innovative through gradient treatment and clear state changes.

- **Shape:** Gently rounded controls (0.5rem), with square icon-only variants.
- **Primary:** Character-accent gradient, white or theme-appropriate content, compact padding, and a small brightness increase on hover.
- **Hover / Focus:** Primary buttons brighten; outline buttons gain clearer contrast. Focus remains visibly ringed by the active theme.
- **Secondary / Ghost:** Secondary actions use a softly blended panel gradient or transparent ghost treatment with the same radius and type scale.

### Chips

- **Style:** Compact Martian Mono labels with subdued panel fill, one-pixel border, and muted text.
- **State:** Owned and Wishlist statuses use success/warning semantics; catalog Tags remain neutral until selected or searched.

### Cards / Containers

- **Corner Style:** 0.75rem for car cards, 0.9rem for larger boxes.
- **Background:** A dark/light panel base with a subtle diagonal blend toward the active primary color in the card body.
- **Shadow Strategy:** Soft ambient lift for workflow containers; cards rely on tonal layering with a small hover translation.
- **Border:** One-pixel base border at rest; active card edges and hover states may use the primary accent.
- **Internal Padding:** Compact 0.625rem card padding; 1rem or more for control and form containers.

### Inputs / Fields

- **Style:** Bordered panel fields with 0.5rem corners, comfortable horizontal padding, and the active theme's surface contrast.
- **Focus:** Use the framework's visible focus treatment and keep the accent legible in both dark and light modes.
- **Error / Disabled:** Errors use the semantic error color and adjacent plain-language copy; disabled controls should retain readable contrast while clearly reducing interaction emphasis.

### Navigation

- **Style:** A full-width rounded panel aligned to the application max width, with the logo mark, theme picker, and account actions in one compact row.
- **Typography:** CarsDB is set in bold uppercase Titillium Web with the `DB` highlighted by the active primary color; utility labels remain compact.
- **States:** Navigation actions use outline buttons until the main sign-in action, which uses the primary gradient. On narrow screens, nonessential text labels may collapse while icons and actions remain discoverable.

### Theme Picker

The theme picker is the signature personality component: a compact swatch-and-label control opens a character list, paired with a dark/light mode toggle. It is the sanctioned place for playful variation; the rest of the interface should remain structurally calm.

## Do's and Don'ts

### Do:

- **Do** keep the catalog and collection state visually easy to scan before adding decoration.
- **Do** use the active character accent for meaningful action, selection, ratings, and identity moments.
- **Do** preserve the Titillium Web and Martian Mono pairing and their role split.
- **Do** use soft surface layers, thin borders, and restrained shadows to organize workflow regions.
- **Do** make theme changes feel personal while keeping layout and behavior consistent.

### Don't:

- **Don't** let a playful theme become novelty UI or obscure the catalog.
- **Don't** introduce dense decorative patterns, loud textures, or competing accent colors without a clear functional reason.
- **Don't** use rounded pills for every surface; reserve them for statuses and compact tags.
- **Don't** replace the compact inventory rhythm with oversized marketing-style compositions.
- **Don't** use visual styling to blur the distinction between shared catalog facts and personal collection state.
