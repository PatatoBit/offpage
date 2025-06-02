<script lang="ts">
  export let checked = false;
  export let onChange: (value: boolean) => void | undefined;
  export let onClick: ((event: MouseEvent) => void) | undefined;
  import { Square, SquareCheck } from "@lucide/svelte";

  const toggle = (event: MouseEvent) => {
    checked = !checked;
    onChange?.(checked);
    onClick?.(event);
  };
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="checkbox"
  role="checkbox"
  aria-checked={checked}
  tabindex="0"
  on:click={toggle}
>
  {#if checked}
    <!-- Checked SVG -->
    <SquareCheck size="20" />
  {:else}
    <!-- Unchecked SVG -->
    <Square size="20" />
  {/if}
</div>

<style lang="scss">
  .checkbox {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease-in-out;

    &:active {
      scale: 0.9;
    }
  }
</style>
