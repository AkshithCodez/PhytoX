import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: local("./"),
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    fs: { allow: [local("../../")] },
  },
  resolve: {
    alias: {
      "@": local("../../src"),
      "next/link": local("./link.tsx"),
      "next/navigation": local("./navigation.ts"),
      "next/dynamic": local("./dynamic.tsx"),
    },
  },
  define: {
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '""',
    "process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY": '""',
  },
  css: { postcss: local("../../") },
});
