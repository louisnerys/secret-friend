## 2024-04-30 - Form Accessibility in Authentication
**Learning:** Found that auth forms without proper `htmlFor` label associations and `autoComplete` attributes lead to poor password manager integration and create barriers for screen reader users trying to navigate the form inputs efficiently.
**Action:** Always pair `<label htmlFor="id">` with `<input id="id">` and explicitly define `autoComplete` (e.g., `email`, `new-password`) to enhance browser native UX.

## 2024-05-02 - Accordion/Toggle Accessibility
**Learning:** Icon-only accordion toggles need more than just visual cues. Without `aria-expanded` and `aria-controls`, screen readers don't understand the relationship between the button and the panel it toggles.
**Action:** Always add `aria-expanded` (boolean), `aria-controls` (panel ID), and a descriptive `aria-label` to expandable section toggle buttons.
## 2024-05-05 - Missing Aria Label on Icon-only button
**Learning:** The "Like" button (👍) on mural messages was implemented as an icon-only button without an `aria-label`, making its purpose unclear to screen reader users. Also, since it acts as a toggle, the label should reflect the current state (e.g., "Like message" vs. "Unlike message").
**Action:** When adding icon-only buttons, especially those that toggle state, ensure an `aria-label` is provided and dynamically updated to reflect the action the button will perform in its current state. Add appropriate translation strings to the `.json` files.

## 2024-05-07 - Loading State Feedback
**Learning:** Providing an animated visual indicator (like a spinner) alongside text changes for async button submissions offers stronger feedback than text changes alone, reducing user uncertainty during network latency.
**Action:** Always include an inline animated spinner (`animate-spin` SVG) alongside loading text in primary interactive buttons during asynchronous operations. Ensure proper alignment using flexbox (`flex items-center justify-center gap-2`).

## 2026-05-08 - Semantic HTML for Interactions
**Learning:** Implementing interactive elements (like cards and navigation items) as `<div>`s with `role="button"`, `tabIndex={0}`, and custom `onKeyDown` handlers breaks expected native accessibility behaviors like 'Open in new tab' functionality or default space/enter key interaction.
**Action:** Use native semantic elements (`<button>` or `<Link href="...">`) instead of ARIA roles on `<div>`s for interactive elements to retain complete keyboard and link navigation experiences automatically.

## 2024-05-11 - Input Labels with Aria
**Learning:** Form inputs that lack visual `<label>` elements, like chat inputs or inline group additions, create an inaccessible experience. Placeholders are insufficient as they disappear when typing and are often skipped by screen readers.
**Action:** When a visible `<label>` is not present, always provide an `aria-label` on the `<input>` element to explicitly describe its purpose to screen readers.
