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

## 2024-05-09 - Inline Loading States for Asynchronous Actions
**Learning:** Replacing full-page loading flashes with inline loaders directly on action buttons (e.g., 'Draw Secret Santa' or 'Join Event') significantly improves the perceived performance and provides clearer context without disrupting the user's focus.
**Action:** Always implement local loading states inside controllers instead of relying solely on a global page loading state to handle feedback for primary interactions.

## 2024-05-10 - Local Date Formatting for Input Min Constraints
**Learning:** Using `new Date().toISOString().split("T")[0]` for `min` attributes in `<input type="date">` is prone to UTC timezone offset bugs depending on the user location and the time of day, potentially disabling the current day improperly.
**Action:** Use `new Date().toLocaleDateString("en-CA")` to format dates consistently into `YYYY-MM-DD` while respecting the local browser timezone to accurately enforce "today".

## 2024-05-11 - Input Labels with Aria
**Learning:** Form inputs that lack visual `<label>` elements, like chat inputs or inline group additions, create an inaccessible experience. Placeholders are insufficient as they disappear when typing and are often skipped by screen readers.
**Action:** When a visible `<label>` is not present, always provide an `aria-label` on the `<input>` element to explicitly describe its purpose to screen readers.

## 2024-05-12 - Explicit ARIA Labels for Placeholder-Only Inputs
**Learning:** Found multiple inputs and textareas (e.g., Wishlist, Exclusion Groups, Mural Messages, Chat Messages) that relied exclusively on the `placeholder` attribute for context. `placeholder` text is frequently skipped by screen readers or provides insufficient context, making it an accessibility anti-pattern.
**Action:** Always ensure that inputs without a visible `<label>` element have an explicit `aria-label` attribute to properly communicate their purpose to assistive technologies.

## 2024-05-14 - Empty State Inline CTA & Visual Boundaries
**Learning:** Empty states without immediate, actionable buttons force users to hunt for the primary action (e.g., searching for a generic "Create" button at the top of the page). Without clear visual boundaries, the empty state can feel like missing content rather than an intentional space.
**Action:** When designing empty states, always include a distinct visual boundary (like a dashed border) to indicate intentional emptiness, and provide a clear, inline Call-To-Action (CTA) button directly within the empty state container to guide the user's next step immediately.

## 2026-05-14 - Added aria-hidden to decorative icons
**Learning:** In standard icon component wrappers (like MSO used across the app), screen readers will announce the icon name (e.g., 'visibility') unless explicitly hidden, causing confusing screen reader output for interactive elements that already have text labels.
**Action:** Always ensure that decorative icon fonts have `aria-hidden="true"` by default in their base wrapper component.

## 2024-05-15 - Empty State Visual Boundaries and Inline CTAs
**Learning:** Empty states without a defined boundary blend into the surrounding layout, failing to clearly signal an intentional lack of content. Furthermore, requiring users to locate a global CTA (like a floating button) from within an empty state increases cognitive load.
**Action:** Always wrap empty states in a clear visual boundary (such as a dashed border) and include an inline Call-To-Action directly within the empty state container to guide the user's immediate next step.
## 2024-05-16 - Empty State Actionability
**Learning:** Empty states without immediate, inline calls-to-action force users to search the interface for the appropriate "create" or "add" button. This increases cognitive load and friction for new or onboarding users.
**Action:** When designing empty states (like "No Events"), always include a distinct visual boundary (like a dashed border) to indicate intentional emptiness, and provide a clear, inline Call-To-Action (CTA) button directly within the empty state container to guide the user's next step immediately.

## 2024-05-17 - Actionable Empty States
**Learning:** Empty states (like 'No Events' on the dashboard) without a clear visual boundary and a direct inline Call-To-Action (CTA) can leave users confused about what to do next, increasing cognitive load.
**Action:** When designing empty states, always include a distinct visual boundary (like a dashed border) to indicate intentional emptiness, and provide an inline CTA button directly within the empty state container to guide the user's next step. Update related UI test queries (e.g. using `getAllByText`) when this creates duplicate CTA buttons on the same page.

## 2024-05-18 - Avoid Redundant `aria-label`s on Navigation Buttons
**Learning:** Adding an `aria-label` to a button that already contains visible, descriptive text (e.g., `<span className="font-label">{t("dashboard.nav_events")}</span>`) is an accessibility anti-pattern. Screen readers will read the `aria-label` and potentially the visible text as well, creating redundant noise. Instead, purely decorative elements within the button (like SVGs) should be hidden with `aria-hidden="true"`, allowing the screen reader to naturally read the existing visible text.
**Action:** Do not duplicate visible text in `aria-label` attributes. Prioritize hiding decorative visual elements with `aria-hidden="true"` rather than overriding the entire container's label.
