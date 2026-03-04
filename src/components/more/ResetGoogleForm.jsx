import { useState } from "react";
import { RotateCcw } from "lucide-react";

export default function ResetGoogleForm() {
  const [error, setError] = useState("");

  const handleReset = () => {
    setError("");
    if (typeof chrome === "undefined" || !chrome.tabs) {
      setError("chrome api not available.");
      setTimeout(() => setError(""), 1600);
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs?.[0];

      if (!tab?.url?.includes("docs.google.com/forms")) {
        setError("please open a google form tab first.");
        setTimeout(() => setError(""), 1600);
        return;
      }
      chrome.tabs.sendMessage(tab.id, { action: "RESET_FORM" });
      // close extension popup
      window.close();
    });
  };

  return (
    <>
      <button
        onClick={handleReset}
        className="w-full py-2.5 px-3 rounded-lg border border-[#e2e8f0] text-[12px] font-medium cursor-pointer transition-all duration-200 bg-white text-[#0f172a] hover:bg-[#f0f0f0] hover:border-[#0f172a] flex items-center justify-start gap-2.5"
      >
        <RotateCcw size={21} strokeWidth={2} />
        reset google form
      </button>

      {error && (
        <div className="text-[11px] text-[#dc2626] mt-1 text-center">
          {error}
        </div>
      )}
    </>
  );
}
