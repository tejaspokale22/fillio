import { useState } from "react";
import JSONIcon from "../JSON";

export default function ExportJSON({ profile }) {
  const [error, setError] = useState("");

  const exportAsJSON = () => {
    if (!profile || typeof profile !== "object") return;

    // Filter filled fields
    const filledData = {};

    Object.entries(profile).forEach(([key, value]) => {
      if (value && String(value).trim()) {
        filledData[key] = String(value).trim();
      }
    });

    // Check if data exists
    if (Object.keys(filledData).length === 0) {
      setError("No data to export. Please fill in some fields first.");
      setTimeout(() => setError(""), 1600);
      return;
    }

    setError("");

    // Create JSON
    const jsonString = JSON.stringify(filledData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fillio-profile-${new Date().toISOString().split("T")[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={exportAsJSON}
        className="w-full py-2.5 px-3 rounded-lg border border-[#e2e8f0] text-[12px] font-medium cursor-pointer transition-all duration-200 bg-white text-[#0f172a] hover:bg-[#f0f0f0] hover:border-[#0f172a] flex items-center justify-start gap-2.5"
      >
        <JSONIcon />
        Export as JSON
      </button>

      {error && (
        <div className="text-[11px] text-[#dc2626] mt-1 text-center">
          {error}
        </div>
      )}
    </>
  );
}
