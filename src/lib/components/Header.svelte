<script lang="ts">
import { findVotesByPageId } from "../database";
import { getIcon } from "../utils";

export let currentUrl: string | undefined;
export let currentUrlSplit: {
  baseUrl: string;
  domain: string;
  route: string;
} | null;
export let currentPageId: string | null;

let currentPageVotes: number = 0;

function handleOpenOptions() {
  chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
}

onMount(() => {
  const checkReady = setInterval(async () => {
    if (currentPageId && currentUrlSplit) {
      clearInterval(checkReady); // Stop checking once ready

      const upvotes = await findVotesByPageId(currentPageId);
      if (upvotes) {
        currentPageVotes = upvotes;
        console.log("====================================");
        console.log("Current page votes: ", currentPageVotes);
        console.log("====================================");
      } else {
        console.error("Unable to fetch current page votes.");
      }
    }
  }, 100); // Check every 100ms
});
</script>

<div class="header">
  <div class="domain-route">
    {#if currentUrl}
      {#if currentUrlSplit?.route}
        <div class="domain">
          {#if getIcon()}
            <img class="webicon" src={getIcon()} alt=" " />
          {/if}

          <strong>{currentUrlSplit?.domain}</strong>
        </div>

        <h2>{currentUrlSplit?.route}</h2>
      {:else}
        <div class="domain">
          {#if getIcon()}
            <img class="webicon" src={getIcon()} alt=" " />
          {/if}

          <h2>{currentUrlSplit?.domain}</h2>
        </div>
      {/if}
    {/if}
  </div>

  <div class="header-button">
    <div>
      <button>Like</button>
      {currentPageVotes}
      <button>Dislike</button>
    </div>

    <div>
      <button on:click={handleOpenOptions}>options</button>
      <!-- <a href="https://google.com" target="_blank">view on web</a> -->
    </div>
  </div>
</div>

<style lang="scss">
.webicon {
  width: 20px;
  height: 20px;
}

.domain {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
}

.header {
  display: flex;
  flex-direction: column;
  flex: 1 1 1;
  gap: 1rem;

  border-bottom: 1px dashed black;
  padding-block: 1.3rem;

  h2 {
    font-weight: 400;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .domain-route {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .header-button {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
