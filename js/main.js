// -------------------------------
// main.js (final patched)
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const quizContainer = document.getElementById("quizContainer");
  const quizForm = document.getElementById("quizForm");
  const continueBtn = document.getElementById("continueBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");
  const pageTitle = document.getElementById("pageTitle"); // unused for end pages
  const formActions = document.querySelector(".form-actions");
  const restartBtn = document.getElementById("restartBtn");

  // Detect coarse (touch) pointers (mobile/tablet)
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  // feature detect :has()
  try {
    if (!CSS.supports("selector(:has(*))")) document.documentElement.classList.add("no-has");
  } catch {
    document.documentElement.classList.add("no-has");
  }

  if (!Array.isArray(window.surveyFlow) || window.surveyFlow.length === 0) {
    quizContainer.innerHTML = "<p>We’re sorry, something went wrong loading the survey. Please refresh.</p>";
    continueBtn.style.display = "none";
    downloadPdfBtn.style.display = "none";
    return;
  }

  let currentStepId = window.surveyFlow[0].id;
  const answers = {};
  const flowMap = {};
  window.surveyFlow.forEach(q => (flowMap[q.id] = q));

  // ----- helpers
  function setQuestionScrollMode() {
    quizContainer.classList.remove("final-scroll", "final-mode");
    // keep visible so the expanded dropdown can overlay (desktop),
    // and allow the container to scroll on mobile via CSS media rules
    quizContainer.style.removeProperty("overflow-y");
    formActions.classList.remove("final-actions");
    const dateEl = document.getElementById("actionsDate");
    if (dateEl) dateEl.style.display = "none";
  }

  function setFinalScrollMode() {
    quizContainer.classList.add("final-scroll", "final-mode");
    quizContainer.style.overflowY = "auto";
    formActions.classList.add("final-actions");
  }

  function setPageTitleHTML(qualification) {
    const titleHtml = String(qualification.name).replace(/\s*\/\s*/g, "/<wbr> ");
    return `
      <div class="page-title-block">
        <h2 class="page-title" tabindex="-1">${titleHtml}</h2>
      </div>
    `;
  }

  function getAudience() {
    // Prefer new local-universities nationality answer; then transfer; then general
    const raw =
      answers["nationality_local_transfer"] ||
      answers["nationality_transfer"] ||
      answers["nationality"] ||
      null;

    if (raw === "Foreigner") return "foreigner";
    if (raw === "Singapore Citizen/ Singapore Permanent Resident") return "sgpr";
    return null; // unknown/edge case
  }

  function formatToday() {
    try {
      return new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Singapore" });
    } catch {
      return new Date().toDateString();
    }
  }

  function ensureDateLabel() {
    let dateEl = document.getElementById("actionsDate");
    if (!dateEl) {
      dateEl = document.createElement("div");
      dateEl.id = "actionsDate";
      dateEl.className = "actions-date";
      const inner = formActions.querySelector(".actions-inner") || formActions;
      inner.prepend(dateEl); // <--- prepend inside actions-inner
    }
    dateEl.textContent = `Date: ${formatToday()}`;
    dateEl.style.display = "block";
  }

  // Collapse any other open dropdowns (desktop overlay select)
  function closeAllDropdowns(exceptEl = null) {
    document.querySelectorAll("select.dropdown.dropdown-open").forEach(sel => {
      if (sel !== exceptEl) {
        if (typeof sel._collapseDropdown === "function") {
          sel._collapseDropdown();
        } else {
          sel.classList.remove("dropdown-open", "dropdown-open-up");
          sel.removeAttribute("size");
        }
      }
    });
  }

  function renderQualificationContent(qualification, audience) {
    const templates = window.templates || {};
    const templateMap = {
      international: templates.internationalQualificationTemplate,
      local: templates.localQualificationTemplate,
      transfer: templates.transferTemplate
    };

    const templateFn = templateMap[qualification.type];
    if (typeof templateFn === "function") {
      return templateFn(qualification, { audience });
    }

    if (typeof templates.defaultQualificationTemplate === "function") {
      return templates.defaultQualificationTemplate(qualification, { audience });
    }

    const fallbackName = qualification?.name || "Selected qualification";
    return `<div class="info-card"><p>${fallbackName}</p></div>`;
  }

  // ----- renderers
  function followNextStepId(nextStepId) {
    if (!nextStepId) {
      console.warn("No next step resolved; restarting survey.");
      renderStep(window.surveyFlow[0].id);
      return;
    }

    if (nextStepId?.startsWith?.("end_")) {
      renderEndPage(nextStepId.replace("end_", ""));
    } else {
      renderStep(nextStepId);
    }
  }

  function resolveNextStep(step, selectedValue) {
    if (!step) return null;
    let target = typeof step.next === "function" ? step.next(selectedValue, answers) : step.next;

    if (!target && step.fallback) {
      target = typeof step.fallback === "function" ? step.fallback(selectedValue, answers) : step.fallback;
    }

    return target || null;
  }

  function normalizeOption(option) {
    if (typeof option === "string") {
      return { label: option, value: option };
    }

    if (option && typeof option === "object") {
      const rawLabel = option.label ?? option.value ?? "";
      const rawValue = option.value ?? option.label ?? "";
      return { label: String(rawLabel), value: String(rawValue) };
    }

    return { label: "", value: "" };
  }

  function renderStep(stepId) {
    const step = flowMap[stepId];
    if (!step) return;

    closeAllDropdowns();
    currentStepId = stepId;
    document.getElementById("pdfStatus").textContent = "";

    if (pageTitle) pageTitle.innerHTML = "";
    setQuestionScrollMode();

    quizContainer.innerHTML = "";

    // --- Show/hide restart ---
    if (restartBtn) {
      if (stepId === window.surveyFlow[0].id) {
        restartBtn.style.display = "none"; // hide on very first page
      } else {
        restartBtn.style.display = "inline-block"; // show afterwards
      }
    }

    const questionLabel = document.createElement("h2");
    questionLabel.id = "currentQuestion";
    questionLabel.tabIndex = -1;
    questionLabel.className = "question-label";
    questionLabel.textContent = step.question;
    quizContainer.appendChild(questionLabel);

    // Subtitle (optional)
    if (step.subtitle) {
      const subtitleEl = document.createElement("div");
      subtitleEl.className = "question-subtitle";
      subtitleEl.textContent = step.subtitle;
      quizContainer.appendChild(subtitleEl);
    }

    if (!step.options || step.options.length === 0) {
      followNextStepId(resolveNextStep(step));
      return;
    }

    if (stepId === "qualification") {
      // wrapper to allow overlay expansion (desktop)
      const wrap = document.createElement("div");
      wrap.className = "select-wrap";

      const select = document.createElement("select");
      select.name = "userAnswer";
      select.className = "dropdown";
      select.setAttribute("aria-label", "Select your qualification");

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "-- Select your qualification --";
      select.appendChild(defaultOption);

      step.options.forEach(opt => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
      });

      // ==== Expand-on-focus behavior (DESKTOP ONLY) ====
      if (!isTouch) {
        const ROW_HEIGHT = 34; // for flip decision only
        const V_PADDING = 16;

        const handleOutsidePointer = (event) => {
          if (!wrap.contains(event.target)) collapse();
        };

        const detachOutsideListener = () => {
          document.removeEventListener("pointerdown", handleOutsidePointer);
        };

        const attachOutsideListener = () => {
          detachOutsideListener();
          document.addEventListener("pointerdown", handleOutsidePointer, { passive: true });
        };

        const collapse = () => {
          select.classList.remove("dropdown-open", "dropdown-open-up");
          select.removeAttribute("size"); // restore native single-row
          detachOutsideListener();
        };

        select._collapseDropdown = collapse;

        const expand = () => {
          if (select.classList.contains("dropdown-open")) return;

          closeAllDropdowns(select);

          const rows = Math.min(10, Math.max(1, select.options.length));
          const desiredHeight = rows * ROW_HEIGHT + V_PADDING;

          const rect = select.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;

          const openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow;

          select.setAttribute("size", String(rows));
          select.classList.add("dropdown-open");
          if (openUp) select.classList.add("dropdown-open-up");
          else select.classList.remove("dropdown-open-up");
          attachOutsideListener();
        };

        // Open on focus/click
        select.addEventListener("focus", expand);
        select.addEventListener("click", () => {
          if (!select.classList.contains("dropdown-open")) expand();
        });

        // Collapse on change/blur
        select.addEventListener("change", collapse);
        select.addEventListener("blur", () => setTimeout(collapse, 0));

        // Keyboard support
        select.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            collapse();
            select.blur();
          } else if (e.key === "Enter") {
            collapse();
          }
        });
      }
      // (On touch, we rely on the native picker—no custom listeners)

      wrap.appendChild(select);
      quizContainer.appendChild(wrap);
    } else {
      const optionsDiv = document.createElement("div");
      optionsDiv.className = "options-list";
      optionsDiv.setAttribute("role", "radiogroup");
      optionsDiv.setAttribute("aria-labelledby", "currentQuestion");

      step.options.forEach(opt => {
        const normalized = normalizeOption(opt);
        const optionDiv = document.createElement("div");
        optionDiv.className = "option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = "userAnswer";
        input.value = normalized.value;
        const safeId = String(normalized.value || normalized.label)
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9\-]/g, "");
        input.id = `${stepId}-${safeId}`;

        const label = document.createElement("label");
        label.textContent = normalized.label;
        label.setAttribute("for", input.id);

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        optionsDiv.appendChild(optionDiv);
        optionDiv.addEventListener("click", () => (input.checked = true));
      });

      quizContainer.appendChild(optionsDiv);
    }

    continueBtn.style.display = "block";
    downloadPdfBtn.style.display = "none";
    quizContainer.scrollTop = 0;
    questionLabel.focus({ preventScroll: true });
  }

  function renderEndPage(qualificationId) {
    closeAllDropdowns();
    const allQuals = window.qualificationsData || [];
    const qualification =
      allQuals.find(q => q.id === qualificationId) ||
      (qualificationId === "transfer" ? allQuals.find(q => q.type === "transfer") : null);

    if (!qualification) {
      quizContainer.innerHTML = "<p>Qualification not found.</p>";
      continueBtn.style.display = "none";
      downloadPdfBtn.style.display = "none";
      return;
    }

    // --- Show restart button ---
    if (restartBtn) restartBtn.style.display = "inline-block";

    const headerHTML = setPageTitleHTML(qualification);
    const audience = getAudience();
    const contentHTML = renderQualificationContent(qualification, audience);

    quizContainer.innerHTML = headerHTML + contentHTML + `
      <p class="review-note">${window.admissionsCycle.academicYear} · Dates reviewed: ${window.admissionsCycle.lastReviewed} ·
      <a href="${window.admissionsCycle.source}" target="_blank" rel="noopener noreferrer">Check current NUS dates</a></p>`;

    // end-page actions
    setFinalScrollMode();
    ensureDateLabel();
    downloadPdfBtn.style.display = "inline-block";
    quizContainer.querySelector(".page-title").focus({ preventScroll: true });
    continueBtn.style.display = "none";
    quizContainer.scrollTop = 0;
  }

  // ----- events
  quizForm.addEventListener("submit", e => {
    e.preventDefault();

    const selectEl = quizContainer.querySelector('select[name="userAnswer"]');
    let selected = null;

    if (selectEl) {
      selected = selectEl.value;
      if (!selected) return alert("Please select an option.");
    } else {
      const selectedInput = quizContainer.querySelector('input[name="userAnswer"]:checked');
      if (!selectedInput) return alert("Please select an option.");
      selected = selectedInput.value;
    }

    // Save the answer for the current step
    answers[currentStepId] = selected;

    // Default next-step logic
    const step = flowMap[currentStepId];
    followNextStepId(resolveNextStep(step, selected));
  });

  // PDF: capture a dated copy without changing the live scroll layout.
  downloadPdfBtn.addEventListener("click", async () => {
    const status = document.getElementById("pdfStatus");
    if (typeof html2pdf === "undefined") {
      status.textContent = "PDF download is unavailable. Please check your connection and try again.";
      return;
    }
    downloadPdfBtn.disabled = true;
    status.textContent = "Preparing PDF…";
    const exportContent = quizContainer.cloneNode(true);
    exportContent.removeAttribute("id");
    exportContent.className = "pdf-export";
    const date = document.createElement("p");
    date.textContent = `Generated: ${formatToday()} (Singapore time)`;
    exportContent.prepend(date);
    try {
      await html2pdf().set({
        margin: 0.5,
        filename: "NUS_Qualification_Guide.pdf",
        html2canvas: { scale: 2, useCORS: true, windowWidth: 1100 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: [".resource-card", ".notice-card", ".login-card"] }
      }).from(exportContent).save();
      status.textContent = "PDF download ready.";
    } catch (error) {
      status.textContent = "PDF download failed. Please select Download PDF to retry.";
      console.error("PDF export failed", error);
    } finally {
      downloadPdfBtn.disabled = false;
    }
  });

  // init
  renderStep(currentStepId);

  // Restart survey
  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      // reset answers and flow
      for (const k in answers) delete answers[k];
      currentStepId = window.surveyFlow[0].id;
      renderStep(currentStepId);
    });
  }
});
