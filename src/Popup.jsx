import { useState, useEffect } from "react";
import Autofill from "./components/Autofill";
import Save from "./components/Save";
import Add from "./components/Add";
import Trash from "./components/Trash";
import Copy from "./components/Copy";
import Tick from "./components/Tick";
import Modal from "./components/Modal";
import More from "./components/More";
import MoreModal from "./components/MoreModal";
import Info from "./components/Info";
import ShortcutsModal from "./components/ShortcutsModal";
import Search from "./components/Search";
import { FIELDS } from "./utils/constants";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function Popup() {
  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [modalLabel, setModalLabel] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [removedKeys, setRemovedKeys] = useState(new Set());
  const [fillStatus, setFillStatus] = useState("");
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [copiedField, setCopiedField] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (key, value) =>
    setFormData((p) => ({ ...p, [key]: value }));

  const handleRemoveField = (key) => {
    setFormData((p) => {
      const cp = { ...p };
      cp[key] = "";
      return cp;
    });
    setRemovedKeys((s) => {
      const ns = new Set(s);
      ns.add(key);
      return ns;
    });

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
      setModalError("field label cannot be empty");
      return;
    }

    setCustomFields((p) => [...p, { labelKeyword, value }]);
    setModalLabel("");
    setModalValue("");
    setModalError("");
    setShowModal(false);
  };

  const handleImportFields = (importedFields) => {
    if (!importedFields || importedFields.length === 0) return 0;

    // map of existing fields → { type, key/index, value }
    const existingFieldMap = new Map();

    // standard fields
    FIELDS.forEach((f) => {
      if (!removedKeys.has(f.key)) {
        const value = formData[f.key];
        existingFieldMap.set(f.label.toLowerCase(), {
          type: "standard",
          key: f.key,
          value: value || "",
        });
      }
    });

    // custom fields
    customFields.forEach((f, idx) => {
      existingFieldMap.set(f.labelKeyword.toLowerCase(), {
        type: "custom",
        index: idx,
        value: f.value || "",
      });
    });

    let duplicateCount = 0;
    const newFields = [];
    const updatedStandardFields = {};
    const customFieldUpdates = new Map();

    importedFields.forEach((field) => {
      const label = field.labelKeyword.toLowerCase();
      const existing = existingFieldMap.get(label);

      if (existing) {
        // Field exists
        if (existing.value.trim().length > 0) {
          // Has value - consider duplicate
          duplicateCount++;
        } else {
          // Empty value - update with imported value
          if (existing.type === "standard") {
            updatedStandardFields[existing.key] = field.value;
          } else {
            customFieldUpdates.set(existing.index, field.value);
          }
        }
      } else {
        // Field doesn't exist - add as new
        newFields.push(field);
      }
    });

    // Apply updates to standard fields
    if (Object.keys(updatedStandardFields).length > 0) {
      setFormData((prev) => ({ ...prev, ...updatedStandardFields }));
    }

    // Apply updates to custom fields
    if (customFieldUpdates.size > 0) {
      setCustomFields((prev) =>
        prev.map((field, idx) =>
          customFieldUpdates.has(idx)
            ? { ...field, value: customFieldUpdates.get(idx) }
            : field
        )
      );
    }

    // Add new fields as custom fields
    if (newFields.length > 0) {
      setCustomFields((prev) => [...prev, ...newFields]);
    }

    return duplicateCount;
  };

  const removeCustom = (i) =>
    setCustomFields((p) => p.filter((_, idx) => idx !== i));

  const updateCustomField = (index, value) => {
    setCustomFields((prev) =>
      prev.map((field, idx) => (idx === index ? { ...field, value } : field))
    );
  };

  const handleCopy = async (fieldKey, value) => {
    if (!value || !String(value).trim()) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1600);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const showStatus = (setter, message, duration = 1600) => {
    setter(message);
    setTimeout(() => setter(""), duration);
  };

  const handleSave = () => {
    const visibleStandardFields = FIELDS.filter((f) => !removedKeys.has(f.key));
    const hasVisibleFields =
      visibleStandardFields.length > 0 || customFields.length > 0;

    if (!hasVisibleFields) {
      showStatus(
        setStatus,
        "please add at least one field before saving",
        1600
      );
      return;
    }

    const validCustomFields = customFields.filter(
      (field) => field.labelKeyword && field.labelKeyword.trim()
    );

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
          "no active tab found. open the google form tab",
          1600
        );
        return;
      }

      const tab = tabs[0];
      if (!tab.url || !tab.url.includes("docs.google.com/forms")) {
        showStatus(setFillStatus, "please open a google form tab first", 1600);
        return;
      }

      const sendFillMessage = () => {
        chrome.tabs.sendMessage(tab.id, { action: "FILL_FORM" }, (response) => {
          if (chrome.runtime.lastError) {
            chrome.scripting.executeScript(
              {
                target: { tabId: tab.id },
                files: ["content.js"],
              },
              () => {
                if (chrome.runtime.lastError) {
                  showStatus(
                    setFillStatus,
                    "failed to load. please refresh the page",
                    1600
                  );
                } else {
                  setTimeout(() => sendFillMessage(), 100);
                }
              }
            );
          } else if (response && !response.success) {
            showStatus(setFillStatus, response.message, 1600);
          } else if (response && response.success) {
            showStatus(
              setFillStatus,
              `filled ${response.filledCount} field(s) successfully`,
              1600
            );
          }
        });
      };

      try {
        sendFillMessage();
      } catch (e) {
        showStatus(
          setFillStatus,
          "unable to trigger fill. please reopen the form",
          1600
        );
      }
    });
  };

  const handleReset = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];
      if (!tab?.url?.includes("docs.google.com/forms")) return;

      chrome.tabs.sendMessage(tab.id, { action: "RESET_FORM" });
    });
  };

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

  // Keyboard shortcuts
  useKeyboardShortcuts(
    {
      onSave: handleSave,
      onAutofill: handleFill,
      onReset: handleReset,
    },
    [formData, customFields, removedKeys]
  );

  return (
    <div className="m-2 bg-white border border-black rounded-md overflow-hidden h-[580px]">
      <div className="w-[380px] flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-black shrink-0 bg-black/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-[20px] font-semibold m-0 text-[#0f172a]">
                  Autofill Google Forms{" "}
                </h1>
              </div>
              <div className="text-[12px] text-gray-500 mb-0 w-[85%]">
                Save your details once and reuse them across similar google
                forms.
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowShortcutsModal(true)}
                className="border-none bg-transparent text-[#0f172a] cursor-pointer p-2 flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                title="keyboard shortcuts"
              >
                <Info />
              </button>
              <button
                onClick={() => setShowMoreModal(true)}
                className="border-none bg-transparent text-[#0f172a] cursor-pointer p-2 flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                title="more options"
              >
                <More />
              </button>
            </div>
          </div>

          {/* Primary action button */}
          <div className="flex flex-col gap-2">
            <button
              id="fillBtn"
              title="ctrl + L"
              type="button"
              onClick={handleFill}
              className="w-full py-2 rounded-md border-none text-[13px] font-semibold cursor-pointer bg-[#02a36e] text-white transition-all duration-200 hover:bg-[#059669] flex items-center justify-center gap-2"
            >
              <Autofill />
              autofill google form
            </button>
            <div
              id="fillStatus"
              className="text-[12px] text-center text-[#16a34a]"
            >
              {fillStatus}
            </div>
          </div>
        </div>

        {/* Fields list - scrollable */}
        <div className="flex-1 overflow-y-auto px-2 pb-1.5 my-3">
          {FIELDS.filter((f) => !removedKeys.has(f.key)).length === 0 &&
          customFields.length === 0 ? (
            <div className="text-center py-2 px-4">
              <p className="text-[13px] text-gray-400 mb-2">
                no fields available
              </p>
              <p className="text-[11px] text-gray-400">
                add custom fields or import from JSON to get started
              </p>
            </div>
          ) : (
            <>
              {/* Search component */}
              <Search
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {(() => {
                const filteredStandardFields = FIELDS.filter(
                  (f) =>
                    !removedKeys.has(f.key) &&
                    f.label.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const filteredCustomFields = customFields.filter((c) =>
                  c.labelKeyword
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                );
                const hasResults =
                  filteredStandardFields.length > 0 ||
                  filteredCustomFields.length > 0;

                if (searchQuery && !hasResults) {
                  return (
                    <div className="text-center py-4 px-4">
                      <p className="text-[13px] text-gray-400">
                        no fields found matching "{searchQuery}"
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {filteredStandardFields.map((f) =>
                      !removedKeys.has(f.key) ? (
                        <div key={f.key} className="mb-3">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <label className="text-[11px] text-[#0f172a] m-0">
                              {f.label}
                            </label>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(f.key, formData[f.key])
                                }
                                className="border-none bg-transparent text-[#0f172a] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                                title="copy"
                              >
                                {copiedField === f.key ? <Tick /> : <Copy />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveField(f.key)}
                                className="border-none bg-transparent text-[#dc2626] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(220,38,38,0.1)]"
                                title="remove"
                              >
                                <Trash />
                              </button>
                            </div>
                          </div>

                          {f.textarea ? (
                            <textarea
                              id={f.key}
                              value={formData[f.key] || ""}
                              onChange={(e) =>
                                handleChange(f.key, e.target.value)
                              }
                              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] resize-y min-h-[50px] focus:border-[#0f172a] focus:bg-white"
                            />
                          ) : (
                            <input
                              id={f.key}
                              value={formData[f.key] || ""}
                              onChange={(e) =>
                                handleChange(f.key, e.target.value)
                              }
                              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
                            />
                          )}
                        </div>
                      ) : null
                    )}

                    {/* custom fields */}
                    <div id="customList">
                      {filteredCustomFields.map((c, i) => {
                        const originalIndex = customFields.findIndex(
                          (field) =>
                            field.labelKeyword === c.labelKeyword &&
                            field.value === c.value
                        );
                        return (
                          <div key={i} className="mb-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] text-[#0f172a] m-0">
                                {c.labelKeyword}
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(`custom-${i}`, c.value)
                                  }
                                  className="border-none bg-transparent text-[#0f172a] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                                  title="copy"
                                >
                                  {copiedField === `custom-${i}` ? (
                                    <Tick />
                                  ) : (
                                    <Copy />
                                  )}
                                </button>
                                <button
                                  onClick={() => removeCustom(originalIndex)}
                                  className="border-none bg-transparent text-[#dc2626] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(220,38,38,0.1)]"
                                  type="button"
                                  title="remove"
                                >
                                  <Trash />
                                </button>
                              </div>
                            </div>
                            <input
                              value={c.value}
                              onChange={(e) =>
                                updateCustomField(originalIndex, e.target.value)
                              }
                              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>

        {/* Fixed bottom section */}
        <div className="border-t border-black px-2.5 pb-2 pt-2.5 shrink-0 bg-black/5">
          {/* add custom field */}
          <div className="mb-2">
            <button
              id="addCustomBtn"
              type="button"
              onClick={() => setShowModal(true)}
              className="text-[12px] py-1 rounded-xl border border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6] cursor-pointer font-medium transition-all duration-200 hover:bg-[#dbeafe] w-full flex items-center justify-center gap-2"
            >
              <Add />
              add custom field
            </button>
          </div>

          {/* bottom actions */}
          <div className="flex flex-col gap-2">
            <button
              id="saveBtn"
              title="ctrl + S"
              type="button"
              onClick={handleSave}
              className="w-full py-1.5 rounded-md border-none text-[12px] font-medium cursor-pointer transition-all duration-200 bg-[#101010] text-white hover:bg-[#404040] flex items-center justify-center gap-2.5"
            >
              <Save />
              save profile
            </button>

            <div id="status" className="text-[12px] text-center text-[#16a34a]">
              {status}
            </div>
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

        {/* more modal */}
        {showMoreModal && (
          <MoreModal
            onClose={() => setShowMoreModal(false)}
            formData={formData}
            customFields={customFields}
            fields={FIELDS}
            onImportFields={handleImportFields}
          />
        )}

        {/* shortcuts modal */}
        {showShortcutsModal && (
          <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
        )}
      </div>
    </div>
  );
}
