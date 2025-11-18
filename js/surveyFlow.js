// -------------------------------
// surveyFlow.js (updated)
// -------------------------------

// Build the full list of qualifications (excluding Transfer)
const allQualifications = [
  ...(window.localQualifications || []),
  ...(window.internationalQualifications || [])
].filter(q => q.id !== "transfer");

// -------------------------------
// Survey Flow
// -------------------------------
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
      switch (answer) {␊
        case "Local universities (NUS, NTU, SMU, SIT, SUTD, SUSS)":␊
          // NEW: branch to a dedicated nationality step that always lands on Transfer␊
          return "nationality_local_transfer";␊
        case "Overseas tertiary institutions":
          // Existing overseas branch␊
          return "nationality_transfer";␊
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
