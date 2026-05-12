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
<<<<<<< palette-date-input-min-constraint-3059481754099253844
## 2024-05-18 - Local Date Formatting for Input Min Constraints
**Learning:** Using `new Date().toISOString().split("T")[0]` for `min` attributes in `<input type="date">` is prone to UTC timezone offset bugs depending on the user location and the time of day, potentially disabling the current day improperly.
**Action:** Use `new Date().toLocaleDateString("en-CA")` to format dates consistently into `YYYY-MM-DD` while respecting the local browser timezone to accurately enforce "today".
=======

## 2024-05-09 - Inline Loading States for Asynchronous Actions
**Learning:** Replacing full-page loading flashes with inline loaders directly on action buttons (e.g., 'Draw Secret Santa' or 'Join Event') significantly improves the perceived performance and provides clearer context without disrupting the user's focus.
**Action:** Always implement local loading states inside controllers instead of relying solely on a global page loading state to handle feedback for primary interactions.
>>>>>>> main
