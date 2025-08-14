## IMA Alumni – Color System Refresh Plan (No Implementation Yet)

### Goal
Adopt the client-approved color palette across the entire application using centralized CSS variables, remove hard-coded legacy brand colors, and ensure contrast-accessible UI.

- Primary: #31c1fd (Light Sky Blue)
- Hover/Active (Primary Dark): #1b9cd8
- Secondary: #fe6a20 (Orange)
- Background: #fefefe (Near White)
- Text: #000000 (Black)

### Strategy
- Keep the existing CSS variable system in `:root` within `src/index.css` as the single source of truth.
- Update variables to the new palette and standardize all brand-related alphas with `--primary-rgb`.
- Replace any hard-coded blues/purples and gradients found across component-specific CSS with variable-driven values.
- Preserve current layout and spacing; only color/gradient/shadow tints change.

### Design Tokens To Apply (CSS variables)
In `src/index.css` under `:root`:
- --primary-color: #31c1fd
- --primary-dark: #1b9cd8
- --primary-light: derived lighter tint of primary (for subtle backgrounds and badges)
- --primary-rgb: 49, 193, 253
- --secondary-color: #fe6a20
- --secondary-dark: a slightly darker orange for hover states (we will pick a perceptually darker variant during implementation)
- --background: #fefefe
- --background-alt: a soft near-white for sections (meant to be slightly darker than background for separation)
- --text-primary: #000000
- --text-secondary: high-contrast gray on near-white (we will choose during implementation to maintain WCAG AA)
- --text-muted: muted gray (ensure AA minimum on background)
- --gradient-primary: linear-gradient(to right, var(--primary-color), var(--secondary-color))
- Ensure all rgba/alpha uses reference `rgba(var(--primary-rgb), <alpha>)`.

### Non-goals
- No structural/layout changes.
- No component rewrites.
- No Tailwind or design system migration in this task.

### Files
- Created: none (this planning document only)
- Modified (planned):
  - `src/index.css` – update root color tokens, primary rgb, gradients, focus ring color, and link color.
  - `src/components/Layout/Layout.css` – replace hard-coded brand hex/rgb values with variables; update logo gradient to primary→secondary; update nav hover/active backgrounds to use `rgba(var(--primary-rgb), …)`.
  - `src/pages/Auth/Auth.css` – update illustration gradient to primary→primary-dark, focus ring alpha to `--primary-rgb`.
  - `src/pages/Home/Home.css` – confirm usage of `--gradient-primary`; adjust any hard-coded alphas to use `--primary-rgb`.
  - `src/pages/Home/components/IMAHero/IMAHeroCard.css` – replace purple gradient (#4f46e5 → #7c3aed) with primary→secondary (or primary→primary-dark for maximum legibility); keep white text.
  - `src/pages/Home/components/Sidebar/DonationProgressCard.css` – change pink→orange gradients to primary→secondary; ensure numbers use `--primary-color`.
  - `src/pages/Admin/components/Dashboard/Dashboard.css` – swap subtle purple overlays to `rgba(var(--primary-rgb), <very low alpha>)`.
- Affected (no direct code edits expected but visually impacted):
  - All pages and components that inherit global variables or link/button styles.

### Implementation Steps (to execute next)
1. Update `src/index.css` variables to the new palette and standardize `--primary-rgb`.
2. Replace legacy hard-coded brand colors with variables in the CSS files listed above:
   - Search repo for these tokens and replace with variable-based equivalents:
     - `#4f46e5`, `#4338ca`, `#818cf8`, `#7c3aed`, `#6366f1`, `rgba(79, 70, 229`.
3. Gradients:
   - Header/logo and hero areas: pick between
     - Option A: primary→secondary for a vibrant brand gradient, or
     - Option B: primary→primary-dark for calmer monochrome depth.
   - Donation progress bar and icon: use primary→secondary.
4. Interaction states:
   - Link, button, and nav hover: use `--primary-dark` and `rgba(var(--primary-rgb), 0.08–0.24)` for subtle backgrounds and focus.
   - Focus rings: replace any fixed rgba values with `rgba(var(--primary-rgb), 0.15)`.
5. Background and text:
   - Set `--background` to #fefefe; validate `--background-alt` for section separation.
   - Set `--text-primary` to #000000; adjust `--text-secondary` and `--text-muted` to pass AA contrast against `--background` and `--background-card`.
6. Remove any remaining one-off hex values where a variable exists; fall back to variables.

### QA Checklist
- Verify color contrast (WCAG AA) for:
  - Text on `--background` and `--background-card`.
  - Buttons (default/hover/disabled) and links.
  - Badges, chips, and focus outlines.
- Visual pass on key screens:
  - Auth (Login)
  - Home (Hero, Post form/list, Donation card)
  - Layout (Header/Nav, Footer)
  - Admin Dashboard (cards, overlays, destructive actions)
- Check hover/active states feel coherent and not too saturated.
- Ensure no purple/indigo remnants remain in CSS or gradients.

### Rollback Plan
- Keep a Git commit with previous `src/index.css` values to revert quickly if needed.

### Acceptance Criteria
- All primary, secondary, background, and text colors match the client palette.
- No hard-coded legacy brand colors remain in CSS.
- Hover/active states use the darker primary (#1b9cd8) or appropriate alpha overlays.
- Gradients reflect the new scheme and remain readable.
- Contrast meets WCAG AA for body text and key UI elements.
