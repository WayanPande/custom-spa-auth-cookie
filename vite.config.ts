import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// https://vitejs.dev/config/
// @ts-ignore
export default ({ mode }) => {
  // @ts-ignore
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [TanStackRouterVite({}), react()],
    // @ts-ignore
    base: `/${process.env.VITE_ASSET_PATH ?? ""}`,
  });
};
