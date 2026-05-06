## 2024-04-30 - Form Accessibility in Authentication
**Learning:** Found that auth forms without proper `htmlFor` label associations and `autoComplete` attributes lead to poor password manager integration and create barriers for screen reader users trying to navigate the form inputs efficiently.
**Action:** Always pair `<label htmlFor="id">` with `<input id="id">` and explicitly define `autoComplete` (e.g., `email`, `new-password`) to enhance browser native UX.

## 2024-05-02 - Accordion/Toggle Accessibility
**Learning:** Icon-only accordion toggles need more than just visual cues. Without `aria-expanded` and `aria-controls`, screen readers don't understand the relationship between the button and the panel it toggles.
**Action:** Always add `aria-expanded` (boolean), `aria-controls` (panel ID), and a descriptive `aria-label` to expandable section toggle buttons.
## 2024-05-05 - Missing Aria Label on Icon-only button
**Learning:** The "Like" button (👍) on mural messages was implemented as an icon-only button without an `aria-label`, making its purpose unclear to screen reader users. Also, since it acts as a toggle, the label should reflect the current state (e.g., "Like message" vs. "Unlike message").
**Action:** When adding icon-only buttons, especially those that toggle state, ensure an `aria-label` is provided and dynamically updated to reflect the action the button will perform in its current state. Add appropriate translation strings to the `.json` files.

## 2024-05-06 - Loading States for Primary Actions
**Learning:** Found that primary async submit buttons (like "Create Event" and "Sign In/Up") provided only a static text change (e.g., to "Loading...") during submission. This lacked sufficient visual feedback, potentially leaving users unsure if the system was actively processing their request.
**Action:** When an action requires waiting (e.g., form submissions, authentication), replace the static text-only loading state with a combination of an animated spinner and text. This visible animated feedback improves user confidence that their action is being processed.
