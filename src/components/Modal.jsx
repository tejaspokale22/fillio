export default function Modal({
  label,
  value,
  error,
  onClose,
  onLabelChange,
  onValueChange,
  onAdd,
}) {
  return (
    <div
      className="fixed z-1000 left-0 top-0 w-full h-full bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-[90%] max-w-[400px] border border-[#e2e8f0]">
        <div className="text-[14px] font-semibold text-[#0f172a] mb-3">
          add custom field
        </div>

        <div className="flex flex-col gap-2.5 mb-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#0f172a]">
              field label
            </label>
            <input
              id="modalLabelInput"
              placeholder="e.g., Aadhar Number"
              value={label}
              onChange={onLabelChange}
              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] font-[Inter,-apple-system,BlinkMacSystemFont,Segoe_UI,sans-serif] focus:border-[#0f172a] focus:bg-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-[#0f172a]">
              field value
            </label>
            <input
              id="modalValueInput"
              placeholder="e.g., Your value here"
              value={value}
              onChange={onValueChange}
              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] font-[Inter,-apple-system,BlinkMacSystemFont,Segoe_UI,sans-serif] focus:border-[#0f172a] focus:bg-white"
            />
          </div>
          {error && (
            <div className="text-[11px] text-[#ef4444] mt-1">{error}</div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            id="modalCancelBtn"
            onClick={onClose}
            className="py-2 px-3.5 rounded-md border-none text-[12px] font-medium cursor-pointer transition-all duration-150 bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1]"
          >
            cancel
          </button>
          <button
            id="modalConfirmBtn"
            onClick={onAdd}
            className="py-2 px-3.5 rounded-md border-none text-[12px] font-medium cursor-pointer transition-all duration-150 bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          >
            add field
          </button>
        </div>
      </div>
    </div>
  );
}
