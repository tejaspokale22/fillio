export default function ShortcutsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-[340px] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-[16px] font-semibold text-[#0f172a]">
            keyboard shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-[20px] leading-none border-none bg-transparent cursor-pointer p-1.5 hover:bg-gray-100 rounded-md"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-3">
            {/* Shortcut Item */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">open extension</span>
              <kbd className="px-2 py-1 text-[11px] font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                ctrl + shift + F
              </kbd>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">autofill form</span>
              <kbd className="px-2 py-1 text-[11px] font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                ctrl + L
              </kbd>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">save profile</span>
              <kbd className="px-2 py-1 text-[11px] font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                ctrl + S
              </kbd>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-600">
                reset google form
              </span>
              <kbd className="px-2 py-1 text-[11px] font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                ctrl + R
              </kbd>
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-[11px] text-gray-500">
              mac users: use{" "}
              <kbd className="text-[10px] font-semibold">cmd</kbd> instead of{" "}
              <kbd className="text-[10px] font-semibold">ctrl</kbd>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
