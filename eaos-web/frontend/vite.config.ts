import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
// Import obfuscator at the top if possible, or use require if needed for sync
import obfuscatorPlugin from "rollup-plugin-obfuscator";

export default defineConfig(({ mode }) => {
  const frontendEnv = loadEnv(mode, __dirname, "");
  const appEnv = loadEnv(mode, path.resolve(__dirname, "../app"), "");
  // ... common env logic ...
  const supabaseUrlServer = frontendEnv.VITE_SUPABASE_URL || appEnv.SUPABASE_URL || "";
  const projectRef = /^https:\/\/([a-z0-9-]+)\.supabase\.co/i.exec(supabaseUrlServer)?.[1] || "";
  const adminFunctionUrl =
    frontendEnv.VITE_SUPABASE_ADMIN_FUNCTION_URL ||
    appEnv.SUPABASE_ADMIN_FUNCTION_URL ||
    (projectRef ? `https://${projectRef}.functions.supabase.co/admin-actions` : "");
  const paymentFunctionUrl =
    frontendEnv.VITE_SUPABASE_PAYMENT_FUNCTION_URL ||
    appEnv.SUPABASE_PAYMENT_FUNCTION_URL ||
    (projectRef ? `https://${projectRef}.functions.supabase.co/razorpay-payments` : "");

  const exposedEnv = {
    VITE_SUPABASE_URL: frontendEnv.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY: frontendEnv.VITE_SUPABASE_ANON_KEY || "",
    VITE_SUPABASE_ADMIN_FUNCTION_URL: adminFunctionUrl,
    VITE_SUPABASE_PAYMENT_FUNCTION_URL: paymentFunctionUrl,
    VITE_RAZORPAY_KEY_ID: frontendEnv.VITE_RAZORPAY_KEY_ID || "",
    VITE_WINDOWS_DOWNLOAD_URL:
      appEnv.WINDOWS_DOWNLOAD_URL || frontendEnv.VITE_WINDOWS_DOWNLOAD_URL || "",
    VITE_MAC_DOWNLOAD_URL:
      appEnv.MAC_DOWNLOAD_URL || frontendEnv.VITE_MAC_DOWNLOAD_URL || "",
    VITE_APK_DOWNLOAD_URL:
      appEnv.APK_DOWNLOAD_URL || frontendEnv.VITE_APK_DOWNLOAD_URL || "",
  };

  const obfuscationPlugins: any[] = [];
  if (mode === "production") {
    try {
      const obfuscatorOptions = {
        exclude: [/node_modules/, /vendor/, /mui/, /radix/],
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.1,
          deadCodeInjection: false,
          stringArray: true,
          stringArrayEncoding: ["base64"],
          stringArrayThreshold: 0.75,
          selfDefending: false,
        },
      };
      obfuscationPlugins.push(
        (obfuscatorPlugin as any).default?.(obfuscatorOptions) ||
        obfuscatorPlugin(obfuscatorOptions)
      );
    } catch (e) {
      console.warn("[vite] rollup-plugin-obfuscator failed to load:", e);
    }
  }

  return {
    plugins: [react(), tailwindcss(), ...obfuscationPlugins],
    define: Object.fromEntries(
      Object.entries(exposedEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
    build: {
      outDir: "dist",
      minify: "terser",
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router"],
            mui: ["@mui/material", "@mui/icons-material"],
            radix: [
              "@radix-ui/react-accordion",
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
            ],
          },
        },
      },
    },
  };
});
