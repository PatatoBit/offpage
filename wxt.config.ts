import { defineConfig } from "wxt";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: () => ({
    name: "offpage",
    description: "a community behind every page of the internet",
    permissions: ["storage", "activeTab", "identity", "tabs"],
    action: {},
    oauth2: {
      client_id:
        "128510583025-7je22o18sg3eo5h2jk1jt62q1hdvqp05.apps.googleusercontent.com",
      scopes: ["profile", "email", "openid"],
    },
    options_ui: {
      page: "entrypoints/options/index.html",
      open_in_tab: true,
    },
    service_worker: {
      src: "entrypoints/background.ts",
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
