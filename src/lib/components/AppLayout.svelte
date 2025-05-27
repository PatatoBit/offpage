<script lang="ts">
  import { extensionStatus } from "@/stores/AppStatus";

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "TOGGLE_STATUS") {
      extensionStatus.update((prev) => ({ ...prev, open: message.open }));
    }
  });

  onMount(async () => {
    const { extension_status } =
      await chrome.storage.local.get("extension_status");
    if (extension_status) {
      extensionStatus.set(extension_status);
    }
  });
</script>

<div class="left-hover" class:hide={!$extensionStatus.open}>
  <div class="page" class:hide={!$extensionStatus.open}>
    <slot />
  </div>
</div>

<style lang="scss">
  @use "../styles/shadow-reset.scss";
  @use "../styles/global.scss";
  @use "../styles/variables.scss";
  @use "../styles/fonts.scss";

  .toggle-button {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  .page {
    width: 400px;
    height: 90vh;
    z-index: 100;
    background-color: var(--overlay-background);
    backdrop-filter: blur(5px);
    overflow: hidden;

    border-radius: 10px;
    border: 1px solid var(--border);
    gap: 5px;

    transition: transform 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

    display: flex;
    flex-direction: column;
  }
  .page.hide {
    transform: translateX(150%);
    pointer-events: none;
  }

  .left-hover {
    all: unset; /* Resets inherited styles */
    position: relative;
    z-index: 999999; /* Make sure it's above other content */

    position: fixed;
    top: 50%;
    right: 1rem;
    display: flex;
    transform: translateY(-50%);
  }

  .left-hover.hide {
    pointer-events: none;
  }
</style>
