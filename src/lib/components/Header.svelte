<script lang="ts">
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getLikeDislikeCount, PageVoteData, votePage } from "../database";
import { userId } from "../stores/sessionStore";
import { supabase } from "../supabase";
import { getIcon } from "../utils";

export let currentUrl: string | undefined;
export let currentUrlSplit: {
  baseUrl: string;
  domain: string;
  route: string;
} | null;
export let currentPageId: string | null;
let currentPageVotes = {
  likes: 0,
  dislikes: 0,
};
let channel: RealtimeChannel;

function handleOpenOptions() {
  chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
}

onMount(() => {
  if (currentPageId) {
  }

  const checkReady = setInterval(async () => {
    if (currentPageId && currentUrlSplit) {
      clearInterval(checkReady); // Stop checking once ready

      const upvotes = await getLikeDislikeCount(currentPageId);
      if (upvotes) {
        currentPageVotes = upvotes;
      } else {
        console.error("Unable to fetch current page votes.");
      }
    }

    channel = supabase
      .channel(`votes_updates`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for inserts, updates, and deletes
          schema: "public",
          table: "page_votes",
          filter: `page_id=eq.${currentPageId}`,
        },
        async (payload: RealtimePostgresChangesPayload<PageVoteData>) => {
          console.log("Votes table changed:", payload);

          const oldVote = (payload.old as Partial<PageVoteData>)?.vote ?? 0; // Previous vote before change
          const newVote = (payload.new as Partial<PageVoteData>)?.vote ?? 0; // New vote after change

          // If it's an INSERT (new vote)
          if (payload.eventType === "INSERT") {
            if (newVote === 1) currentPageVotes.likes += 1;
            if (newVote === -1) currentPageVotes.dislikes += 1;
          }

          // If it's an UPDATE (changing vote)
          else if (payload.eventType === "UPDATE") {
            if (newVote === 1) {
              currentPageVotes.likes += 1;
              currentPageVotes.dislikes -= 1;
            }
            if (newVote === -1) {
              currentPageVotes.likes -= 1;
              currentPageVotes.dislikes += 1;
            }
          }

          // If it's a DELETE (user removed their vote)
          else if (payload.eventType === "DELETE") {
            const upvotes = await getLikeDislikeCount(currentPageId as string);
            if (upvotes) {
              currentPageVotes = upvotes;
            } else {
              console.error("Unable to fetch current page votes.");
            }
          }
        },
      )
      .subscribe();
  }, 100); // Check every 100ms
});

onDestroy(() => {
  // Unsubscribe from the channel
  if (channel) {
    channel.unsubscribe();
  }
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
      <button
        on:click={async() => await votePage(currentPageId as string, $userId as string, 1)}
        >Like</button
      >
      {currentPageVotes.likes}
      <button
        on:click={async() => await votePage(currentPageId as string, $userId as string, -1)}
        >Dislike</button
      >
      {currentPageVotes.dislikes}
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
