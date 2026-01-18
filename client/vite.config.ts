import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./", // Relative paths for Electron file:// protocol
  server: {
    port: 5173,
    strictPort: true, // Fail if port is in use (important for Electron dev)
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // Disable buffering for SSE
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // For SSE endpoints, we need special handling
            if (req.url?.includes("/api/download")) {
              proxyReq.setHeader("Connection", "keep-alive");
            }
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            // Disable buffering for SSE
            if (req.url?.includes("/api/download")) {
              proxyRes.headers["cache-control"] = "no-cache";
              proxyRes.headers["x-accel-buffering"] = "no";
            }
          });
        },
      },
    },
  },
});
