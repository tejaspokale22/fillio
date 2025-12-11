import React, { useState, useEffect } from "react";
import Autofill from "./components/Autofill";
import Save from "./components/Save";
import Reset from "./components/Reset";
import Add from "./components/Add";
import Trash from "./components/Trash";
import Copy from "./components/Copy";
import Tick from "./components/Tick";
import Modal from "./components/Modal";

export default function Popup() {
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalLabel, setModalLabel] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [removedKeys, setRemovedKeys] = useState(new Set());
  const [fillStatus, setFillStatus] = useState("");
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const FIELDS = [
    { key: "email", label: "email" },
    { key: "prn", label: "prn" },
    { key: "fullName", label: "full name" },
    { key: "dob", label: "dob (yyyy-mm-dd)" },
    { key: "mobile", label: "mobile" },
    { key: "gender", label: "gender (male/female)" },
    { key: "college", label: "college name" },
    { key: "course", label: "course" },
    { key: "branch", label: "branch" },
    { key: "passYear", label: "year of passing" },
    { key: "tenthPercent", label: "10th %" },
    { key: "twelfthPercent", label: "12th %" },
    { key: "diplomaPercent", label: "diploma %" },
    { key: "degreePercent", label: "be/btech %" },
    { key: "cocubesScore", label: "cocubes score" },
    { key: "hackerrankRating", label: "hackerrank rating (0-5)" },
    { key: "hackerrankLink", label: "hackerrank profile link" },
    { key: "leetcodeScore", label: "leetcode score" },
    { key: "leetcodeLink", label: "leetcode profile link" },
    { key: "codechefRating", label: "codechef rating (0-5)" },
    { key: "codechefLink", label: "codechef profile link" },
    { key: "hackerearthRating", label: "hackerearth rating (0-5)" },
    { key: "hackerearthLink", label: "hackerearth profile link" },
    { key: "projects", label: "projects" },
    {
      key: "techAchievements",
      label: "technical achievements",
      textarea: true,
    },
    {
      key: "personalAchievements",
      label: "personal achievements",
      textarea: true,
    },
  ];

  const handleChange = (key, value) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const handleRemoveField = (key) => {
    setFormData((p) => {
      const cp = { ...p };
      cp[key] = "";
      return cp;
    });
    setRemovedKeys((s) => new Set(s).add(key));

    // Save to chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["profile", "hiddenStandardFields"], (res) => {
        const currentProfile = res.profile || {};
        const currentHidden = new Set(res.hiddenStandardFields || []);
        currentProfile[key] = "";
        currentHidden.add(key);
        chrome.storage.sync.set({
          profile: currentProfile,
          hiddenStandardFields: Array.from(currentHidden),
        });
      });
    }
  };

  const handleAddCustom = () => {
    const labelKeyword = modalLabel.trim();
    const value = modalValue.trim();

    if (!labelKeyword) {
      setModalError("please enter the field label");
      return;
    }

    setCustomFields((p) => [...p, { labelKeyword, value }]);
    setModalLabel("");
    setModalValue("");
    setModalError("");
    setShowModal(false);
  };

  const removeCustom = (i) =>
    setCustomFields((p) => p.filter((_, idx) => idx !== i));

  const updateCustomField = (index, value) => {
    setCustomFields((prev) =>
      prev.map((field, idx) => (idx === index ? { ...field, value } : field))
    );
  };

  const handleCopy = async (fieldKey, value) => {
    if (!value || !value.trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const showStatus = (setter, message, duration = 1600) => {
    setter(message);
    setTimeout(() => setter(""), duration);
  };

  const handleSave = () => {
    let hasData = false;

    // Check standard fields
    Object.values(formData).forEach((value) => {
      if (value && value.trim()) hasData = true;
    });

    // Check custom fields
    const validCustomFields = customFields.filter(
      (field) => field.labelKeyword && field.value
    );
    if (validCustomFields.length > 0) hasData = true;

    if (!hasData) {
      showStatus(status, "please fill at least one field before saving", 1600);
      return;
    }

    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(["hiddenStandardFields"], (res) => {
        chrome.storage.sync.set(
          {
            profile: formData,
            customFields: validCustomFields,
            hiddenStandardFields: res.hiddenStandardFields || [],
          },
          () => showStatus(setStatus, "saved ✅", 1600)
        );
      });
    } else {
      showStatus(setStatus, "chrome extension API not available", 1600);
    }
  };

  const handleFill = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      showStatus(setFillStatus, "chrome extension API not available", 1600);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        showStatus(
          setFillStatus,
          "no active tab found. open the form tab.",
          1600
        );
        return;
      }

      const tab = tabs[0];
      if (!tab.url || !tab.url.includes("docs.google.com/forms")) {
        showStatus(setFillStatus, "please open a google form tab first.", 1600);
        return;
      }

      try {
        chrome.tabs.sendMessage(tab.id, { action: "FILL_FORM" }, (response) => {
          if (chrome.runtime.lastError) {
            showStatus(
              setFillStatus,
              "please refresh the google form page and try again.",
              2000
            );
          } else if (response && !response.success) {
            showStatus(setFillStatus, response.message, 2000);
          } else if (response && response.success) {
            showStatus(
              setFillStatus,
              `filled ${response.filledCount} field(s) successfully`,
              1600
            );
          }
        });
      } catch (e) {
        showStatus(
          setFillStatus,
          "unable to trigger fill. please reopen the form.",
          1600
        );
      }
    });
  };

  const handleReset = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      showStatus(setStatus, "chrome extension API not available", 1600);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        showStatus(setStatus, "no active tab found. open the form tab.", 1600);
        return;
      }

      try {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "RESET_FORM" },
          (response) => {
            if (chrome.runtime.lastError) {
              showStatus(
                setStatus,
                "please reload the google form tab to reset again.",
                2000
              );
            } else {
              showStatus(setStatus, "form reset successfully", 1600);
            }
          }
        );
      } catch (e) {
        showStatus(
          setStatus,
          "unable to reset form. please reopen the form.",
          1600
        );
      }
    });
  };

  // Load saved data on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(
        ["profile", "customFields", "hiddenStandardFields"],
        (result) => {
          const profile = result.profile || {};
          const hiddenStandardFields = result.hiddenStandardFields || [];

          setFormData(profile);
          setCustomFields(result.customFields || []);
          setRemovedKeys(new Set(hiddenStandardFields));
        }
      );
    }
  }, []);

  return (
    <div className="m-1.5 p-0 bg-white border border-black rounded-md">
      <div className="bg-white p-1 w-[360px] m-2.5">
        {/* Header */}
        <h1 className="text-[18px] font-semibold m-0 mb-1 text-[#0f172a]">
          Autofill Google Forms
        </h1>
        <div className="text-[12px] text-gray-500 mb-2.5 w-[75%]">
          Save your details once and reuse them across similar google forms.
        </div>

        {/* Primary action button */}
        <div className="mb-1 pb-1">
          <button
            id="fillBtn"
            type="button"
            onClick={handleFill}
            className="w-full py-3 px-3 rounded-lg border-none text-[13px] font-semibold cursor-pointer bg-[#00b176] text-white transition-all duration-200 hover:bg-[#059669] flex items-center justify-center gap-2.5"
          >
            <Autofill />
            autofill google form
          </button>
          <div
            id="fillStatus"
            className="mt-1.5 text-[11px] text-center text-[#16a34a] min-h-3.5"
          >
            {fillStatus}
          </div>
        </div>

        {/* Fields list */}
        <div className="mb-2 pb-1.5">
          {FIELDS.map((f) =>
            !removedKeys.has(f.key) ? (
              <div key={f.key} className="mb-2.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="text-[11px] text-[#0f172a] m-0">
                    {f.label}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(f.key, formData[f.key])}
                      className="border-none bg-transparent text-[#0f172a] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                      title="Copy"
                    >
                      {copiedField === f.key ? <Tick /> : <Copy />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(f.key)}
                      className="border-none bg-transparent text-[#dc2626] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(220,38,38,0.1)]"
                      title="Remove"
                    >
                      <Trash />
                    </button>
                  </div>
                </div>

                {f.textarea ? (
                  <textarea
                    id={f.key}
                    value={formData[f.key] || ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] resize-y min-h-[50px] focus:border-[#0f172a] focus:bg-white"
                  />
                ) : (
                  <input
                    id={f.key}
                    value={formData[f.key] || ""}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
                  />
                )}
              </div>
            ) : null
          )}

          {/* custom fields */}
          <div id="customList">
            {customFields.map((c, i) => (
              <div key={i} className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-[#0f172a] m-0">
                    {c.labelKeyword}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(`custom-${i}`, c.value)}
                      className="border-none bg-transparent text-[#0f172a] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                      title="Copy"
                    >
                      {copiedField === `custom-${i}` ? <Tick /> : <Copy />}
                    </button>
                    <button
                      onClick={() => removeCustom(i)}
                      className="border-none bg-transparent text-[#dc2626] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(220,38,38,0.1)]"
                      type="button"
                      title="Remove"
                    >
                      <Trash />
                    </button>
                  </div>
                </div>
                <input
                  value={c.value}
                  onChange={(e) => updateCustomField(i, e.target.value)}
                  className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
                />
              </div>
            ))}
          </div>
        </div>

        {/* add custom field */}
        <div className="mb-3 mt-2">
          <button
            id="addCustomBtn"
            type="button"
            onClick={() => setShowModal(true)}
            className="text-[12px] py-2.5 px-3 rounded-lg border-none bg-[#3b82f6] text-white cursor-pointer font-medium transition-all duration-200 hover:bg-[#2563eb] w-full flex items-center justify-center"
          >
            <Add />
            add custom field
          </button>
        </div>

        {/* bottom actions */}
        <div className="flex flex-col gap-2 mt-3.5 pt-3.5">
          <button
            id="saveBtn"
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 px-2.5 rounded-lg border-none text-[12px] font-medium cursor-pointer transition-all duration-200 bg-[#101010] text-white hover:bg-[#404040] flex items-center justify-center gap-2.5"
          >
            <Save />
            save profile
          </button>

          <button
            id="resetBtn"
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 px-2.5 rounded-lg border-none text-[12px] font-medium cursor-pointer transition-all duration-200 bg-[#fc0505] text-white hover:bg-[#ff3a3a] flex items-center justify-center gap-2.5"
          >
            <Reset />
            reset google form
          </button>

          <div
            id="status"
            className="mt-1.5 text-[11px] text-center text-[#16a34a] min-h-3.5"
          >
            {status}
          </div>
        </div>

        {/* modal */}
        {showModal && (
          <Modal
            label={modalLabel}
            value={modalValue}
            error={modalError}
            onClose={() => {
              setShowModal(false);
              setModalError("");
            }}
            onLabelChange={(e) => setModalLabel(e.target.value)}
            onValueChange={(e) => setModalValue(e.target.value)}
            onAdd={handleAddCustom}
          />
        )}
      </div>
    </div>
  );
}
