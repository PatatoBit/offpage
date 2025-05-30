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
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxtClUs8pzWpvqVpIJsaJxTjzeET8JpTaodC5w3UATeJkIXiZDnn/sMV2L+QSCWDFOn7wdVkZ+w+vVBMeMzvFdQLRNuZlSsQdQVjD8QbEDJAjcl/uvFXzWEwkrZOjXeKN+l8dBiNEBttuINPre9qzBAa/a++1fc3d0Fny66CCooaaTGRp1qZaXaDaia4eJpsyH2NylsSjYJ6fy+geXkt66ERW1CKkFn8JlYIxXbeifkBWYJAG2KKgmzmAjnlRo2YTFuKY6zeQwEoPInWtvc4ueSoUPSPM0/4+yQgzFW7eVV9mg26LkdwIlKq5LpRu+smsoRHUyPN+aLiEPTZGJgnFOQIDAQAB",
    description: "a community behind every page of the internet",
    permissions: ["storage", "identity", "tabs"],
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

  runner: {
    startUrls: ["https://www.example.com"],
  },
});
