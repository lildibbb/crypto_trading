import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [viteReact(), TanStackRouterVite()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Ensure this is correct
    },
  },
  server: {
    port: 6173,
  },
});
