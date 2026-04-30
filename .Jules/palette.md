## 2024-04-30 - Form Accessibility in Authentication
**Learning:** Found that auth forms without proper `htmlFor` label associations and `autoComplete` attributes lead to poor password manager integration and create barriers for screen reader users trying to navigate the form inputs efficiently.
**Action:** Always pair `<label htmlFor="id">` with `<input id="id">` and explicitly define `autoComplete` (e.g., `email`, `new-password`) to enhance browser native UX.
