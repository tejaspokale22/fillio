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
      className="fixed z-50 inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] w-[90%] max-w-[400px] border border-[#e2e8f0]">
        <div className="text-[15px] font-semibold text-[#0f172a] mb-3">
          Add field
        </div>

        <div className="flex flex-col gap-2.5 mb-3.5">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#0f172a]">
              Field label
              <span className="block text-[10px] text-gray-500 font-normal mt-0.5">
                Tip - Use meaningful names
              </span>
            </label>

            <input
              id="modalLabelInput"
              placeholder="e.g. aadhar number"
              value={label}
              onChange={onLabelChange}
              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium text-[#0f172a]">
              Field value
            </label>

            <input
              id="modalValueInput"
              placeholder="e.g. your value here"
              value={value}
              onChange={onValueChange}
              className="w-full py-[7px] px-2 text-[12px] rounded-md border border-[#e2e8f0] outline-none bg-[#f9fafb] focus:border-[#0f172a] focus:bg-white"
            />
          </div>

          {error && (
            <div className="text-[12px] text-[#ef4444] mt-1">{error}</div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            id="modalCancelBtn"
            onClick={onClose}
            className="py-2 px-3.5 rounded-md text-[12px] font-medium bg-[#e2e8f0] text-[#475569] hover:bg-[#cbd5e1] cursor-pointer"
          >
            close
          </button>

          <button
            id="modalConfirmBtn"
            onClick={onAdd}
            className="py-2 px-3.5 rounded-md text-[12px] font-medium bg-[#3b82f6] text-white hover:bg-[#2563eb] cursor-pointer"
          >
            add field
          </button>
        </div>
      </div>
    </div>
  );
}
