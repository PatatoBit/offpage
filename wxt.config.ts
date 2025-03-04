import { defineConfig } from "wxt";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: () => ({
    name: "Name",
    description: "My extension description",
    permissions: ["storage", "activeTab", "identity"],
    oauth2: {
      client_id:
        "128510583025-7je22o18sg3eo5h2jk1jt62q1hdvqp05.apps.googleusercontent.com",
      scopes: ["profile", "email", "openid"],
    },
    web_accessible_resources: [
      {
        resources: ["dashboard.html"],
        matches: ["*://*/*"],
      },
    ],
    entrypoints: {
      // // Existing entry points
      // background: "src/entrypoints/background.ts",
      // popup: "src/entrypoints/popup/popup.ts",
      // dashboard: "src/entrypoints/dashboard/dashboard.ts",
      // // Updated content script entry point
      content: "src/entrypoints/content/content.ts",
    },
  }),
  vite: () => ({
    plugins: [wasm(), topLevelAwait()],
    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
  }),

  runner: {
    startUrls: ["https://www.example.com"],
  },
});
