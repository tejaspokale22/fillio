function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLabel(text) {
  return (text || "")
    .replace(/\n/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fillTopEmail(profile) {
  const email = profile?.email;
  if (!email) return false;

  const checkbox = document.querySelector(
    'div[role="checkbox"][aria-label*="email"]',
  );

  if (checkbox) {
    if (checkbox.getAttribute("aria-checked") !== "true") {
      checkbox.click();
    }
    return true;
  }

  const input =
    document.querySelector("input[type='email']") ||
    document.querySelector("input[autocomplete='email']") ||
    document.querySelector('input[aria-label*="Email"]');

  if (!input) return false;

  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  ).set;

  setValue.call(input, email);

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  return true;
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

// function fillQuestion(question, value) {
//   if (!value) return;

//   value = String(value).trim();

//   const triggerInput = (el, val) => {
//     el.value = val;
//     el.dispatchEvent(new Event("input", { bubbles: true }));
//   };

//   const normalizePhone = (val) => {
//     const digits = val.replace(/\D/g, "");
//     return digits.length >= 10 ? digits.slice(-10) : val;
//   };

//   const normalizeGender = (val) => {
//     const g = normalize(val);
//     if (g.startsWith("m")) return "male";
//     if (g.startsWith("f")) return "female";
//     return val;
//   };

//   value = normalizePhone(value);
//   value = normalizeGender(value);

//   const dateInput = question.querySelector("input[type='date']");
//   if (dateInput) {
//     triggerInput(dateInput, value);
//     return;
//   }

//   if (fillDropdown(question, value)) return;

//   const radios = question.querySelectorAll('[role="radio"]');

//   if (radios.length) {
//     const target = normalize(value);

//     let bestMatch = null;

//     for (const radio of radios) {
//       const optionText =
//         radio.getAttribute("data-value") ||
//         radio.getAttribute("aria-label") ||
//         radio.textContent;

//       const normalizedOption = normalize(optionText);

//       // exact match (highest priority)
//       if (normalizedOption === target) {
//         radio.click();
//         return;
//       }

//       // strong partial match
//       if (
//         normalizedOption.includes(target) ||
//         target.includes(normalizedOption)
//       ) {
//         bestMatch = radio;
//       }
//     }

//     if (bestMatch) {
//       bestMatch.click();
//       return;
//     }
//   }

//   const textarea = question.querySelector("textarea");
//   if (textarea) {
//     triggerInput(textarea, value);
//     return;
//   }

//   const input = question.querySelector("input:not([type='file'])");
//   if (input) {
//     triggerInput(input, value);
//   }
// }

function fillQuestion(question, value) {
  if (!value) return;

  value = String(value).trim();

  const triggerInput = (el, val) => {
    el.value = val;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const normalizePhone = (val) => {
    const digits = val.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : val;
  };

  const normalizeGender = (val) => {
    const g = normalize(val);

    if (g.startsWith("m")) return "male";
    if (g.startsWith("f")) return "female";

    return val;
  };

  // Detect question text
  const questionText = normalize(question.innerText);

  // Normalize ONLY phone fields
  if (
    questionText.includes("phone") ||
    questionText.includes("mobile") ||
    questionText.includes("contact")
  ) {
    value = normalizePhone(value);
  }

  // Normalize ONLY gender fields
  if (questionText.includes("gender")) {
    value = normalizeGender(value);
  }

  const dateInput = question.querySelector("input[type='date']");

  if (dateInput) {
    triggerInput(dateInput, value);
    return;
  }

  if (fillDropdown(question, value)) return;

  const radios = question.querySelectorAll('[role="radio"]');

  if (radios.length) {
    const target = normalize(value);

    let bestMatch = null;

    for (const radio of radios) {
      const optionText =
        radio.getAttribute("data-value") ||
        radio.getAttribute("aria-label") ||
        radio.textContent;

      const normalizedOption = normalize(optionText);

      // exact match
      if (normalizedOption === target) {
        radio.click();
        return;
      }

      // partial match
      if (
        normalizedOption.includes(target) ||
        target.includes(normalizedOption)
      ) {
        bestMatch = radio;
      }
    }

    if (bestMatch) {
      bestMatch.click();
      return;
    }
  }

  const textarea = question.querySelector("textarea");

  if (textarea) {
    triggerInput(textarea, value);
    return;
  }

  const input = question.querySelector("input:not([type='file'])");

  if (input) {
    triggerInput(input, value);
  }
}

function extractLabels() {
  const labels = [];

  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    labels.push(cleanLabel(labelEl.innerText));
  });

  return labels;
}

function autofill(profile, mapping = {}) {
  let filledCount = 0;

  if (fillTopEmail(profile)) filledCount++;

  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    const label = cleanLabel(labelEl.innerText);
    const key = mapping[label];

    if (key && profile[key]) {
      fillQuestion(question, profile[key]);
      filledCount++;
    }
  });

  return filledCount;
}

function resetGoogleForm() {
  const clearBtn = document.querySelector('div[jsname="X5DuWc"]');
  if (clearBtn) clearBtn.click();
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "FILL_FORM") {
    chrome.storage.sync.get(["profile"], (result) => {
      const profile = result.profile || {};

      try {
        const labels = extractLabels();

        const profileKeys = Object.keys(profile);

        chrome.runtime.sendMessage(
          {
            type: "MATCH_LABELS",
            profileKeys,
            formLabels: labels,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Background script error:",
                chrome.runtime.lastError,
              );
              sendResponse({ success: false, filledCount: 0 });
              return;
            }

            const mapping = response?.mapping || {};

            const filledCount = autofill(profile, mapping);

            sendResponse({ success: true, filledCount });
          },
        );
      } catch (err) {
        console.error("Fill form failed:", err);
        sendResponse({ success: false, filledCount: 0 });
      }
    });

    return true;
  }

  if (request.action === "RESET_FORM") {
    try {
      resetGoogleForm();
      sendResponse({ success: true });
    } catch (err) {
      console.error("Reset failed:", err);
      sendResponse({ success: false });
    }

    return true;
  }
});
