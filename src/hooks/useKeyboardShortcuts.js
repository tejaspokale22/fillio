import { useEffect } from "react";

export function useKeyboardShortcuts(handlers, deps = []) {
  useEffect(() => {
    function onKeyDown(e) {
      if (!e.ctrlKey) return;

      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        handlers.onSave?.();
      }

      if (key === "l") {
        e.preventDefault();
        handlers.onAutofill?.();
      }

      if (key === "r") {
        e.preventDefault();
        handlers.onReset?.();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, deps);
}
