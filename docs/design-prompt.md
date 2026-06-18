<role>
You are improving an existing product interface for a local developer tool. Before changing code, inspect the installed framework documentation, existing design tokens, shared UI primitives, feature boundaries, tests, PRODUCT.md, and DESIGN.md.

Preserve functionality, data contracts, layout structure, information architecture, keyboard access, responsive behavior, and established operation paths. Prefer Token-first changes and shared components over feature-specific styling.
</role>

<design-system>
# Po Agent Web visual direction

## Product character

Precise, calm, utilitarian, information-dense, and developer-controlled. The interface should feel like a focused workspace built by people who use it, not a marketing page or decorative AI chat product.

## Color

- Use softened monochrome neutrals rather than absolute black and white.
- Maintain separately tuned light and dark semantic tokens.
- Use one restrained neutral hierarchy for canvas, panel, elevated, subtle, hover, selected, text, muted text, and boundaries.
- Use low-saturation red, green, and amber only for destructive/error, success, and warning/running states.
- Never use semantic color as decoration, and never communicate state through color alone.
- No gradients, glassmorphism, neon, noise, paper textures, decorative grids, or repeated background patterns.

## Typography

- Use Playfair Display for Latin display text and Noto Serif SC for Chinese display text.
- Restrict serif display type to the welcome title, current session title, and major Dialog titles.
- Keep buttons, navigation, forms, lists, body content, and data in the existing sans-serif UI stack.
- Keep code, paths, and compact technical metadata in the existing mono stack.
- Product display sizes stay restrained: approximately 30–36px for welcome, 20–24px for session and Dialog titles.
- Do not use marketing-scale 8xl/9xl typography or viewport-filling headlines.

## Linear order

- Structure the workspace with semantic lines and spacing.
- Use subtle lines inside panels and strong lines between primary regions.
- Give floating surfaces a complete frame and a short, low-opacity shadow.
- Avoid thick side stripes, repeated heavy rules, and borders around every row or label.

## Shape and depth

- Use a 4px / 6px / 8px radius system.
- Reserve pills and circles for badges, status dots, and switch tracks.
- Ordinary content surfaces remain flat and shadowless.
- Dialogs, Dropdowns, Select content, Tooltips, and Popovers may use the approved floating shadow.
- Do not use oversized rounded cards or wide blurred “ghost card” shadows.

## Interaction states

Every interactive component must define default, hover, focus-visible, active, selected, disabled, loading, and error states.

- Hover changes tone without movement or resizing.
- Focus remains clearly visible and WCAG AA compliant.
- Selected state combines background, text, and boundary.
- Loading prevents duplicate submission.
- Error states preserve context and recovery paths.

## Dialog and destructive action safety

- Dialogs do not close from backdrop clicks.
- Dialogs do not close from Escape.
- Users leave through visible close, cancel, save, or confirmation actions.
- Unsaved changes require an explicit discard confirmation.
- Important deletion, credential removal, and authentication disconnect actions require confirmation.
- The default focus is the safe action, never the destructive action.
- Session deletion keeps its existing inline confirmation.

## Motion

- Use 150–220ms state-driven transitions.
- Support `prefers-reduced-motion`.
- Do not gate content visibility on animation.
- Do not introduce ReactBits or another motion dependency without a separate, approved evaluation.
- No particles, 3D backgrounds, magnetic controls, cursor trails, or marketing text animation.

## Implementation discipline

- Reuse `src/components/ui` before creating primitives.
- Keep visual values in semantic tokens.
- Preserve Server Component boundaries and keep client boundaries narrow.
- Keep English and Chinese dictionaries synchronized.
- Verify the affected workflow with tests, `npm run check`, `npm run build`, and the browser when available.

## Success criteria

The result should be more coherent and recognizable without changing how the product works. It should retain the density and familiarity of a developer tool while gaining clearer hierarchy through softened monochrome color, limited serif display type, and linear structure.
</design-system>
