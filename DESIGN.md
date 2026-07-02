---
name: Po Agent Web
description: A clean, lightweight developer workspace built on a warm-light canvas with mint-green accents, black primary actions, and linear structure.
colors:
  light:
    canvas: "#fbfbf8"
    panel: "#ffffff"
    elevated: "#ffffff"
    subtle: "#f7f7f4"
    hover: "#f4f4f0"
    selected: "#e8f5ee"
    text: "#0a0a0a"
    muted: "#3f3f46"
    dim: "#71717a"
    borderSubtle: "#e7e5df"
    borderStrong: "#c9c4b8"
    borderEmphasis: "#22e68a"
    accent: "#22e68a"
    accentHover: "#16c978"
    accentDeep: "#0d6b42"
    accentSoft: "#ddfbea"
    accentForeground: "#0a0a0a"
    destructive: "#ef4444"
    success: "#22c55e"
    warning: "#f59e0b"
typography:
  display: "Noto Serif SC, Playfair Display, Georgia, serif"
  ui: "Inter, ui-sans-serif, system-ui, sans-serif"
  mono: "Noto Sans Mono, JetBrains Mono, Fira Code, Consolas, monospace"
radius:
  small: "6px"
  control: "8px"
  floating: "12px"
motion:
  fast: "150ms"
  standard: "200ms"
  slow: "220ms"
---

# Design System: Po Agent Web

## Direction

The interface is a focused desktop developer tool, not a marketing surface. Preserve its project-centered navigation and established workflows without requiring every panel to remain visible. The theme is Agent Mint: warm neutral light surfaces with a fresh mint-green accent for state and selection, and black primary actions for high-contrast CTA clarity. The single light theme keeps the workspace bright, breathable, and trustworthy.

## Workspace architecture

- Left navigation owns New chat, Model Provider, Skills, projects, sessions, and locale.
- The central workspace switches views while Chat remains mounted.
- The right File Workspace is user-opened, resizable, and hidden on configuration views without losing state.
- The minimum supported viewport width is 1024px; there is no mobile-specific layout.
- Use the Agent Mint semantic palette with accent reserved for focus, selection, live state, and status indicators.

## Token architecture

The dependency direction is:

`base values → semantic tokens → shared UI components → feature surfaces`

Feature components must consume semantic tokens or shared primitives. Do not introduce one-off colors, radii, shadows, or transition durations.

## Typography

- Use Playfair Display for Latin display text and Noto Serif SC for Chinese display text.
- Display serif is limited to the welcome title, current session title, and major Dialog titles.
- UI labels, controls, forms, lists, chat content, and navigation remain sans-serif.
- Paths, code, compact metadata, and technical values use the mono stack.
- Display titles use weight 600 and letter spacing no tighter than `-0.03em`.
- Body prose should generally remain within 65–75 characters per line.

## Linear structure

Use three boundary roles:

1. `border-subtle` for internal dividers, rows, form groups, and message details.
2. `border-strong` for primary panels, toolbars, composer boundaries, and selected structure.
3. A complete `border-strong` frame plus `shadow-floating` for Dialogs, Dropdowns, Select content, Tooltips, and Popovers.

Do not use thick colored side stripes, repeated heavy rules, decorative grids, noise, or textured backgrounds.

## Shape and elevation

- Small icon controls: 6px.
- Buttons, inputs, textareas, and inline controls: 8px.
- Cards, panels, and floating surfaces: 12px.
- Pills and circles are reserved for badges, status dots, and switch tracks.
- Cards use a subtle resting shadow (`--shadow-card`) for gentle elevation.
- Genuine floating surfaces (Dialogs, Dropdowns, Tooltips) use `--shadow-floating`.

## Component states

Every interactive component must account for default, hover, focus-visible, active, selected, disabled, loading, and error states.

- Hover changes tone, not geometry.
- Focus-visible uses a clear 2px semantic focus ring.
- Selected state combines background, text weight, and boundary.
- Disabled state blocks interaction and uses disabled surface/text tokens.
- Loading prevents duplicate submission and keeps labels understandable.
- Error, success, and warning use semantic color plus text, icon, border, or shape.

## Color usage

Mint accent for state. The accent color (`#22e68a`) is reserved for focus, selection, live agent state, and status indicators. Primary actions use black (`--text`) for high-contrast CTA clarity. Use `--accent-deep` (`#0d6b42`) for accent-colored text and links to ensure WCAG AA contrast.

## Chat execution process

- Consecutive assistant thinking and tool activity from one user request is presented as one execution process with one model label.
- The execution process is open while running, collapses when the assistant turn completes, and remains open only when the assistant turn itself fails. A recoverable tool failure stays local to its step and does not mark the whole process as failed.
- Final answer content stays outside the execution process and remains directly readable.
- Tool rows reserve stable columns for the command summary, textual status, and disclosure control so long commands cannot move or hide status.
- Process rows use visible separators and right-to-down disclosure arrows; inherited markdown or code whitespace styles must not change the row layout.

## Dialog safety

- Backdrop clicks never close Dialogs.
- Escape never closes Dialogs.
- A visible close, cancel, save, or confirmation action is always available.
- Unsaved model configuration requires a discard confirmation.
- The safe action receives default focus in destructive confirmations.
- Provider deletion, model removal, API key removal, and OAuth disconnect require confirmation.
- Session deletion uses the standard destructive confirmation Dialog and names the session being deleted.
- Dangerous buttons use specific verbs rather than a generic "Confirm".

## Motion

- State transitions use 150–220ms.
- Animate color, opacity, transform, and short shadows only when they communicate state.
- Avoid decorative page entrances, background motion, particles, magnetic effects, and cursor trails.
- `prefers-reduced-motion: reduce` changes non-essential animation to near-instant transitions.
- ReactBits is not part of this implementation and requires a separate proposal.

## Do

- Use the Agent Mint light theme consistently across the workspace.
- Prefer semantic tokens and shared primitives.
- Keep focus visible, keyboard paths intact, and labels accessible.
- Use accent for state, selection, focus, and live indicators; use black for primary actions.
- Verify 1024px, 1440px, and 1920px desktop widths in both languages.

## Do not

- Do not use gradients, glassmorphism, neon, decorative textures, or marketing-page patterns.
- Do not apply serif type to buttons, navigation, forms, lists, or long chat content.
- Do not create cards for every piece of information.
- Do not silently change business logic, API contracts, or operation paths.
