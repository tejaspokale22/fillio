// normalize text for matching
function normalize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// clean labels before AI mapping
function cleanLabel(text) {
  return (text || "")
    .replace(/\n/g, " ")
    .replace(/\(.*?\)/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// check if question is required
function isRequired(question) {
  return (
    question.innerText.includes("*") ||
    question.querySelector('[aria-label*="Required"]')
  );
}

// check top email field
function fillTopEmail(profile) {
  if (!profile?.email) return false;

  const emailCheckbox = document.querySelector(
    'div[role="checkbox"][aria-label*="email"]',
  );

  if (emailCheckbox) {
    const isChecked = emailCheckbox.getAttribute("aria-checked") === "true";
    if (!isChecked) emailCheckbox.click();
    return true;
  }

  const emailInput =
    document.querySelector("input[type='email']") ||
    document.querySelector("input[autocomplete='email']") ||
    document.querySelector('input[aria-label*="Email"]');

  if (!emailInput) return false;

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  ).set;

  nativeSetter.call(emailInput, profile.email);

  emailInput.dispatchEvent(new Event("input", { bubbles: true }));
  emailInput.dispatchEvent(new Event("change", { bubbles: true }));

  return true;
}

// default fallback filler
// function fillDefault(question) {
//   const radios = question.querySelectorAll('[role="radio"]');
//   if (radios.length) {
//     for (const r of radios) {
//       const text = normalize(
//         r.getAttribute("aria-label") || r.textContent || "",
//       );
//       if (text === "no" || text === "0" || text.includes("no")) {
//         r.click();
//         return true;
//       }
//     }
//     radios[0].click();
//     return true;
//   }

//   const listbox = question.querySelector('[role="listbox"]');
//   if (listbox) {
//     listbox.click();
//     const options = question.querySelectorAll('[role="option"]');
//     if (options.length) {
//       options[0].click();
//       return true;
//     }
//   }

//   const input = question.querySelector("input:not([type='file'])");
//   if (input) {
//     input.value = "NA";
//     input.dispatchEvent(new Event("input", { bubbles: true }));
//     return true;
//   }

//   const textarea = question.querySelector("textarea");
//   if (textarea) {
//     textarea.value = "NA";
//     textarea.dispatchEvent(new Event("input", { bubbles: true }));
//     return true;
//   }

//   return false;
// }

// fill dropdown

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

// fill question
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

// extract labels
function extractLabels() {
  const labels = [];

  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    labels.push(cleanLabel(labelEl.innerText));
  });

  return labels;
}

// autofill using AI mapping
function autofill(profile, mapping = {}) {
  let filledCount = 0;

  if (fillTopEmail(profile)) filledCount++;

  document.querySelectorAll(".Qr7Oae").forEach((question) => {
    const labelEl = question.querySelector(".M7eMe");
    if (!labelEl) return;

    const label = cleanLabel(labelEl.innerText);
    const key = mapping[label];

    if (key && profile[key]) {
      fillQuestion(question, profile[key], key);
      filledCount++;
      return;
    }

    for (const [fieldLabel, value] of Object.entries(profile)) {
      if (!value) continue;

      const q = normalize(label);
      const f = normalize(fieldLabel);

      if (q.includes(f) || f.includes(q)) {
        fillQuestion(question, value);
        filledCount++;
        return;
      }
    }
  });

  return filledCount;
}

// clear form
function resetGoogleForm() {
  const clearBtn = document.querySelector('div[jsname="X5DuWc"]');
  if (clearBtn) clearBtn.click();
}

// message listener
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
