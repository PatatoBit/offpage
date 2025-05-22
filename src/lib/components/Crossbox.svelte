<script lang="ts">
  export let checked = false;
  export let onChange: (value: boolean) => void;
  import { Square, SquareX } from "@lucide/svelte";

  const toggle = () => {
    checked = !checked;
    onChange?.(checked);
  };
</script>

<div
  class="checkbox"
  role="checkbox"
  aria-checked={checked}
  tabindex="0"
  on:click={toggle}
>
  {#if checked}
    <!-- Checked SVG -->
    <SquareX size="20" />
  {:else}
    <!-- Unchecked SVG -->
    <Square size="20" />
  {/if}
</div>

<style lang="scss">
  .checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: auto;
    aspect-ratio: 1;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease-in-out;

    .checked {
      background-color: #4caf50;
      border-radius: 6px;
    }

    .unchecked {
      background-color: transparent;
    }

    &:active {
      scale: 0.9;
    }
  }
</style>
