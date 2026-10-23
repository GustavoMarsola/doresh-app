import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Ports can be overridden in frontend/.env.local when 5173/8000 are taken by another app.
  const env = loadEnv(mode, __dirname, "");
  const devPort = Number(env.DEV_PORT || 5173);
  const apiPort = env.DEV_API_PORT || "8000";

  return {
    server: {
      host: "::",
      port: devPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "../backend/static",
      emptyOutDir: true,
    },
  };
});
