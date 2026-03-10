import { useState } from "react";
import ExportJSON from "./more/ExportJSON";
import ExportPDF from "./more/ExportPDF";
import ImportJSON from "./more/ImportJSON";
import ResetGoogleForm from "./more/ResetGoogleForm";

export default function MoreModal({ onClose, profile, onImport }) {
  const [importStatus, setImportStatus] = useState("");

  const handleImport = (importedProfile, invalidCount, totalInFile) => {
    if (!importedProfile || typeof importedProfile !== "object") return;

    const duplicateCount = onImport(importedProfile);
    const addedCount = totalInFile - duplicateCount - invalidCount;

    const message =
      addedCount > 0
        ? `Imported ${addedCount} field(s) successfully.`
        : "No new fields imported.";

    setImportStatus(message);
    setTimeout(() => setImportStatus(""), 2000);
  };

  return (
    <div
      className="fixed z-50 inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-[90%] max-w-[320px] border border-[#e2e8f0]">
        <div className="text-[14px] font-semibold text-[#0f172a] mb-4">
          More options
        </div>

        <div className="flex flex-col gap-2">
          <ExportJSON profile={profile} />

          <ExportPDF profile={profile} />

          <ImportJSON onImport={handleImport} />

          <ResetGoogleForm />

          {importStatus && (
            <div className="text-[12px] text-[#16a34a] text-center py-1">
              {importStatus}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 px-3 rounded-lg text-[12px] font-medium bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] mt-2 cursor-pointer"
          >
            close
          </button>
        </div>
      </div>
    </div>
  );
}
