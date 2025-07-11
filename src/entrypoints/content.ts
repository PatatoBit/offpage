import Content from "./content/App.svelte";
import { mount } from "svelte";

import "@/lib/styles/global.scss";
import "@/lib/styles/fonts.scss";

export default defineContentScript({
  allFrames: false,
  matches: ["https://*/*"],
  excludeMatches: [
    "*://localhost/*",
    "*://127.0.0.1/*",
    "*://*.csdn.net/*",
    "*://*.csdn.com/*",
    "*://*.accounts.google.com/*",
  ],
  cssInjectionMode: "ui",
  runAt: "document_idle",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "offpage-ui",
      position: "inline",
      anchor: "body",
      append: "last",
      mode: "open",
      isolateEvents: ["keyup", "keydown", "keypress"],
      onMount(container) {
        const wrapper = document.createElement("div");
        container.append(wrapper);

        mount(Content, {
          target: wrapper,
        });

        return wrapper;
      },

      onRemove(container) {
        container?.remove();
      },
    });

    ui.mount();

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "toggle-ui") {
        if (ui.mounted) {
          ui.remove();
        } else {
          ui.mount();
        }
      }
    });

    // --- URL change detection ---
    function notifyUrlChange(url: string) {
      window.postMessage({ type: "OFFPAGE_URL_CHANGED", url }, "*");
    }

    let lastUrl = window.location.href;
    notifyUrlChange(lastUrl);

    // Observe DOM mutations (for some SPA navigations)
    const observer = new MutationObserver(() => {
      const url = window.location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        notifyUrlChange(url);
      }
    });
    observer.observe(document, { subtree: true, childList: true });

    // Patch history API (for pushState/replaceState)
    const origPushState = history.pushState;
    history.pushState = function (...args) {
      origPushState.apply(this, args);
      notifyUrlChange(window.location.href);
    };
    const origReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      notifyUrlChange(window.location.href);
    };
    window.addEventListener("popstate", () =>
      notifyUrlChange(window.location.href),
    );
  },
});
