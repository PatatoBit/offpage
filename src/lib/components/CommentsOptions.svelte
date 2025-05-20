<script lang="ts">
  import { SlidersHorizontal } from "@lucide/svelte";
  import { fly } from "svelte/transition";
  import { extensionStatus } from "@/stores/AppStatus";

  let isOpen = $state(false);
  let status = $derived($extensionStatus);

  const broadcastChange = () => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "FILTER_STATUS_CHANGE",
            filterBadWords: status.filterBadWords,
          });
        }
      }
    });
  };
</script>

<div class="options-row">
  <div class="filter">
    <button class="tertiary" onclick={() => (isOpen = !isOpen)}>
      <SlidersHorizontal class="lucide" size={16} />
      <p>Filters</p>
    </button>

    {#if isOpen}
      <div
        class="filter-popup-content"
        in:fly={{ y: -10, duration: 200 }}
        out:fly={{ y: -10, duration: 200 }}
      >
        <h3>Block filter</h3>

        <label>
          <input
            type="checkbox"
            checked={status.filterBadWords}
            onchange={(e) =>
              extensionStatus.set({
                ...status,
                filterBadWords: e.currentTarget.checked,
              })}
          />
          Bad words
        </label>

        <label>
          <input
            type="checkbox"
            checked={status.blockFlagged}
            onchange={(e) =>
              extensionStatus.set({
                ...status,
                blockFlagged: e.currentTarget.checked,
              })}
          />
          Flagged comments
        </label>
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

    display: flex;
    flex-direction: row;
    justify-content: flex-end;
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
      z-index: 10;

      label {
        display: block;

        input {
          margin-right: 8px;
        }
      }
    }
  }
</style>
