// -------------------------------
// surveyFlow.js (updated)
// -------------------------------

const TYPE_ORDER = { local: 0, international: 1 };
const GROUP_LABELS = {
  local: "Local Qualifications",
  international: "International Qualifications"
};

function normalizeQualificationList(list) {
  const collator = typeof Intl !== "undefined" && typeof Intl.Collator === "function"
    ? new Intl.Collator("en", { sensitivity: "base" })
    : null;
  return list
    .filter(q => q && q.id !== "transfer")
    .sort((a, b) => {
      const typeOrder = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
      if (typeOrder !== 0) return typeOrder;
      const aName = String(a.name || "");
      const bName = String(b.name || "");
      return collator ? collator.compare(aName, bName) : aName.localeCompare(bName);
    });
}

// Build the full list of qualifications (excluding Transfer)
function buildAllQualificationsList() {
  const local = Array.isArray(window.localQualifications) ? window.localQualifications : [];
  const international = Array.isArray(window.internationalQualifications) ? window.internationalQualifications : [];

  return normalizeQualificationList([...local, ...international]);
}

function mapQualificationOptions(list) {
  return list.map(q => ({
    label: q.name,
    value: q.id,
    group: GROUP_LABELS[q.type] || null
  }));
}

// -------------------------------
// Survey Flow
// -------------------------------
let cachedQualifications = buildAllQualificationsList();

const surveyFlow = [
  {
    id: "transfer",
    question: "Are you currently studying in a tertiary institution OR have enrolled in OR graduated from a tertiary institution?",
    subtitle: "Tertiary institutions refer to universities and colleges of higher education, and does not include polytechnics and the Institute of Technical Education (ITE) in Singapore.",
    options: [
      "Local universities (NUS, NTU, SMU, SIT, SUTD, SUSS)",
      "Overseas tertiary institutions",
      "I have never enrolled in a university OR tertiary institution before"
    ],
    next: function(answer){ 
      switch (answer) {
        case "Local universities (NUS, NTU, SMU, SIT, SUTD, SUSS)":
          // NEW: branch to a dedicated nationality step that always lands on Transfer
          return "nationality_local_transfer";
        case "Overseas tertiary institutions":
          // Existing overseas branch
          return "nationality_transfer";
        case "I have never enrolled in a university OR tertiary institution before":
          return "nationality";
        default:
          return null;
      }
    }
  },

  // NEW: Local-universities branch → ask nationality → always go to Transfer end page
  {
    id: "nationality_local_transfer",
    question: "What is your nationality?",
    options: [
      "Singapore Citizen/ Singapore Permanent Resident", 
      "Foreigner"
    ],
    next: function(/* answer */){
      // Both answers lead to Transfer end page;
      // audience-aware login text will use this answer.
      return "end_transfer";
    }
  },

  // Overseas Transfer → nationality check
  {
    id: "nationality_transfer",
    question: "What is your nationality?",
    options: [
      "Singapore Citizen/ Singapore Permanent Resident", 
      "Foreigner"
    ],
    next: function(answer){
      switch (answer) {
        case "Singapore Citizen/ Singapore Permanent Resident":
          return "end_transfer";
        case "Foreigner":
          return "qualification";
        default:
          return null;
      }
    }
  },

  // Non-transfer applicants nationality
  {
    id: "nationality",
    question: "What is your nationality?",
    options: [
      "Singapore Citizen/ Singapore Permanent Resident", 
      "Foreigner"
    ],
    next: function(){ 
      return "qualification"; 
    }
  },

  // Qualifications selection (ID-based)
  {
    id: "qualification",
    question: "What qualification will you be using to apply to the National University of Singapore (NUS)?",
    options: mapQualificationOptions(cachedQualifications),
    next: function(answerId){
      const pool = cachedQualifications.length ? cachedQualifications : buildAllQualificationsList();
      const qual = pool.find(q => q.id === answerId);
      if (!qual) {
        console.warn("Selected qualification not found:", answerId);
        return null;
      }
      return "end_" + qual.id;
    }
  }
];

function refreshSurveyQualificationOptions() {
  cachedQualifications = buildAllQualificationsList();
  const qualificationStep = surveyFlow.find(step => step.id === "qualification");
  if (qualificationStep) {
    qualificationStep.options = mapQualificationOptions(cachedQualifications);
  }
  return cachedQualifications;
}

refreshSurveyQualificationOptions();

// Expose to global
window.surveyFlow = surveyFlow;
window.getSurveyQualifications = function() {
  return cachedQualifications.slice();
};
window.refreshSurveyQualificationOptions = function() {
  return refreshSurveyQualificationOptions().slice();
};

