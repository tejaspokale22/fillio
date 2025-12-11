import { useRef, useState } from "react";
import ImportIcon from "../../components/Import";
import Info from "../Info";

export default function ImportJSON({ onImport }) {
  const fileInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear any previous errors
    setErrorMessage("");

    // Validate file type
    if (!file.name.endsWith(".json")) {
      showError("please select a valid JSON file");
      event.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError("file size too large (max 5MB)");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      let jsonData;

      try {
        jsonData = JSON.parse(text);
      } catch (parseError) {
        showError("invalid JSON file format");
        event.target.value = "";
        return;
      }

      // Extract the profile data
      let profileData;
      if (jsonData.profile && typeof jsonData.profile === "object") {
        // Exported format with metadata
        profileData = jsonData.profile;
      } else if (typeof jsonData === "object" && !Array.isArray(jsonData)) {
        // Simple key-value format
        profileData = jsonData;
      } else {
        showError("expected an object with label-value pairs");
        event.target.value = "";
        return;
      }

      // Validate that we have data
      if (Object.keys(profileData).length === 0) {
        showError("no data found in the JSON file");
        event.target.value = "";
        return;
      }

      // Filter out invalid entries
      const validFields = [];
      let invalidCount = 0;

      Object.entries(profileData).forEach(([label, value]) => {
        // Validate label and value
        if (
          typeof label === "string" &&
          label.trim() &&
          (typeof value === "string" || typeof value === "number") &&
          String(value).trim()
        ) {
          validFields.push({
            labelKeyword: label.trim().toLowerCase(),
            value: String(value).trim(),
          });
        } else {
          invalidCount++;
        }
      });

      if (validFields.length === 0) {
        showError("no valid fields found in the JSON file");
        event.target.value = "";
        return;
      }

      // Notify parent component with valid fields, invalid count, and total count
      if (onImport) {
        const totalInFile = Object.keys(profileData).length;
        onImport(validFields, invalidCount, totalInFile);
      }
    } catch (error) {
      console.error("Error importing JSON:", error);
      showError("failed to import JSON file");
    } finally {
      event.target.value = "";
    }
  };

  const handleViewSample = () => {
    const sampleJson = {
      "company name": "TechCorp Inc.",
      position: "Software Engineer",
      "experience years": "3",
      skills: "JavaScript, React, Node.js",
      "linkedin profile": "https://linkedin.com/in/johndoe",
      "github username": "johndoe",
    };

    const jsonString = JSON.stringify(sampleJson, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-json-format.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 border-[#e2e8f0] hover:border-[#0f172a] border rounded-lg bg-white text-[#0f172a] hover:bg-[#f0f0f0]"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <button
          onClick={handleImportClick}
          className="flex-1 py-2.5 px-3 text-[12px] font-medium cursor-pointer transition-all duration-200 flex items-center justify-start gap-2.5"
        >
          <ImportIcon />
          import as JSON
        </button>
        {showInfo && (
          <button
            onClick={handleViewSample}
            className="py-2.5 px-2.5 text-[11px] font-medium cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap"
            title="view sample JSON format"
          >
            <Info />
          </button>
        )}
      </div>
      {errorMessage && (
        <div className="text-[11px] text-[#dc2626] mt-1.5 text-center">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
