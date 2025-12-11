// content.js - final version
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

// prefer aria-label, fallback to visible text
function getOptionLabelText(opt) {
  const aria = (opt.getAttribute && opt.getAttribute("aria-label")) || "";
  if (aria && aria.trim()) return aria.trim();
  const inner = (opt.innerText || opt.textContent || "").trim();
  return inner;
}

// Map form labels to profile keys
function getKeyFromLabel(rawLabel) {
  const label = normalizeLabel(rawLabel);

  if (label.includes("technical achievement")) return "techAchievements";
  if (label.includes("personal achievement")) return "personalAchievements";
  if (label.includes("project") && !label.includes("competition")) return "projects";

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

  if (label.includes("date of birth") || label.includes("dob") || label.includes("birth date"))
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

  if (label.includes("course") || label === "degree" || label.includes("ug course")) return "course";

  if (label.includes("branch") || label.includes("specialization") || label.includes("stream")) return "branch";

  if (
    label.includes("year of passing") ||
    label.includes("passing year") ||
    label.includes("passout year") ||
    (label.includes("year") && label.includes("passing"))
  )
    return "passYear";

  if (label.includes("10th") || label.includes("ssc") || label.includes("class 10")) return "tenthPercent";

  if (label.includes("12th") || label.includes("hsc") || label.includes("class 12")) return "twelfthPercent";

  if (label.includes("diploma")) return "diplomaPercent";

  if (
    label.includes("be btech") ||
    label.includes("be b tech") ||
    label.includes("be/btech") ||
    label.includes("be b tech till recent result declared")
  )
    return "degreePercent";

  if (label.includes("cocubes")) return "cocubesScore";

  if (label.includes("hacker rank rating") || label.includes("hackerrank rating")) return "hackerrankRating";
  if ((label.includes("hacker rank") || label.includes("hackerrank")) && label.includes("link")) return "hackerrankLink";

  if (label.includes("leetcode score") || label === "leetcode") return "leetcodeScore";
  if (label.includes("leetcode") && label.includes("link")) return "leetcodeLink";

  if (label.includes("codechef rating")) return "codechefRating";
  if (label.includes("codechef") && label.includes("link")) return "codechefLink";

  if (label.includes("hacker earth rating") || label.includes("hackerearth rating")) return "hackerearthRating";
  if ((label.includes("hacker earth") || label.includes("hackerearth")) && label.includes("link")) return "hackerearthLink";

  if (label.includes("core skills") || label === "core skills" || (label.includes("skills") && label.includes("core")))
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

// Auto-check "record email" checkbox anywhere on the page
function autoCheckEmailBox() {
  try {
    const candidates = Array.from(document.querySelectorAll('[role="checkbox"], input[type="checkbox"]'));
    for (const el of candidates) {
      const aria = (el.getAttribute && el.getAttribute("aria-label")) || "";
      const nearby = (el.innerText || el.parentElement?.innerText || "").toString() || "";
      const combined = (aria + " " + nearby).toLowerCase();

      if (
        (combined.includes("record") && combined.includes("email")) ||
        (combined.includes("collect") && combined.includes("email")) ||
        (combined.includes("include with my response") && combined.includes("email"))
      ) {
        const checked = el.getAttribute && el.getAttribute("aria-checked");
        const isChecked = checked === "true" || el.checked === true;
        if (!isChecked) {
          try {
            el.click();
          } catch (e) {
            el.parentElement && el.parentElement.click && el.parentElement.click();
          }
        }
        return true;
      }
    }
  } catch (e) {
    console.warn("autoCheckEmailBox error", e);
  }
  return false;
}

// Fill individual question element (handles date, text, textarea, radio groups, google listbox)
function fillQuestionElement(questionEl, key, value) {
  if (value === null || value === undefined || value === "") return;

  const dateInput = questionEl.querySelector("input[type='date']");
  const textarea = questionEl.querySelector("textarea");
  const input = questionEl.querySelector("input[type='text'], input[type='email'], input[type='number'], input[type='url']");
  const radioGroup = questionEl.querySelector('[role="radiogroup"]');
  const listbox = questionEl.querySelector('[role="listbox"]');

  if (dateInput) {
    dateInput.value = value;
    dateInput.dispatchEvent(new Event("input", { bubbles: true }));
    dateInput.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // Google custom dropdown/listbox handling (opens and picks an option)
  if (listbox) {
    const target = normalizeSoft(value);
    try { listbox.click(); } catch (e) {}
    setTimeout(() => {
      const opts = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"], [role="radio"]'));
      for (const opt of opts) {
        const label = normalizeSoft(getOptionLabelText(opt));
        if (!label) continue;
        if (label === target || label.includes(target) || target.includes(label)) {
          try { opt.click(); } catch (e) {
            opt.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            opt.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
          }
          listbox.dispatchEvent(new Event("change", { bubbles: true }));
          return;
        }
      }
      // close listbox if nothing found
      document.body.click();
    }, 120);
    return;
  }

  if (radioGroup) {
    const opts = Array.from(radioGroup.querySelectorAll('[role="radio"]'));
    const targetSoft = normalizeSoft(value);
    const ratingKeys = ["hackerrankRating", "codechefRating", "hackerearthRating"];

    if (key === "gender") {
      const first = (targetSoft && targetSoft[0]) || "";
      for (const opt of opts) {
        const label = normalizeSoft(getOptionLabelText(opt));
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
        const labelRaw = getOptionLabelText(opt) || "";
        if (labelRaw.trim() === targetRating) {
          opt.click();
          return;
        }
      }
      return;
    }

    for (const opt of opts) {
      const label = normalizeSoft(getOptionLabelText(opt) || "");
      if (!label) continue;
      if (label === targetSoft || label.includes(targetSoft) || targetSoft.includes(label)) {
        opt.click();
        return;
      }
    }
    return;
  }

  if (textarea) {
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
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

  // Google forms group wrapper
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
      if (value !== null && value !== undefined && value !== "") {
        fillQuestionElement(q, key, value);
        filledCount++;

        // small delay attempt to handle dependent UI (like email checkbox in same block)
        if (key === "email") {
          setTimeout(() => {
            // try clicking checkbox inside the same question if present
            const emailCheckbox = q.querySelector('[role="checkbox"], input[type="checkbox"]');
            if (emailCheckbox) {
              const cbLabel = (emailCheckbox.getAttribute && emailCheckbox.getAttribute("aria-label")) || (emailCheckbox.parentElement?.innerText || "");
              const combined = (cbLabel || "").toLowerCase();
              if (combined.includes("record") && combined.includes("email")) {
                try { emailCheckbox.click(); } catch (e) { emailCheckbox.parentElement && emailCheckbox.parentElement.click && emailCheckbox.parentElement.click(); }
              }
            }
          }, 80);
        }

        continue;
      }
    }

    // try custom fields
    const customValue = findCustomMatch(rawLabel, customFields);
    if (customValue) {
      fillQuestionElement(q, "custom", customValue);
      filledCount++;
    }
  }

  // document-level email checkbox attempt (some forms place it outside Qr7Oae)
  setTimeout(() => {
    autoCheckEmailBox();
  }, 150);

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
        try {
          el.value = "";
          el.checked = false;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        } catch (e) {}
      }
    });

    const radioGroups = q.querySelectorAll('[role="radiogroup"]');
    radioGroups.forEach((group) => {
      const checkedRadio = group.querySelector('[role="radio"][aria-checked="true"]');
      if (checkedRadio) {
        try { checkedRadio.click(); } catch (e) {}
      }
    });

    const checkboxes = q.querySelectorAll('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked');
    checkboxes.forEach((cb) => {
      try { cb.click(); } catch (e) { cb.checked = false; }
    });

    const selects = q.querySelectorAll("select");
    selects.forEach((sel) => {
      try { sel.selectedIndex = 0; sel.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
    });
  });

  // Also try to uncheck document-level email box if present
  setTimeout(() => {
    const candidates = Array.from(document.querySelectorAll('[role="checkbox"][aria-checked="true"], input[type="checkbox"]:checked'));
    candidates.forEach((el) => {
      const aria = (el.getAttribute && el.getAttribute("aria-label")) || "";
      const nearby = (el.innerText || el.parentElement?.innerText || "").toString() || "";
      const combined = (aria + " " + nearby).toLowerCase();
      if (combined.includes("record") && combined.includes("email")) {
        try { el.click(); } catch (e) { el.checked = false; }
      }
    });
  }, 120);
}

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile", "customFields"], (result) => {
      try {
        const fillResult = autofillFromProfile(result.profile, result.customFields || []);
        sendResponse(fillResult);
      } catch (err) {
        console.error("autofill error", err);
        sendResponse({ success: false, message: "autofill failed (see console)" });
      }
    });
    // indicate async response
    return true;
  }

  if (request.action === "RESET_FORM") {
    try {
      resetForm();
      sendResponse({ success: true });
    } catch (err) {
      console.error("reset error", err);
      sendResponse({ success: false });
    }
    return true;
  }

  return false;
});