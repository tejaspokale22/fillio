// Normalize text for matching
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\*\:\?\(\)\[\]\-_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Keywords mapped to stored profile keys
const FIELD_KEYWORDS = {
  email: ["email"],
  prn: ["prn"],
  fullName: ["full name", "name", "candidate name", "student name"],
  dob: ["date of birth", "dob", "birth date"],
  mobile: ["mobile", "phone", "contact number", "whatsapp"],
  gender: ["gender"],

  college: ["college", "institute"],
  course: ["course", "degree"],
  branch: ["branch", "stream", "specialization"],
  passYear: ["year of passing", "passing year", "passout year"],

  tenthPercent: ["10th", "ssc", "class 10"],
  twelfthPercent: ["12th", "hsc", "class 12"],
  diplomaPercent: ["diploma"],
  degreePercent: ["be", "btech"],

  projects: ["project"],
  techAchievements: ["technical achievement"],
  personalAchievements: ["personal achievement"],
};

// Match form label to profile key
function getProfileKey(label) {
  const text = normalize(label);
  for (const key in FIELD_KEYWORDS) {
    if (FIELD_KEYWORDS[key].some((k) => text.includes(k))) {
      return key;
    }
  }
  return null;
}

// Fill a single question
function fillQuestion(q, value) {
  if (!value) return;

  const date = q.querySelector("input[type='date']");
  const text = q.querySelector(
    "input[type='text'], input[type='email'], input[type='number'], input[type='url']"
  );
  const textarea = q.querySelector("textarea");
  const radios = q.querySelectorAll('[role="radio"]');

  if (date) {
    date.value = value;
    date.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (radios.length) {
    const target = normalize(value);
    for (const r of radios) {
      const label = normalize(r.getAttribute("aria-label"));
      if (label === target || label.includes(target)) {
        r.click();
        return;
      }
    }
  }

  if (textarea) {
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (text) {
    text.value = value;
    text.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Auto-check "record email" option
function autoCheckEmail() {
  document.querySelectorAll('[role="checkbox"]').forEach((cb) => {
    const txt = normalize(cb.parentElement?.innerText);
    if (txt.includes("record") && txt.includes("email")) {
      if (cb.getAttribute("aria-checked") === "false") cb.click();
    }
  });
}

// Fill all form questions
function autofill(profile) {
  document.querySelectorAll(".Qr7Oae").forEach((q) => {
    const labelEl = q.querySelector(".M7eMe");
    if (!labelEl) return;

    const key = getProfileKey(labelEl.innerText);
    if (!key || !profile[key]) return;

    fillQuestion(q, profile[key]);
  });

  autoCheckEmail();
}

// Listen for popup actions
chrome.runtime.onMessage.addListener((req, _, send) => {
  if (req.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile"], (res) => {
      autofill(res.profile || {});
      send({ success: true });
    });
    return true;
  }
});
