<script lang="ts">
  import {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
  } from "@supabase/supabase-js";
  import { getLikeDislikeCount, PageVoteData, votePage } from "../database";
  import { userId } from "../stores/sessionStore";
  import { supabase } from "../supabase";
  import { getIcon } from "../utils";
  import ThumbUp from "../../assets/icons/thumb-up.svg";
  import ThumbDown from "../../assets/icons/thumb-down.svg";
  import { slide } from "svelte/transition";
  import { duration } from "moment";

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
  const formatter = new Intl.NumberFormat("en", { notation: "compact" });

  function handleOpenOptions() {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
  }

  onMount(() => {
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
              const upvotes = await getLikeDislikeCount(
                currentPageId as string,
              );
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
      <div class="domain">
        {#if getIcon()}
          <img class="webicon" src={getIcon()} alt=" " />
        {/if}

        <strong>{currentUrlSplit?.domain}</strong>
      </div>

      {#if currentUrlSplit?.route}
        <h3>{currentUrlSplit?.route}</h3>
      {/if}
    {/if}
  </div>

  <div class="header-button">
    <div class="votes-button">
      <button
        on:click={async () =>
          await votePage(currentPageId as string, $userId as string, 1)}
      >
        <div>
          <img class="vote-icon like" src={ThumbUp} alt="Like" />
        </div>

        {#key currentPageVotes.likes}
          <p>
            {formatter.format(currentPageVotes.likes)}
          </p>
        {/key}
      </button>
      <button
        on:click={async () =>
          await votePage(currentPageId as string, $userId as string, -1)}
      >
        <div>
          <img class="vote-icon dislike" src={ThumbDown} alt="Dislike" />
        </div>

        {#key currentPageVotes.dislikes}
          <p>
            {formatter.format(currentPageVotes.dislikes)}
          </p>
        {/key}
      </button>
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
    gap: 8px;
    align-items: center;
  }

  .header {
    display: flex;
    flex-direction: column;
    flex: 1 1 1;
    gap: 16px;

    h3 {
      font-weight: 400;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .domain-route {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .header-button {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }

    .votes-button {
      display: flex;
      flex-direction: row;
      align-items: center;
      overflow: hidden;

      height: 32px;
      width: 160px;
      background-color: var(--inner-background);
      border: 1px solid var(--border);
      border-radius: 80px;

      button {
        all: unset;
        cursor: pointer;
        height: 100%;
        width: 100%;

        height: 100%;
        padding: 0 16px;
        gap: 6px;
        border-right: 1px solid var(--border);
        border-radius: 0;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        &:active {
          background-color: var(--border);
        }
      }

      button:last-child {
        border-right: none;
      }
    }

    .vote-icon {
      width: 18px;
      height: 18px;
      transform: translateY(10%);
    }
  }
</style>
