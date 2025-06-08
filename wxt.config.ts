import { defineConfig } from "wxt";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  publicDir: "src/public",
  modules: ["@wxt-dev/module-svelte", "@wxt-dev/auto-icons"],
  manifest: () => ({
    name: "offpage",
    key: import.meta.env.VITE_EXTENSION_KEY,
    description: "a community behind every page of the internet",
    permissions: ["storage", "identity", "tabs"],
    action: {},
    oauth2: () => ({
      client_id: import.meta.env.WXT_OAUTH_CLIENT_ID,
      scopes: ["profile", "email", "openid"],
    }),
    options_ui: {
      page: "entrypoints/options/index.html",
      open_in_tab: true,
    },
  }),

  vite: () => ({
    plugins: [wasm(), topLevelAwait()],

    resolve: {
      alias: {
        $lib: path.resolve("./src/lib"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
  }),

  webExt: {
    chromiumArgs: ["--disable-features=DisableLoadExtensionCommandLineSwitch"],
    startUrls: ["https://www.example.com"],
  },
});
