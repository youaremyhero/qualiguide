# QualiGuide Quiz

QualiGuide is a lightweight web quiz that helps prospective students discover which qualification pathways to the National University of Singapore (NUS)  best match their profile. By answering a short series of multiple-choice questions on student status, nationality, and current qualifications, visitors receive tailored guidance on what category they should use when applying to NUS and receive a list of applicable resources.

## How the quiz works
- **Step-by-step flow:** Each question appears on its own screen, keeping the experience focused and mobile friendly.
- **Adaptive routing:** The quiz dynamically branches based on your answers so that only relevant follow-up questions appear.
- **Actionable results:** At the end of the flow, users are shown next steps, such as the category they should use to apply to NUS and a list of customised resources based on their selection.

## Useful details
- **Technology stack:** Static HTML, CSS, and vanilla JavaScript (see `index.html`, `css/`, and `js/`).
- **Customization:** Update the question content and branching logic inside `js/surveyFlow.js`; UI tweaks live in `css/style.css`.
- **Running locally:** Open `index.html` in any modern browser—no build tools or servers required.

Feel free to adapt the question flow or styling to match your organization’s admissions guidance needs. :)

Created by a NUS employee with time to spare using ChatGPT and Codex.
