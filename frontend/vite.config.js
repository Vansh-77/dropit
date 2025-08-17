import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      stream: "stream-browserify",
      buffer: "buffer",
      util: "util",
      events: "events",
      process: "process/browser",
    },
  },
  define: {
    global: "window", 
  },
  optimizeDeps: {
    include: ["buffer", "process", "events", "util", "stream-browserify"],
  },
});
