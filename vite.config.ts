import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Babel-based: no native binary, so the Cloudflare build cannot fail on a missing SWC binding
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
