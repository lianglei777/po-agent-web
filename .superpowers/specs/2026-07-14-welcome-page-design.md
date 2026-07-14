# Welcome Page Design

## Goal

Replace the decorative empty-chat welcome treatment with a useful welcome page that introduces Po Agent Web's core capabilities without becoming a rigid onboarding wizard.

The page must help first-time users discover setup paths while remaining useful whenever an empty conversation is shown.

## Visual Direction

Use the approved three-card layout:

- A centered, restrained welcome heading and one-line description.
- Three equal feature cards for Model Provider, Skills, and starting a conversation.
- Each card uses a medium Lucide icon as a visual anchor, followed by its title, concise description, lightweight status, and explicit action label.
- Use `server-cog` for Model Provider, `puzzle` for Skills, and `message-square-plus` for starting a conversation.
- Keep spacing balanced: icons remain visible, but cards must not reserve a large decorative icon area or fixed empty space.
- A single quiet line below the cards introduces history, the File Workspace, and session branches without turning them into more cards or actions.

Follow existing semantic tokens and shared UI primitives. Remove the current neon slice, gradients, text shadows, and looping welcome animation.

## Content

The page communicates these primary capabilities:

1. **Model Provider** — configure providers, credentials, and user-selected models.
2. **Skills** — install, load, and manage skills for the current project.
3. **Start conversation** — focus the existing composer and begin an agent task in the current project.

Secondary copy mentions that users can restore historical sessions, browse and preview files, and inspect session branches.

All user-visible copy must exist in both English and Chinese dictionaries.

## Dynamic States

Dynamic status is deliberately lightweight and based only on state already available to the workspace:

- Model Provider shows whether models are available and may show the configured model count.
- No model name is hard-coded. Any displayed model name or count comes from the user's current configuration.
- Skills shows whether a project is selected. It does not fetch the skills list merely to render the welcome page.
- Start conversation shows whether the current project and model are ready.

Missing setup changes the status text and action emphasis. It does not introduce progress percentages, completion tracking, persisted onboarding state, numbered steps, or forced ordering.

## Interaction

- Model Provider navigates to the existing Model Provider workspace view.
- Skills navigates to the existing Skills workspace view. When no project is selected, its action is unavailable and the card shows the specific requirement in visible status text and on hover/focus.
- Start conversation focuses the existing chat composer when both a project and model are ready. Otherwise its action is unavailable and shows the specific missing requirement. It does not create a second session flow or automatically submit text.
- Cards are semantic keyboard-accessible controls with visible focus states and clear accessible names.
- Hover and focus change tone only and do not move card geometry.

## Component Boundaries

- Keep the welcome UI in the chat feature.
- Keep workspace-view navigation in `AgentWorkspace`; pass narrowly scoped callbacks and required status data into `ChatCenter` or the welcome component.
- Do not import layouts or server modules into the chat feature.
- Reuse existing model/controller state, workspace project state, icons, tokens, and controls.
- Do not add a new onboarding service, context, persistence layer, or API endpoint.

## Error and Loading Behavior

- While model state is loading, show neutral status copy rather than briefly claiming that no model is configured.
- If existing model discovery fails, preserve the owning workflow's current error handling; the welcome page remains a navigation surface and does not duplicate detailed errors.
- Navigation continues to use the workspace's existing confirmation rules for unsaved Model Provider changes.

## Responsive and Accessibility Requirements

- Support the product's desktop widths of 1024px, 1440px, and 1920px.
- Keep all three cards readable at supported widths; stack only if the available center pane becomes too narrow.
- Preserve light and dark theme behavior, WCAG AA contrast, keyboard navigation, visible focus, semantic labels, and reduced-motion preferences.
- The replacement contains no non-essential animation.

## Verification

- Add or update a focused UI/component test for card actions and meaningful dynamic-state branches if the current test setup supports interaction tests.
- Update i18n shape tests for the new English and Chinese strings.
- Verify the empty-session workflow in the browser for configured and unconfigured model states and with and without a selected project.
- Run `npm run check` and, because this changes Next.js-rendered UI, `npm run build` before handoff.

## Out of Scope

- Starter prompts or prompt templates.
- A guided tour, modal wizard, checklist, progress bar, completion percentage, or dismissible onboarding state.
- Fetching Skills solely to show a count on the welcome page.
- Hard-coded provider or model names.
- New backend capabilities or public API changes.
