# qualiguide

## Known issues and recommendations

1. **Survey routing tied to display strings (current bug fixed in `js/surveyFlow.js`).**
   * The first survey question compares the visitor’s answer against hard-coded labels such as "Local universities (NUS, NTU, SMU, SIT, SUTD, SUSS)" and "Overseas tertiary institutions" to decide the next step (`next()` inside `surveyFlow[0]`). Because the option text and branching logic must match character-for-character, any copy edit breaks the routing (e.g., the overseas path previously pointed to `null`).
   * **Recommendation:** Define the options as `{ label, value }` pairs (similar to the qualification dropdown) and switch on the stable `value`, not the text. This ensures content tweaks do not silently break the flow.

2. **No fallback when an unexpected answer reaches a `next` function.**
   * Several `next` handlers in `js/surveyFlow.js` return `null` for unknown answers, which leaves the UI on the same screen with no feedback (`renderStep` simply does nothing). This could happen if future changes introduce or rename options but forget to update the switch statement.
   * **Recommendation:** Provide a defensive fallback (e.g., default to the safest branch or show an inline error) so the visitor is never stuck even if content drifts.

3. **Transfer-to-qualification guard rails are duplicated in `js/main.js`.**
   * The submit handler contains special-case logic that duplicates flow decisions (e.g., forcing foreigners who pick local qualifications onto the transfer end page). This logic is unaware of the newer `nationality_local_transfer` step and may become stale as the questionnaire evolves.
   * **Recommendation:** Move these routing rules back into `surveyFlow.js` where all branching lives so there is a single source of truth and new steps stay in sync.
