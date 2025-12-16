// normalize text for comparison
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\*\:\?\(\)\[\]\-_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// keyword-based mapping
const FIELD_KEYWORDS = {
  email: ["email"],
  prn: ["prn", "university prn"],
  fullName: [
    "full name",
    "candidate name",
    "student name",
    "name of candidate",
  ],
  mobile: ["mobile", "phone", "contact number", "10 digits"],
  dob: ["date of birth", "dob", "birth"],
  gender: ["gender"],

  degree: ["degree"],
  branch: ["specialization", "branch", "stream"],
  college: ["college", "college name", "institute"],

  tenthPercent: ["10th", "ssc", "class 10"],
  twelfthPercent: ["12th", "hsc", "12th %", "diploma"],
  diplomaPercent: ["diploma %"],
  degreePercent: ["be%", "btech%", "degree %", "be b tech"],

  passYear: ["year of graduation", "passing year", "passout"],

  cocubesScore: ["cocubes"],

  codechefRating: ["codechef rating"],
  codechefLink: ["codechef profile"],

  hackerrankRating: ["hackerrank rating", "hackerrank star"],
  hackerrankLink: ["hackerrank profile"],

  leetcodeScore: ["leetcode score", "problem solved"],
  leetcodeLink: ["leetcode profile"],

  hackerearthRating: ["hackerearth rating"],
  hackerearthLink: ["hackerearth profile"],

  githubLink: ["github"],
  linkedinLink: ["linkedin"],

  hasTechnicalCourse: [
    "technical courses",
    "technical course",
    "certifications",
    "course certification",
  ],

  technicalCoursePlatform: [
    "from which agency",
    "platform you have done",
    "course platform",
    "certification platform",
    "udemy",
    "coursera",
  ],

  technicalCourseDuration: [
    "duration of the course",
    "course duration",
    "duration in hours",
    "hours",
  ],

  cgpa: ["cgpa", "current cgpa", "aggregate cgpa", "c g p a"],

  activeBacklogs: [
    "active backlogs",
    "current backlogs",
    "number of backlogs",
    "backlogs",
    "live backlogs",
  ],

  yearDown: ["year down", "gap year"],

  techAchievements: ["technical achievements"],
  personalAchievements: ["personal achievements"],
  projects: ["project"],
};

// map label → profile key
function getProfileKey(label) {
  const text = normalize(label);
  for (const key in FIELD_KEYWORDS) {
    if (FIELD_KEYWORDS[key].some((k) => text.includes(k))) {
      return key;
    }
  }
  return null;
}

// handle google form dropdowns
function fillDropdown(question, value) {
  const listbox = question.querySelector('[role="listbox"]');
  if (!listbox) return false;

  listbox.click();

  const target = normalize(value);
  const options = Array.from(document.querySelectorAll('[role="option"]'));

  for (const opt of options) {
    const text = normalize(opt.innerText || opt.textContent);
    if (text === target || text.includes(target)) {
      opt.click();
      return true;
    }
  }
  return false;
}

// fill a single question
function fillQuestion(question, value) {
  if (!value) return;

  const date = question.querySelector("input[type='date']");
  const radios = question.querySelectorAll('[role="radio"]');
  const textarea = question.querySelector("textarea");
  const textInput = question.querySelector(
    "input[type='text'], input[type='email'], input[type='number'], input[type='url']"
  );

  // date
  if (date) {
    date.value = value;
    date.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // dropdown
  if (fillDropdown(question, value)) return;

  // radio buttons
  if (radios.length) {
    const target = normalize(String(value));

    for (const r of radios) {
      const optionText = normalize(
        r.getAttribute("aria-label") || r.textContent
      );

      if (
        optionText === target ||
        optionText.includes(target) ||
        target.includes(optionText)
      ) {
        r.click();
        return;
      }
    }
  }

  // textarea
  if (textarea) {
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // text input
  if (textInput) {
    textInput.value = value;
    textInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// auto-check "record email"
function autoCheckEmail() {
  document.querySelectorAll('[role="checkbox"]').forEach((cb) => {
    const text = normalize(cb.parentElement?.innerText);
    if (text.includes("record") && text.includes("email")) {
      if (cb.getAttribute("aria-checked") === "false") cb.click();
    }
  });
}

// autofill entire form
function autofill(profile) {
  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    const key = getProfileKey(labelEl.innerText);
    if (!key || !profile[key]) return;

    fillQuestion(question, profile[key]);
  });

  autoCheckEmail();
}

function resetGoogleForm() {
  // reset text & textarea fields
  document.querySelectorAll("input, textarea").forEach((el) => {
    if (el.type === "file") return;

    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // reset radio buttons
  document
    .querySelectorAll('[role="radio"][aria-checked="true"]')
    .forEach((radio) => {
      radio.click(); // real user-like toggle
    });

  // reset checkboxes (including record email)
  document
    .querySelectorAll('[role="checkbox"][aria-checked="true"]')
    .forEach((checkbox) => {
      checkbox.click(); // REQUIRED
    });

  // reset dropdowns
  document.querySelectorAll('[role="listbox"]').forEach((listbox) => {
    const firstOption = listbox.querySelector('[role="option"]');
    if (firstOption) firstOption.click();
  });
}

// listen from popup
chrome.runtime.onMessage.addListener((req) => {
  if (req.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile"], (res) => {
      autofill(res.profile || {});
    });
  }

  if (req.action === "RESET_FORM") {
    resetGoogleForm(); // ✅
  }
});
