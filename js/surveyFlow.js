// -------------------------------
// surveyFlow.js (updated)
// -------------------------------

// Build the full list of qualifications (excluding Transfer)
const allQualifications = [
  ...(window.localQualifications || []),
  ...(window.internationalQualifications || [])
].filter(q => q.id !== "transfer");

// Debugging: log qualifications
console.log(
  "All qualifications for dropdown:",
  allQualifications.map(q => q.name)
);

// -------------------------------
// Survey Flow
// -------------------------------
const TRANSFER_OPTIONS = [
  {
    label: "Local universities (NUS, NTU, SMU, SIT, SUTD, SUSS)",
    value: "local_universities"
  },
  {
    label: "Overseas tertiary institutions",
    value: "overseas_institutions"
  },
  {
    label: "I have never enrolled in a university OR tertiary institution before",
    value: "never_enrolled"
  }
];

const surveyFlow = [
  {
    id: "transfer",
    question: "Are you currently studying in a tertiary institution OR have enrolled in OR graduated from a tertiary institution?",
    subtitle: "Tertiary institutions refer to universities and colleges of higher education, and does not include polytechnics and the Institute of Technical Education (ITE) in Singapore.",
    options: TRANSFER_OPTIONS,
    fallback: "nationality",
    next: function(answerValue){
      switch (answerValue) {
        case "local_universities":
          // NEW: branch to a dedicated nationality step that always lands on Transfer
          return "nationality_local_transfer";
        case "overseas_institutions":
          // Existing overseas branch
          return "nationality_transfer";
        case "never_enrolled":
          return "nationality";
        default:
          return this.fallback;
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
    fallback: "end_transfer",
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
    fallback: "qualification",
    next: function(answer){
      switch (answer) {
        case "Singapore Citizen/ Singapore Permanent Resident":
          return "end_transfer";
        case "Foreigner":
          return "qualification";
        default:
          return this.fallback;
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
    fallback: "qualification",
    next: function(){
      return "qualification";
    }
  },

  // Qualifications selection (ID-based)
  {
    id: "qualification",
    question: "What qualification will you be using to apply to the National University of Singapore (NUS)?",
    options: allQualifications.map(q => ({ label: q.name, value: q.id })),
    fallback: "transfer",
    next: function(answerId, answers){
      const qual = allQualifications.find(q => q.id === answerId);
      if (!qual) {
        console.warn("Selected qualification not found:", answerId);
        return typeof this.fallback === "function" ? this.fallback() : this.fallback;
      }

      const transferNationality = answers?.nationality_transfer;
      if (transferNationality === "Foreigner" && qual.type === "local") {
        return "end_transfer";
      }
      return "end_" + qual.id;
    }
  }
];

// Expose to global
window.surveyFlow = surveyFlow;
