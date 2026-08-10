import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        home: path.join(root, "index.html"),
        works: path.join(root, "works", "index.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx", "./src/works/main.jsx"],
    },
  },
  plugins: [react()],
});
