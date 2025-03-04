<script lang="ts">
import { fly } from "svelte/transition";
import { extensionStatus } from "@/stores/AppStatus";
import closeButton from "../../assets/icons/cross.svg";

function togglePopup() {
  extensionStatus.update((status) => {
    status.open = !status.open;
    return status;
  });
}
</script>

<div class="left-hover">
  <div class="page" class:hide={!$extensionStatus.open}>
    <slot />
  </div>

  <button class="toggle-button" on:click={togglePopup}> offpage </button>
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
  opacity: 0;
}

.page {
  top: 1rem;
  right: 1rem;

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

  transition: opacity 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

  button {
    cursor: pointer;
  }
}

.left-hover {
  position: fixed;
  top: 1rem;
  right: 1rem;
  height: 95vh;

  display: flex;
  flex-direction: column;
}
</style>
