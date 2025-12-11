// Normalization utilities
function normalizeLabel(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[\*\:\?\%\(\)\[\]\-_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSoft(text) {
  return (text || "").toLowerCase().trim();
}

// Map form labels to profile keys
function getKeyFromLabel(rawLabel) {
  const label = normalizeLabel(rawLabel);

  if (label.includes("technical achievement")) return "techAchievements";
  if (label.includes("personal achievement")) return "personalAchievements";
  if (label.includes("project") && !label.includes("competition"))
    return "projects";

  if (label.includes("email")) return "email";
  if (label.includes("prn")) return "prn";

  if (
    label.includes("full name") ||
    label.includes("candidate name") ||
    label.includes("student name") ||
    label.includes("name (first") ||
    label === "name"
  )
    return "fullName";

  if (
    label.includes("date of birth") ||
    label.includes("dob") ||
    label.includes("birth date")
  )
    return "dob";

  if (
    label.includes("mobile") ||
    label.includes("phone") ||
    label.includes("contact number") ||
    label.includes("whatsapp number") ||
    label.includes("10 digit mobile")
  )
    return "mobile";

  if (label.includes("gender")) return "gender";

  if (
    label.includes("college name") ||
    label.includes("institute name") ||
    label === "college" ||
    label === "college name"
  )
    return "college";

  if (
    label.includes("course") ||
    label === "degree" ||
    label.includes("ug course")
  )
    return "course";

  if (
    label.includes("branch") ||
    label.includes("specialization") ||
    label.includes("stream")
  )
    return "branch";

  if (
    label.includes("year of passing") ||
    label.includes("passing year") ||
    label.includes("passout year") ||
    (label.includes("year") && label.includes("passing"))
  )
    return "passYear";

  if (
    label.includes("10th") ||
    label.includes("ssc") ||
    label.includes("x th") ||
    label.includes("class 10")
  )
    return "tenthPercent";

  if (
    label.includes("12th") ||
    label.includes("hsc") ||
    label.includes("xii") ||
    label.includes("class 12")
  )
    return "twelfthPercent";

  if (label.includes("diploma")) return "diplomaPercent";

  if (
    label.includes("be btech") ||
    label.includes("be b tech") ||
    label.includes("be/btech") ||
    label.includes("be b tech till recent result declared") ||
    (label.includes("be") &&
      label.includes("btech") &&
      label.includes("recent result"))
  )
    return "degreePercent";

  if (label.includes("cocubes")) return "cocubesScore";

  if (
    label.includes("hacker rank rating") ||
    label.includes("hackerrank rating")
  )
    return "hackerrankRating";
  if (
    (label.includes("hacker rank") || label.includes("hackerrank")) &&
    label.includes("link")
  )
    return "hackerrankLink";

  if (label.includes("leetcode score") || label === "leetcode")
    return "leetcodeScore";
  if (label.includes("leetcode") && label.includes("link"))
    return "leetcodeLink";

  if (label.includes("codechef rating")) return "codechefRating";
  if (label.includes("codechef") && label.includes("link"))
    return "codechefLink";

  if (
    label.includes("hacker earth rating") ||
    label.includes("hackerearth rating")
  )
    return "hackerearthRating";
  if (
    (label.includes("hacker earth") || label.includes("hackerearth")) &&
    label.includes("link")
  )
    return "hackerearthLink";

  if (
    label.includes("core skills") ||
    label === "core skills" ||
    (label.includes("skills") && label.includes("core"))
  )
    return "coreSkill";

  return null;
}

// Find matching custom field
function findCustomMatch(rawLabel, customFields) {
  const labelNorm = normalizeLabel(rawLabel);
  if (!customFields || !customFields.length) return null;

  for (const field of customFields) {
    const keywordNorm = normalizeLabel(field.labelKeyword);
    if (!keywordNorm) continue;
    if (labelNorm.includes(keywordNorm)) return field.value;
  }
  return null;
}

// Get value from profile
function getProfileValue(key, profile) {
  return profile && key ? profile[key] : null;
}

// Fill individual question element
function fillQuestionElement(questionEl, key, value) {
  if (!value) return;

  const dateInput = questionEl.querySelector("input[type='date']");
  const textarea = questionEl.querySelector("textarea");
  const input = questionEl.querySelector(
    "input[type='text'], input[type='email'], input[type='number'], input[type='url']"
  );
  const radioGroup = questionEl.querySelector('[role="radiogroup"]');

  if (dateInput) {
    dateInput.value = value;
    dateInput.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (radioGroup) {
    const opts = Array.from(radioGroup.querySelectorAll('[role="radio"]'));
    const targetSoft = normalizeSoft(value);
    const ratingKeys = [
      "hackerrankRating",
      "codechefRating",
      "hackerearthRating",
    ];

    if (key === "gender") {
      const first = targetSoft[0];
      for (const opt of opts) {
        const label = normalizeSoft(opt.getAttribute("aria-label") || "");
        if (
          label.startsWith(first) ||
          label === targetSoft ||
          (first === "m" && label.includes("male")) ||
          (first === "f" && label.includes("female"))
        ) {
          opt.click();
          return;
        }
      }
      return;
    }

    if (ratingKeys.includes(key)) {
      const targetRating = String(value).trim();
      for (const opt of opts) {
        const label = (opt.getAttribute("aria-label") || "").trim();
        if (label === targetRating) {
          opt.click();
          return;
        }
      }
      return;
    }

    for (const opt of opts) {
      const label = normalizeSoft(opt.getAttribute("aria-label") || "");
      if (
        label === targetSoft ||
        label.includes(targetSoft) ||
        targetSoft.includes(label)
      ) {
        opt.click();
        return;
      }
    }
    return;
  }

  if (textarea) {
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

// Autofill Google Form
function autofillFromProfile(profile, customFields) {
  if (!profile && (!customFields || !customFields.length)) {
    return {
      success: false,
      message: "no data saved yet. please save your profile first.",
    };
  }

  const questions = Array.from(document.querySelectorAll(".Qr7Oae"));
  if (questions.length === 0) {
    return {
      success: false,
      message: "no form fields found. ensure you're on a google form.",
    };
  }

  let filledCount = 0;

  for (const q of questions) {
    const labelEl = q.querySelector(".M7eMe");
    if (!labelEl) continue;

    const rawLabel = labelEl.innerText.trim();
    if (!rawLabel) continue;

    const key = getKeyFromLabel(rawLabel);
    if (key) {
      const value = getProfileValue(key, profile);
      if (value) {
        fillQuestionElement(q, key, value);
        filledCount++;
        continue;
      }
    }

    const customValue = findCustomMatch(rawLabel, customFields);
    if (customValue) {
      fillQuestionElement(q, "custom", customValue);
      filledCount++;
    }
  }

  if (filledCount === 0) {
    return { success: false, message: "no matching fields found to autofill." };
  }

  return { success: true, filledCount };
}

// Reset Google Form
function resetForm() {
  const questions = document.querySelectorAll(".Qr7Oae");
  questions.forEach((q) => {
    const inputs = q.querySelectorAll("input, textarea");
    inputs.forEach((el) => {
      if (el.type !== "file") {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    const radioGroups = q.querySelectorAll('[role="radiogroup"]');
    radioGroups.forEach((group) => {
      const checkedRadio = group.querySelector(
        '[role="radio"][aria-checked="true"]'
      );
      if (checkedRadio) checkedRadio.click();
    });

    const checkboxes = q.querySelectorAll(
      '[role="checkbox"][aria-checked="true"]'
    );
    checkboxes.forEach((cb) => cb.click());

    const selects = q.querySelectorAll("select");
    selects.forEach((sel) => {
      sel.selectedIndex = 0;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
  });
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile", "customFields"], (result) => {
      const fillResult = autofillFromProfile(
        result.profile,
        result.customFields || []
      );
      sendResponse(fillResult);
    });
    return true;
  }

  if (request.action === "RESET_FORM") {
    resetForm();
    sendResponse({ success: true });
  }
  return true;
});
