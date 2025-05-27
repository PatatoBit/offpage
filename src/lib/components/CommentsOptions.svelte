<script lang="ts">
  import { SlidersHorizontal } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { extensionStatus } from "@/stores/AppStatus";
  import Crossbox from "./Crossbox.svelte";
  import { onDestroy } from "svelte";

  let isOpen = $state(false);
  let status = $derived($extensionStatus);
  let popupRef = $state<HTMLDivElement | null>(null);

  function handleClickOutside(event: PointerEvent) {
    if (popupRef && !popupRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  $effect(() => {
    if (isOpen && popupRef) {
      document.addEventListener("pointerdown", handleClickOutside);
    } else {
      document.removeEventListener("pointerdown", handleClickOutside);
    }
  });

  onDestroy(() => {
    document.removeEventListener("pointerdown", handleClickOutside);
  });
</script>

<div class="options-row">
  <div class="filter">
    <button class="clean" onclick={() => (isOpen = !isOpen)}>
      <div>filters</div>
      <SlidersHorizontal class="lucide" size={16} />
    </button>

    {#if isOpen}
      <div
        class="filter-popup-content"
        bind:this={popupRef}
        onpointerdown={(e) => e.stopPropagation()}
        in:fly={{ y: -10, duration: 200 }}
        out:fly={{ y: -10, duration: 200 }}
      >
        <h3>Filter comments with...</h3>

        <div class="filters">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <label
            class="filter-option"
            onclick={() =>
              extensionStatus.set({
                ...status,
                filterBadWords: !status.filterBadWords,
              })}
          >
            <Crossbox
              checked={status.filterBadWords}
              onChange={(value) =>
                extensionStatus.set({
                  ...status,
                  filterBadWords: value,
                })}
              onClick={(e) => e.stopPropagation()}
            />
            <p class="label">Bad words</p>
          </label>

          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <label
            class="filter-option"
            onclick={() =>
              extensionStatus.set({
                ...status,
                blockFlagged: !status.blockFlagged,
              })}
          >
            <Crossbox
              checked={status.blockFlagged}
              onChange={(value) =>
                extensionStatus.set({
                  ...status,
                  blockFlagged: value,
                })}
              onClick={(e) => e.stopPropagation()}
            />
            <p class="label">Flagged comments</p>
          </label>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    padding: 0;
  }

  .options-row {
    position: sticky;
    top: 10px;
    right: 10px;
    z-index: 10;

    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: 8px;

    margin-top: 8px;

    div {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;

      font-size: 14px;
      color: var(--text);
    }
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

      width: 200px;
      top: 100%;
      right: 0;
      border: 1px solid var(--highlight);
      border-radius: 8px;
      background-color: var(--background);

      padding: 16px;
      margin-top: 8px;

      label {
        display: flex;
        flex-direction: row;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;

        .label {
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
          user-select: none;
        }

        &:hover {
          background-color: var(--highlight);
          border-radius: 4px;
        }
      }
    }
  }
</style>
