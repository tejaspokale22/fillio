import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function stripPdfObjectUrl() {
  return {
    name: "strip-pdfobject-url",
    transform(code, id) {
      if (id.includes("jspdf")) {
        return code.replace(
          /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\/[\d\.]+\/pdfobject\.min\.js/g,
          "//local-pdfobject-removed-for-mv3-compliance"
        );
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), stripPdfObjectUrl()],
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 800,
    emptyOutDir: true,
  },
});
