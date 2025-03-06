<script lang="ts">
import { extensionStatus } from "@/stores/AppStatus";

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE_STATUS") {
    extensionStatus.set({ open: message.open });
  }
});
</script>

<div class="left-hover">
  <div class="page" class:hide={!$extensionStatus.open}>
    <slot />
  </div>
</div>

<style lang="scss">
@use "../styles/variables.scss";
@use "../styles/fonts.scss";

.toggle-button {
  position: absolute;
  bottom: 0;
  right: 0;
}

.hide {
  transform: translateX(150%);
}

.page {
  width: 300px;
  height: 90vh;
  z-index: 100;
  padding-inline: 1.5rem;

  border-radius: 0.8rem;
  background-color: var(--background);
  box-shadow: 1px 9px 10px 2px rgba(0, 0, 0, 0.16);
  -webkit-box-shadow: 1px 9px 10px 2px rgba(0, 0, 0, 0.16);
  -moz-box-shadow: 1px 9px 10px 2px rgba(0, 0, 0, 0.16);

  gap: 1rem;

  transition: transform 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);
}

.left-hover {
  position: fixed;
  top: 50%;
  right: 1rem;

  display: flex;

  transform: translateY(-50%);
}
</style>
