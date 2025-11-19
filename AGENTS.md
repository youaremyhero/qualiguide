# AGENTS

This repository hosts the QualiGuide single-page quiz (static HTML, CSS, and vanilla JavaScript). Use this file as a quick-reference checklist before making changes.

## Repository map
- `index.html` contains the DOM skeleton plus the restart logic loaded at the bottom of the page.
- `css/styles.css` holds all layout and visual rules; it is organized into commented sections (Reset, Header, Form, etc.).
- `js/` is split by responsibility:
  - `surveyFlow.js` owns the step-by-step logic and branching.
  - `main.js` renders the UI, wires events, and exposes helper utilities such as PDF download handling.
  - `qualifications.js` and `resources.js` store content/data. They only attach objects to `window.*`.
  - `template.js` provides templating helpers used by `main.js`.

## Editing guidelines
1. **Formatting**
   - Use **two spaces** for indentation in HTML, CSS, and JS.
   - Prefer double quotes for HTML attributes and JavaScript strings to match the existing style.
   - Keep section divider comments (`// -------------------------------`) when adding large blocks.
2. **JavaScript**
   - Use `const`/`let`; avoid `var` unless absolutely necessary for compatibility.
   - Keep functions small and pure when possible. Store shared helpers near the top of `main.js`.
   - When extending `surveyFlow.js`, document new steps with inline comments, keep IDs kebab-cased, and ensure every `next` path resolves to a valid `id` or `end_*` target.
3. **Data files**
   - In `js/qualifications.js`, keep the `localQualifications` and `internationalQualifications` arrays alphabetical by `name`. Each object should include `id`, `name`, `type`, and relevant metadata (timeline, resources, etc.).
   - If you introduce a new qualification `id`, also add a matching end-page template (via `template.js` or the data-driven renderer) so `main.js` can render the results without fallback text.
   - `resources.js` contains shared link groups; update labels/URLs there to avoid duplication.
4. **Styling**
   - Reuse the CSS custom properties defined in `:root` for spacing or sizing instead of hardcoding duplicate values.
   - Test layout changes on both desktop widths (>1024px) and narrow/mobile widths (~375px). The app uses fixed header/footer with a scrollable main area—avoid introducing new full-page scroll.
5. **Accessibility & UX**
   - Maintain accessible labels and focus order. Buttons should remain reachable via keyboard (Enter/Space) and clearly indicate focus (`:focus-visible`).
   - When adding links that open in a new tab, the global noopener script already sets `rel="noopener"`; no extra attributes are needed unless adding `noreferrer` for other reasons.

## Testing checklist
- Because this is a static site, the quickest way to preview is `python3 -m http.server 4173` (or any available port) from the repo root and open `http://localhost:<port>/index.html`.
- Exercise at least one happy path through the survey and confirm the PDF download button still works (html2pdf must load successfully from the CDN before `main.js`).
- Before committing, run `git status` to verify only intentional files changed.

## PR / summary expectations
When drafting summaries or PR descriptions, mention:
- Which question flow(s) or qualification datasets changed.
- Any UI/UX adjustments to header/footer/layout.
- Manual testing that was performed (e.g., "Tested international-to-IB path + PDF export in Chrome").
