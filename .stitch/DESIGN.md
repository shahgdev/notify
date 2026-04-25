# Design System Specification: High-End Editorial AI Interface
Project ID: 3302943633271608937

## 1. Overview & Creative North Star: "The Luminescent Curator"
This design system is built for 'Notify', an AI study platform that demands an atmosphere of cognitive focus and "Venture-backed" prestige. Our Creative North Star is **The Luminescent Curator**. We are moving away from the "SaaS-standard" flat UI and toward a high-fidelity, editorial experience that feels like a physical object made of dark obsidian and frosted light.

The layout strategy relies on **Intentional Asymmetry**. Do not center-align every element. Use generous, uneven whitespace and overlapping translucent layers to create a sense of movement. We are not building a grid of boxes; we are building a spatial environment where AI-driven insights float within a deep, dark canvas.

---

## 2. Colors & Surface Philosophy
The palette rejects generic blue-scale primaries in favor of deep violets and electric neon accents.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** Structural boundaries must be defined solely through background color shifts or tonal transitions. Use `surface_container_low` (#131b2e) against `surface` (#0b1326) to create natural containment. If a container requires a edge, refer to the "Ghost Border" rule in Section 4.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers of glass. 
- **Base Layer:** `surface` (#0b1326) – The infinite void.
- **Sectional Layer:** `surface_container` (#171f33) – For broad content groupings.
- **Interactive Layer:** `surface_container_high` (#222a3d) – For cards that demand user focus.
- **Nesting:** An inner card (`surface_container_highest` - #2d3449) should sit inside a section (`surface_container_low`) to create "lift" without shadows.

### The "Glass & Gradient" Rule
To achieve the premium "Notify" aesthetic, all primary cards must use **Glassmorphism**:
- **Background:** `surface` at 40% opacity (`#0b132666`).
- **Effect:** `backdrop-blur-xl`.
- **Accent:** Main CTAs should use a linear gradient from `primary_container` (#6D28D9) to `secondary_container` (#03B5D3) at a 135-degree angle. This provides the "visual soul" that flat colors lack.

---

## 3. Typography: The Editorial Edge
We use high-contrast geometric pairings to convey authority and precision.

| Level | Token | Font | Specs | Styling |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Space Grotesk | 3.5rem | `leading-none`, `tracking-tight`, Bold |
| **Headline**| `headline-md` | Space Grotesk | 1.75rem | `leading-tight`, `tracking-tighter`, Semibold |
| **Body** | `body-md` | Manrope | 0.875rem | `leading-relaxed`, Regular |
| **Metadata**| `label-sm` | Plus Jakarta Sans | 0.6875rem | **UPPERCASE**, `tracking-widest`, Bold |

**Director's Note:** Headers should be "aggressively tight." Use `leading-none` for Display styles to create a blocky, architectural feel. Contrast this with `label-sm` metadata, which should breathe with `tracking-widest` for a high-fashion, technical look.

---

## 4. Elevation & Depth
In this system, depth is a product of light and transparency, not "drop shadows."

### The Layering Principle
Depth is achieved by stacking `surface-container` tiers. A `surface_container_lowest` (#060e20) card placed on a `surface_container_low` section creates a soft, natural inset effect.

### Ambient Shadows & Glowing Borders
- **Shadows:** When a floating effect is mandatory, use a `24px` blur with 8% opacity. Use a tint of `primary` (#D3BBFF) for the shadow color to simulate a neon glow rather than a grey smudge.
- **The Ghost Border:** For accessibility, use a 1px border with `outline_variant` (#4A4455) at **15% opacity**. This creates a "glint" on the edge of the glass rather than a hard line.
- **Glow Accents:** For active states, use a `1px` border with a gradient from `secondary` (#4CD7F6) to `tertiary` (#4EDE63) to signal AI "intelligence" or "active" status.

---

## 5. Components

### Buttons
- **Primary:** Gradient from `primary_container` to `secondary_container`. White text (`on_surface`). `xl` (1.5rem) corner radius.
- **Secondary (Glass):** `surface` at 20% opacity + `backdrop-blur-md` + Ghost Border.
- **Tertiary:** Pure text using `label-md` in `secondary` color, uppercase with `tracking-widest`.

### Floating Cards (The "Notify" Card)
- **Structure:** `surface_container_highest` at 40% opacity.
- **Blur:** `backdrop-blur-xl`.
- **Edge:** A top-weighted "Ghost Border" (simulating light hitting the top edge).
- **Spacing:** No dividers. Use `spacing.8` (2.75rem) to separate internal content blocks.

### AI Input Fields
- **Base:** `surface_container_lowest` (#060e20).
- **Active State:** The border glows with a `secondary` (#4CD7F6) 1px stroke and a subtle outer-glow of the same color (blur: 10px).
- **Typography:** Placeholder text in `outline` at 50% opacity.

### Selection Chips
- Use `full` (9999px) roundedness. 
- Unselected: `surface_container_high`.
- Selected: `primary_container` background with `primary` glow.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `spacing.20` or `spacing.24` for hero-to-content transitions. Space is a luxury.
- **Do** use "Optical Centering"—sometimes an AI-generated card needs slightly more bottom padding than top padding to "feel" balanced.
- **Do** use `tertiary` (#4EDE63) for success states and "AI Insight" badges.

### Don't:
- **Don't use 100% opaque cards.** It breaks the "Luminescent Curator" vibe and makes the UI feel heavy and dated.
- **Don't use dividers.** If you need to separate two list items, use a `0.35rem` background shift or vertical whitespace. 
- **Don't use standard "Red" for errors.** Use `error` (#FFB4AB) with a glass background to maintain the premium dark-mode aesthetic.

---

## 7. Spacing & Rhythm
We follow a non-linear sense of rhythm.
- **Outer Margins:** Always `spacing.6` (2rem) for mobile.
- **Gutter:** `spacing.4` (1.4rem).
- **Component Padding:** Internal card padding should be `spacing.5` (1.7rem) to feel spacious and Apple-tier.
