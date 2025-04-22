<script lang="ts">
  import { SlidersHorizontal } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { extensionStatus } from "@/stores/AppStatus";
  import { get } from "svelte/store";

  let isOpen = $state(true);
  let status = $derived($extensionStatus);
</script>

<div class="options-row">
  <div class="filter">
    <button class="icon-button" onclick={() => (isOpen = !isOpen)}>
      <SlidersHorizontal class="lucide" size={16} />
    </button>

    {#if isOpen}
      <div
        class="filter-popup-content"
        in:fly={{ y: -10, duration: 200 }}
        out:fly={{ y: -10, duration: 200 }}
      >
        <label>
          <input
            type="checkbox"
            checked={status.filterBadwords}
            onchange={(e) =>
              extensionStatus.set({
                ...status,
                filterBadwords: e.currentTarget.checked,
              })}
          />
          Block bad words
        </label>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .options-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;

    gap: 8px;
    padding-inline: 16px;
  }

  .filter {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .filter-popup-content {
      display: flex;
      flex-direction: column;
      position: absolute;

      width: 160px;
      top: 100%;
      right: 0;
      border: 1px solid var(--highlight);
      border-radius: 8px;
      background-color: var(--background);

      padding: 16px;
      z-index: 10;

      label {
        display: block;
        margin-bottom: 8px;

        input {
          margin-right: 8px;
        }
      }
    }
  }
</style>
