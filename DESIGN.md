---
name: Po Agent
description: A precise Codex-inspired desktop workspace with a white canvas, quiet neutral rails, compact controls, and restrained blue state accents.
colors:
  light:
    canvas: "#ffffff"
    panel: "#f5f5f5"
    elevated: "#ffffff"
    subtle: "#f7f7f7"
    hover: "#ededed"
    selected: "#e8e8e8"
    text: "#1a1c1f"
    muted: "#62666d"
    dim: "#8b9098"
    borderSubtle: "#e8e8e8"
    borderStrong: "#d7d7d7"
    borderEmphasis: "#339cff"
    accent: "#339cff"
    accentHover: "#1689f5"
    accentDeep: "#0670d3"
    accentSoft: "#eaf4ff"
    accentForeground: "#1a1c1f"
    destructive: "#d92d20"
    success: "#12b76a"
    warning: "#b54708"
typography:
  ui: "-apple-system, BlinkMacSystemFont, Segoe UI, Inter, PingFang SC, Microsoft YaHei, sans-serif"
  mono: "Noto Sans Mono, JetBrains Mono, Fira Code, Consolas, monospace"
radius:
  small: "6px"
  control: "8px"
  floating: "12px"
  composer: "22px"
motion:
  fast: "150ms"
  standard: "200ms"
  slow: "220ms"
---

# Design System: Po Agent

## Direction

Po Agent is a focused desktop developer tool, not a marketing or entertainment surface. Its visual north star is the Codex desktop workspace: white content canvas, quiet gray navigation rails, compact information density, system typography, restrained blue state accents, and dark primary actions. The implementation borrows interaction and presentation principles without adding features that the product does not actually support.

## Workspace architecture

- The left rail owns New chat, Model Provider, projects, sessions, and locale.
- The central workspace switches views while Chat remains mounted.
- The right Project panel is user-opened, resizable, and switches between Files and Skills for the project selected in the left rail. It is hidden on configuration views without losing state.
- The minimum supported viewport width is 1024px; there is no mobile-specific layout.
- Projects and sessions use compact single-line rows. Secondary metadata must not overpower titles or displace row actions.
- Model Provider keeps its 224px settings rail. The File tree adapts between 160px and 224px so the preview remains usable in a narrow Project panel. Skills uses single-column list, detail, and add states rather than nesting a settings rail inside the panel.

## Project panel

- Files and Skills are sibling tabs in the right Project panel because both are interpreted relative to the project selected in the left rail.
- The Skills tab shows the effective Skill set for that project: project-scoped, global, built-in, and Skill Pack-provided Skills.
- Project installation means only the selected project. Global installation means every project, including projects added later. Installation controls must name both the selected project and the global effect explicitly.
- Switching projects reloads the effective Skill set and leaves no stale detail from the previous project.
- Opening a file selects Files; opening Skills from Chat selects Skills. The panel keeps its last selected tab when it is closed and reopened.

## Token architecture

The dependency direction is:

`base values → semantic tokens → shared UI components → feature surfaces`

Feature components consume semantic tokens or shared primitives. Do not introduce one-off colors, radii, shadows, or transition durations.

## Typography

- Use the native system sans stack for all interface text, headings, navigation, forms, and chat prose.
- Paths, code, compact metadata, model identifiers, and technical values use the mono stack.
- Headings use weight 600 with restrained negative tracking; there is no decorative display serif.
- Font sizes use a semantic token scale — do not use arbitrary `text-[Npx]` values:
  - `text-caption` (11px, lh 1.2) — badges, timestamps, micro labels
  - `text-meta` (12px, lh 1.25) — technical metadata, section labels
  - `text-xs` (13px) — sidebar items, compact values
  - `text-body-sm` (14px, lh 1.4) — descriptions, secondary text
  - `text-sm` (15px) — default UI text
  - `text-prose` (16px, lh 1.5) — chat composer body
  - `text-base` (17px) — body prose
  - `text-lg` (19px) — section headings
- Default UI text is 15px (`text-sm`); compact code and technical metadata use 12–13px (`text-meta`, `text-xs`).
- Body prose should generally remain within 65–75 characters per line.

## Boundaries, shape, and elevation

Use three boundary roles:

1. `border-subtle` for internal dividers, rows, form groups, and message details.
2. `border-strong` for the composer and controls that need stronger structure.
3. A complete border plus `shadow-floating` for Dialogs, Dropdowns, Select content, Tooltips, and Popovers.

- Small icon controls use 6px corners; standard controls use 8px; grouped/floating surfaces use 12px.
- The chat composer is the intentional exception at 22px.
- Pills and circles are reserved for badges, status dots, switches, and the send icon button.
- Resting cards are flat. Shadows appear only where a surface genuinely floats.
- Do not use decorative grids, textures, gradients, neon, or layered glass effects.

## Component states

Every interactive component accounts for default, hover, focus-visible, active, selected, disabled, loading, and error states.

- Hover changes tone, not geometry.
- Focus-visible uses a clear 2px `#0670d3` semantic ring; the brighter `#339cff` remains the product accent.
- Selected navigation uses neutral gray plus text weight; blue is not a blanket selection fill.
- Disabled controls block interaction and explain the specific reason through visible copy or a tooltip.
- Loading states prevent duplicate actions while keeping labels understandable.
- Error, success, and warning states combine color with text, icon, border, or shape.

## Color usage

Codex blue (`#339cff`) is reserved for active state fills, switches, live state, and explicit status. Selected navigation and passive highlights remain neutral gray. Primary actions use near-black (`#1a1c1f`) with white text. Use the deeper accessible blue (`#0670d3`) for focus rings, links, and small blue text.

## Chat

- User messages use a compact neutral bubble; assistant answers remain on the canvas without an enclosing decorative card.
- Consecutive thinking and tool activity from one user request is one execution process with one model label.
- The process is open while running and collapses after completion; recoverable tool failures remain local to their step.
- Final answer content stays outside the execution disclosure and remains directly readable.
- Tool rows reserve stable columns for command summary, status, and disclosure controls.
- The floating Composer keeps model, thinking, compaction, attachments, queue/steer/stop, and send controls in one compact toolbar.

## Settings and detail pages

- Configuration views use a quiet 224px navigation rail and one centered reading column.
- Settings are grouped into bordered sections with label and description on the left and the control on the right.
- Rows use dividers instead of separate cards. Destructive actions remain visually separated and explicitly confirmed.
- Auto-save status stays in the workspace chrome; do not reintroduce a fake manual-save workflow.

## Dialog safety

- Backdrop clicks and Escape do not close Dialogs.
- A visible close, cancel, save, or confirmation action is always available.
- Unsaved model configuration requires discard confirmation.
- The safe action receives default focus in destructive confirmations.
- Provider deletion, model removal, API key removal, OAuth disconnect, and session deletion require explicit confirmation.

## Motion and accessibility

- State transitions use 150–220ms and animate only color, opacity, transform, or short shadows when they communicate state.
- `prefers-reduced-motion: reduce` makes non-essential animation near-instant.
- Preserve semantic HTML, accessible names, keyboard paths, visible focus, and WCAG AA contrast.
- Verify 1024px, 1440px, and 1920px desktop widths in both languages.

## Do not

- Do not add unsupported Codex features, placeholder metrics, or controls without real backend behavior.
- Do not create a card for every piece of information.
- Do not use mascot-like elements, playful copy, gradients, neon, decorative textures, or marketing-page patterns.
- Do not silently change business logic, API contracts, cancellation behavior, or operation paths.
