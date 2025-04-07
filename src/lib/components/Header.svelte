<script lang="ts">
  import {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
  } from "@supabase/supabase-js";
  import {
    getLikeDislikeCount,
    PageVoteData,
    getUserVote,
    votePage,
  } from "../database";
  import { userId } from "../stores/sessionStore";
  import { supabase } from "../supabase";
  import { getIcon } from "../utils";
  import { EllipsisVertical, ThumbsUp, ThumbsDown } from "@lucide/svelte";

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

  let ThumbButtonState: "like" | "dislike" | "neutral" = "neutral";

  const formatter = new Intl.NumberFormat("en", { notation: "compact" });
  function handleOpenOptions() {
    chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
  }

  onMount(async () => {
    const checkUserVote = setInterval(async () => {
      if (currentPageId && $userId) {
        clearInterval(checkUserVote); // Stop checking once ready

        const userVote = await getUserVote(currentPageId, $userId);
        if (userVote) {
          if (userVote === 1) {
            ThumbButtonState = "like";
          } else if (userVote === -1) {
            ThumbButtonState = "dislike";
          } else {
            ThumbButtonState = "neutral";
          }
        } else {
          console.error("Unable to fetch user vote.");
        }
      }
    }, 100); // Check every 100ms

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
  <div class="top-header">
    {#if getIcon()}
      <img class="webicon" src={getIcon()} alt=" " />
    {/if}

    <div class="domain-route">
      {#if currentUrl}
        <h3 class="domain">
          <strong>{currentUrlSplit?.domain}</strong>
        </h3>

        {#if currentUrlSplit?.route}
          <h3>{currentUrlSplit?.route}</h3>
        {/if}
      {/if}
    </div>

    <button on:click={handleOpenOptions} class="options-button">
      <EllipsisVertical size={20} color="var(--text)" />
    </button>
  </div>

  <div class="header-button">
    <div class="votes-button">
      <button
        class:active={ThumbButtonState === "like"}
        on:click={async () => {
          if (ThumbButtonState === "like") {
            ThumbButtonState = "neutral";
          } else {
            ThumbButtonState = "like";
          }
          await votePage(currentPageId as string, $userId as string, 1);
        }}
      >
        <div class="thumbs-button">
          <ThumbsUp size={20} />
        </div>

        <p>
          {formatter.format(currentPageVotes.likes)}
        </p>
      </button>

      <button
        class:active={ThumbButtonState === "dislike"}
        on:click={async () => {
          if (ThumbButtonState === "dislike") {
            ThumbButtonState = "neutral";
          } else {
            ThumbButtonState = "dislike";
          }
          await votePage(currentPageId as string, $userId as string, -1);
        }}
      >
        <div class="thumbs-button">
          <ThumbsDown size={20} />
        </div>

        <p>
          {formatter.format(currentPageVotes.dislikes)}
        </p>
      </button>
    </div>
  </div>
</div>

<style lang="scss">
  .webicon {
    width: 20px;
    height: 20px;
  }

  .top-header {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-top: 5px;
  }

  .domain {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .header {
    display: flex;
    flex-direction: column;
    flex: 1 1 1;
    gap: 16px;
    background-color: var(--background);
    padding: 15px;

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

    .options-button {
      all: initial;
      align-self: center;
      cursor: pointer;

      //align at the end of the header
      position: absolute;
      right: 15px;

      border: none;
      background: none;
    }

    .header-button {
      display: flex;
      flex-direction: row;
      justify-content: center;
    }

    .votes-button {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-self: center;
      align-self: center;
      overflow: hidden;

      height: 32px;
      width: 160px;
      background-color: var(--inner-background);
      border: 1px solid var(--border);
      border-radius: 10px;

      button {
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
          color: var(--background);
          background-color: var(--border);
        }
      }

      button.active {
        color: var(--background);
        background-color: var(--border);
        border: 1px solid var(--white);

        p {
          color: var(--background);
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
