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
import Spinner from "./components/Spinner";
import { FIELDS } from "./utils/constants";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { normalize, showStatus } from "./utils/tools.js";

export default function Popup() {
  const [profile, setProfile] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [modalLabel, setModalLabel] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [fillStatus, setFillStatus] = useState("");
  const [status, setStatus] = useState("");
  const [modalError, setModalError] = useState("");
  const [copiedField, setCopiedField] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const addField = () => {
    const label = modalLabel?.trim();
    const value = modalValue?.trim();

    if (!label) {
      setModalError("Field label cannot be empty.");
      setTimeout(() => setModalError(""), 1600);
      return;
    }

    const normalizedLabel = normalize(label);

    const exists = Object.keys(profile).some((key) => key === normalizedLabel);

    if (exists) {
      setModalError("This field label already exists.");
      setTimeout(() => setModalError(""), 1600);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      [normalizedLabel]: value,
    }));

    setModalLabel("");
    setModalValue("");
    setModalError("");
    setShowModal(false);
  };

  const updateField = (key, value) =>
    setProfile((p) => ({ ...p, [key]: value }));

  const removeField = (key) =>
    setProfile((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

  const handleSave = () => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      showStatus(setStatus, "Chrome extension API not available.", 1600);
      return;
    }

    chrome.storage.sync.set({ profile }, () =>
      showStatus(setStatus, "saved ✅", 1600),
    );
  };

  const handleAutofill = () => {
    if (loading) return;

    if (typeof chrome === "undefined" || !chrome.tabs) {
      showStatus(setFillStatus, "Chrome extension API not available.", 1600);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];

      if (!tab) {
        showStatus(
          setFillStatus,
          "No active tab found. Open the Google Form tab first.",
          1600,
        );
        return;
      }

      if (!tab.url?.includes("docs.google.com/forms")) {
        showStatus(setFillStatus, "Please open a Google Form tab first.", 1600);
        return;
      }

      setLoading(true);

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
                    "Failed to load. Please refresh the page.",
                    1600,
                  );
                  setLoading(false);
                  return;
                }

                setTimeout(sendFillMessage, 100);
              },
            );
            return;
          }

          if (!response?.success) {
            showStatus(
              setFillStatus,
              response?.message || "Autofill failed.",
              1600,
            );
            setLoading(false);
            return;
          }

          if (response.filledCount > 0) {
            showStatus(
              setFillStatus,
              `Filled ${response.filledCount} field(s) successfully.`,
              1600,
            );
          } else {
            showStatus(setFillStatus, "No fields found to autofill.", 1600);
          }

          setLoading(false);
        });
      };

      try {
        sendFillMessage();
      } catch {
        showStatus(
          setFillStatus,
          "Unable to trigger fill. Please re-open the form.",
          1600,
        );
        setLoading(false);
      }
    });
  };

  const handleReset = () => {
    if (typeof chrome === "undefined" || !chrome.tabs) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];

      if (!tab?.url?.includes("docs.google.com/forms")) return;

      chrome.tabs.sendMessage(tab.id, { action: "RESET_FORM" }, (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ["content.js"],
            },
            () => {
              chrome.tabs.sendMessage(tab.id, { action: "RESET_FORM" });
            },
          );

          return;
        }
      });
    });
  };

  const handleImportProfile = (importedProfile) => {
    if (!importedProfile || typeof importedProfile !== "object") return 0;

    let duplicateCount = 0;
    const updates = {};

    Object.entries(importedProfile).forEach(([key, value]) => {
      const label = key?.trim();
      if (!label) return;

      const normalizedLabel = normalize(label);

      // find matching existing key
      const existingKey = Object.keys(profile).find(
        (k) => normalize(k) === normalizedLabel,
      );

      if (existingKey) {
        const existingValue = profile[existingKey];

        if (!existingValue || !existingValue.trim()) {
          updates[existingKey] = value ?? "";
        } else {
          duplicateCount++;
        }

        return;
      }

      updates[label] = value ?? "";
    });

    if (Object.keys(updates).length > 0) {
      setProfile((prev) => ({
        ...prev,
        ...updates,
      }));
    }

    return duplicateCount;
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

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    chrome.storage.sync.get(["profile"], ({ profile }) => {
      const storedProfile =
        profile ?? Object.fromEntries(FIELDS.map((f) => [f, ""]));

      const orderedProfile = {
        ...Object.fromEntries(
          FIELDS.filter((k) => k in storedProfile).map((k) => [
            k,
            storedProfile[k],
          ]),
        ),
        ...Object.fromEntries(
          Object.entries(storedProfile).filter(([k]) => !FIELDS.includes(k)),
        ),
      };

      setProfile(orderedProfile);
    });
  }, []);

  useKeyboardShortcuts(
    {
      onSave: handleSave,
      onAutofill: handleAutofill,
      onReset: handleReset,
    },
    [profile],
  );

  return (
    <div className="m-2 bg-white border border-black rounded-md overflow-hidden h-[580px] w-[380px]">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-black shrink-0 bg-black/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-[19px] font-semibold m-0 text-[#0f172a]">
                  Fillio - Autofill google forms
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
              onClick={handleAutofill}
              disabled={loading}
              className="w-full h-9 rounded-md border-none text-[13px] font-semibold cursor-pointer bg-[#02a36e] text-white transition-all duration-200 hover:bg-[#059669] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <Autofill />
                  <span>autofill google form</span>
                </>
              )}
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
        <div className="flex-1 overflow-y-auto px-2.5 pb-1.5 my-3">
          {Object.keys(profile).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <img
                src="/no-fields-available.png"
                alt="No fields available"
                className="w-40 h-32 mb-2"
              />
              <p className="text-[13px] text-gray-500 font-medium mb-1.5">
                No fields available.
              </p>
              <p className="text-[11px] text-gray-400">
                Add fields or import from JSON to get started.
              </p>
            </div>
          ) : (
            <>
              <Search
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {(() => {
                const filteredFields = Object.entries(profile).filter(([key]) =>
                  key.toLowerCase().includes(searchQuery.toLowerCase()),
                );

                if (searchQuery && filteredFields.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center px-4 py-8">
                      <img
                        src="/no-search-results.png"
                        alt="No search results"
                        className="w-36 h-36"
                      />
                      <p className="text-[13px] text-gray-500 font-medium mb-1">
                        No results found.
                      </p>
                      <p className="text-[11px] text-gray-400">
                        No fields matching "{searchQuery}"
                      </p>
                    </div>
                  );
                }

                return filteredFields.map(([key, value]) => (
                  <div key={key} className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="text-[11px] text-[#0f172a] m-0">
                        {key}
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(key, value)}
                          className="border-none bg-transparent text-[#0f172a] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(15,23,42,0.1)]"
                          title="copy"
                        >
                          {copiedField === key ? <Tick /> : <Copy />}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeField(key)}
                          className="border-none bg-transparent text-[#dc2626] cursor-pointer p-0.5 flex items-center justify-center w-5 h-5 rounded transition-colors duration-200 hover:bg-[rgba(220,38,38,0.1)]"
                          title="remove"
                        >
                          <Trash />
                        </button>
                      </div>
                    </div>

                    <input
                      id={key}
                      value={value || ""}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
                    />
                  </div>
                ));
              })()}
            </>
          )}
        </div>

        {/* Fixed bottom section */}
        <div className="border-t border-black px-2.5 pb-2 pt-2.5 shrink-0 bg-black/5">
          {/* add custom field */}
          <div className="mb-2">
            <button
              id="addFieldBtn"
              type="button"
              onClick={() => setShowModal(true)}
              className="text-[12px] py-1 rounded-xl border border-[#3b82f6] bg-[#eff6ff] text-[#3b82f6] cursor-pointer font-medium transition-all duration-200 hover:bg-[#dbeafe] w-full flex items-center justify-center"
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
            onAdd={addField}
          />
        )}

        {/* more modal */}
        {showMoreModal && (
          <MoreModal
            onClose={() => setShowMoreModal(false)}
            profile={profile}
            onImport={handleImportProfile}
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
