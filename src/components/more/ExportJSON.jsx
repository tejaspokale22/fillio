import { useState } from "react";
import JSONIcon from "../JSON";

export default function ExportJSON({ formData, customFields, fields }) {
  const [error, setError] = useState("");

  const exportAsJSON = () => {
    // Filter out empty fields
    const filledData = {};

    // Add filled standard fields
    fields.forEach((field) => {
      const value = formData[field.key];
      if (value && value.trim()) {
        filledData[field.label] = value;
      }
    });

    // Add filled custom fields
    if (customFields && customFields.length > 0) {
      customFields.forEach((field) => {
        if (field.value && field.value.trim()) {
          filledData[field.labelKeyword] = field.value;
        }
      });
    }

    // Check if there's any data to export
    if (Object.keys(filledData).length === 0) {
      setError("no data to export. please fill in some fields first.");
      setTimeout(() => setError(""), 1600);
      return;
    }

    // Clear any previous errors
    setError("");

    // Create formatted JSON with metadata
    const exportData = filledData;

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `google-form-profile-${
      new Date().toISOString().split("T")[0]
    }.json`;
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
        export as JSON
      </button>
      {error && <div className="text-[11px] text-[#dc2626] mt-1">{error}</div>}
    </>
  );
}
