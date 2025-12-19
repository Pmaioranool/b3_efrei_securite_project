import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

const port = Number(process.env.PORT) || 3001;

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), "VITE_");
  return {
    server: {
      port,
      host: "0.0.0.0",
    },
    plugins: [react()],
    envPrefix: "VITE_",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL(".", import.meta.url)),
      },
    },
  };
});
