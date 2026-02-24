const FIELD_KEYWORDS = {
  email: ["email"],
  prn: ["prn", "university prn"],
  fullName: [
    "full name",
    "candidate name",
    "student name",
    "name of the student",
    "name of the candidate",
  ],
  mobile: ["mobile", "phone", "contact number", "10 digits"],
  dob: ["date of birth", "dob", "birth"],
  gender: ["gender"],

  degree: ["degree", "course"],
  branch: ["specialization", "branch", "stream"],
  college: ["college", "college name", "institute"],

  tenthPercent: ["10th", "ssc", "class 10", "10th %"],
  twelthPercent: ["12th", "hsc", "12th %"],
  diplomaPercent: ["diploma %", "diploma"],
  degreePercent: [
    "be%",
    "btech%",
    "degree %",
    "be b tech",
    "graduation %",
    "graduation aggregate",
  ],

  passYear: ["year of graduation", "passing year", "passout"],

  cocubesScore: ["cocubes"],

  codechefRating: [
    "codechef rating",
    "codechef rank",
    "codechef stars",
    "code chef rating",
  ],

  codechefLink: [
    "codechef profile",
    "codechef profile link",
    "codechef url",
    "code chef profile",
    "link of codechef rating",
    "link of code chef rating",
  ],

  hackerrankRating: [
    "hackerrank rating",
    "hackerrank score",
    "hackerrank stars",
    "hacker rank rating",
  ],

  hackerrankLink: [
    "hackerrank profile",
    "hackerrank profile link",
    "hackerrank url",
    "hacker rank profile",
    "link of hackerrank rating",
    "link of hacker rank rating",
  ],

  leetcodeScore: [
    "leetcode score",
    "leetcode rating",
    "leetcode problems solved",
    "leetcode solved",
  ],

  leetcodeLink: [
    "leetcode profile",
    "leetcode profile link",
    "leetcode url",
    "leet code profile",
    "link of leetcode score",
    "link of leet code score",
  ],

  hackerearthRating: [
    "hackerearth rating",
    "hackerearth score",
    "hacker earth rating",
  ],

  hackerearthLink: [
    "hackerearth profile",
    "hackerearth profile link",
    "hackerearth url",
    "hacker earth profile",
    "link of hackerearth rating",
    "link of hacker earth rating",
  ],

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

  technologies: [
    "technologies",
    "skills",
    "technical skills",
    "tech stack",
    "technology stack",
  ],
  techAchievements: ["technical achievements"],
  personalAchievements: ["personal achievements"],
  projects: ["project"],
};

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRequired(question) {
  return (
    question.innerText.includes("*") ||
    question.querySelector('[aria-label*="Required"]')
  );
}

function fillDefault(question) {
  // radio fallback (Yes/No, 0/1, etc.)
  const radios = question.querySelectorAll('[role="radio"]');
  if (radios.length) {
    for (const r of radios) {
      const text = normalize(
        r.getAttribute("aria-label") || r.textContent || "",
      );
      if (text === "no" || text === "0" || text.includes("no")) {
        r.click();
        return true;
      }
    }
    radios[0].click(); // safest fallback
    return true;
  }

  // dropdown fallback
  const listbox = question.querySelector('[role="listbox"]');
  if (listbox) {
    listbox.click();
    const options = question.querySelectorAll('[role="option"]');
    if (options.length) {
      options[0].click();
      return true;
    }
  }

  // text / email / number input fallback
  const input = question.querySelector("input:not([type='file'])");
  if (input) {
    input.value = "NA";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  // textarea fallback
  const textarea = question.querySelector("textarea");
  if (textarea) {
    textarea.value = "NA";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  return false;
}

function getProfileKey(label) {
  const text = normalize(label);

  let bestMatch = null;
  let longestMatchLength = 0;

  for (const [key, keywords] of Object.entries(FIELD_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalize(keyword);
      if (
        text.includes(normalizedKeyword) &&
        normalizedKeyword.length > longestMatchLength
      ) {
        bestMatch = key;
        longestMatchLength = normalizedKeyword.length;
      }
    }
  }

  return bestMatch;
}

function fillDropdown(question, value) {
  const listbox = question.querySelector('[role="listbox"]');
  if (!listbox) return false;

  listbox.click();

  const target = normalize(value);
  const options = Array.from(question.querySelectorAll('[role="option"]'));

  for (const opt of options) {
    const text = normalize(opt.innerText || "");
    if (text === target || target.includes(text)) {
      opt.click();
      return true;
    }
  }
  return false;
}

function fillQuestion(question, value, key) {
  if (!value) return;

  if (key === "mobile") {
    value = String(value).replace(/\D/g, "").slice(-10);
  }

  if (key === "gender") {
    const g = normalize(value);
    if (g.startsWith("m")) value = "male";
    if (g.startsWith("f")) value = "female";
  }

  const date = question.querySelector("input[type='date']");
  if (date) {
    date.value = value;
    date.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (fillDropdown(question, value)) return;

  const radios = question.querySelectorAll('[role="radio"]');
  if (radios.length) {
    const target = normalize(value);
    for (const radio of radios) {
      const text = normalize(
        radio.getAttribute("aria-label") || radio.textContent,
      );
      if (text === target || text.includes(target) || target.includes(text)) {
        radio.click();
        return;
      }
    }
  }

  const textarea = question.querySelector("textarea");
  if (textarea) {
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  const input = question.querySelector("input:not([type='file'])");

  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function autofill(profile, customFields = []) {
  let filledCount = 0;

  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    const label = labelEl.innerText;
    const key = getProfileKey(label);

    // predefined profile match
    if (key && profile[key]) {
      fillQuestion(question, profile[key], key);
      filledCount++;
      return;
    }

    // custom field match
    for (const field of customFields) {
      if (!field.value) continue;

      const q = normalize(label);
      const f = normalize(field.labelKeyword);

      if (q.includes(f) || f.includes(q)) {
        fillQuestion(question, field.value);
        filledCount++;
        return;
      }
    }

    // required fallback (no match found)
    if (isRequired(question)) {
      if (fillDefault(question)) {
        filledCount++;
      }
    }
  });

  return filledCount;
}

function resetGoogleForm() {
  document.querySelectorAll("input, textarea").forEach((el) => {
    if (el.type === "file") return;
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });

  document
    .querySelectorAll('[role="radio"][aria-checked="true"]')
    .forEach((r) => r.click());

  document
    .querySelectorAll('[role="checkbox"][aria-checked="true"]')
    .forEach((c) => c.click());
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile", "customFields"], (result) => {
      try {
        const filledCount = autofill(
          result.profile || {},
          result.customFields || [],
        );
        sendResponse({ success: true, filledCount });
      } catch (e) {
        console.error(e);
        sendResponse({ success: false, filledCount: 0 });
      }
    });
    return true;
  }

  if (request.action === "RESET_FORM") {
    try {
      resetGoogleForm();
      sendResponse({ success: true });
    } catch (e) {
      sendResponse({ success: false });
    }
    return true;
  }
});
