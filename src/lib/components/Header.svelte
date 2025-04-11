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

  let hasSubscribed = false;

  // reusable subscription function
  async function subscribeToVotes(pageId: string) {
    console.log("Subscribing to votes for pageId:", pageId);

    if (channel) {
      await channel.unsubscribe();
    }

    channel = supabase
      .channel(`votes_updates_${pageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "page_votes",
          filter: `page_id=eq.${pageId}`,
        },
        async (payload: RealtimePostgresChangesPayload<PageVoteData>) => {
          console.log("Votes table changed:", payload);
          const newVote = (payload.new as Partial<PageVoteData>)?.vote ?? 0;

          if (payload.eventType === "INSERT") {
            if (newVote === 1) currentPageVotes.likes += 1;
            if (newVote === -1) currentPageVotes.dislikes += 1;
          } else if (payload.eventType === "UPDATE") {
            if (newVote === 1) {
              currentPageVotes.likes += 1;
              currentPageVotes.dislikes -= 1;
            } else if (newVote === -1) {
              currentPageVotes.likes -= 1;
              currentPageVotes.dislikes += 1;
            }
          } else if (payload.eventType === "DELETE") {
            const upvotes = await getLikeDislikeCount(pageId);
            if (upvotes) {
              currentPageVotes = upvotes;
            }
          }
        },
      )
      .subscribe();
  }

  onMount(async () => {
    const checkUserVote = setInterval(async () => {
      if (currentPageId && $userId) {
        clearInterval(checkUserVote);
        const userVote = await getUserVote(currentPageId, $userId);
        if (userVote === 1) ThumbButtonState = "like";
        else if (userVote === -1) ThumbButtonState = "dislike";
        else ThumbButtonState = "neutral";
      }
    }, 100);

    const checkVotes = setInterval(async () => {
      if (currentPageId && currentUrlSplit) {
        clearInterval(checkVotes);
        const upvotes = await getLikeDislikeCount(currentPageId);
        if (upvotes) {
          currentPageVotes = upvotes;
        }
      }
    }, 100);
  });

  onDestroy(() => {
    // Unsubscribe from the channel
    if (channel) {
      channel.unsubscribe();
    }
  });

  let lastSubscribedPageId: string | null = null;

  $: if (currentPageId && currentPageId !== lastSubscribedPageId) {
    subscribeToVotes(currentPageId);
    lastSubscribedPageId = currentPageId;
  }
</script>

<div class="header">
  <div class="top-header">
    {#if getIcon()}
      <img class="webicon" src={getIcon()} alt=" " />
    {/if}

    <div class="domain-route">
      {#if currentUrl}
        <h3 class="bold">
          {currentUrlSplit?.domain}
        </h3>

        {#if currentUrlSplit?.route}
          <h3 class="normal">{currentUrlSplit?.route}</h3>
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

          const newPageId = await votePage(
            currentPageId,
            $userId as string,
            1,
            currentUrlSplit?.domain as string,
            currentUrlSplit?.route as string,
          );

          // Update page ID and subscribe if needed
          if (newPageId && newPageId !== currentPageId) {
            currentPageId = newPageId;
            if (!hasSubscribed) {
              await subscribeToVotes(newPageId);
              hasSubscribed = true;
            }
          }

          // Always fetch fresh counts and user vote after voting
          currentPageVotes =
            (await getLikeDislikeCount(currentPageId as string)) ||
            currentPageVotes;
          const userVote = await getUserVote(
            currentPageId as string,
            $userId as string,
          );
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
          const newPageId = await votePage(
            currentPageId,
            $userId as string,
            -1,
            currentUrlSplit?.domain as string,
            currentUrlSplit?.route as string,
          );

          // Update page ID and subscribe if needed
          if (newPageId && newPageId !== currentPageId) {
            currentPageId = newPageId;
            if (!hasSubscribed) {
              await subscribeToVotes(newPageId);
              hasSubscribed = true;
            }
          }

          // Always fetch fresh counts and user vote after voting
          currentPageVotes =
            (await getLikeDislikeCount(currentPageId as string)) ||
            currentPageVotes;
          const userVote = await getUserVote(
            currentPageId as string,
            $userId as string,
          );
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

  .header {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 16px;
    background-color: var(--background);
    padding: 15px;
    padding-top: 20px;

    h3 {
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .domain-route {
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-weight: 400;
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
        flex: 1;
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

        p {
          color: var(--background);
        }
      }

      button:last-child {
        border-right: none;
      }
    }
  }
</style>
