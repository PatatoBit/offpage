<script lang="ts">
  import Tickbox from "./Tickbox.svelte";
  import { getLikeDislikeCount, getUserVote, votePage } from "../database";
  import { extensionStatus } from "@/stores/AppStatus";
  import { userId } from "../stores/sessionStore";
  import { getIcon, handleOpenOptions } from "../utils";
  import { Settings, ThumbsUp, ThumbsDown } from "@lucide/svelte";

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

  let ThumbButtonState: "like" | "dislike" | "neutral" = "neutral";

  const formatter = new Intl.NumberFormat("en", { notation: "compact" });

  let voteDisabled: boolean = false;

  // Fetch votes and user vote when currentPageId or currentUrlSplit changes
  $: if (currentPageId && currentUrlSplit) {
    (async () => {
      // Refetch vote counts
      const upvotes = await getLikeDislikeCount(currentPageId);
      if (upvotes) {
        currentPageVotes = upvotes;
      } else {
        // If no data exists, initialize to zero
        currentPageVotes = { likes: 0, dislikes: 0 };
      }
      // Refetch user vote
      if ($userId) {
        const userVote = await getUserVote(currentPageId, $userId);
        if (userVote === 1) ThumbButtonState = "like";
        else if (userVote === -1) ThumbButtonState = "dislike";
        else ThumbButtonState = "neutral";
      }
    })();
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
  </div>

  <div class="header-buttons">
    <div class="votes-button">
      <button
        disabled={voteDisabled}
        class="clean"
        class:active={ThumbButtonState === "like"}
        on:click={async () => {
          voteDisabled = true;

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

          if (newPageId && newPageId !== currentPageId) {
            currentPageId = newPageId;
          }

          // Always fetch fresh counts and user vote after voting
          const upvotes = await getLikeDislikeCount(currentPageId as string);
          currentPageVotes = upvotes || { likes: 0, dislikes: 0 };
          const userVote = await getUserVote(
            currentPageId as string,
            $userId as string,
          );
          if (userVote === 1) ThumbButtonState = "like";
          else if (userVote === -1) ThumbButtonState = "dislike";
          else ThumbButtonState = "neutral";

          voteDisabled = false;
        }}
      >
        <div class="thumbs-button" class:active={ThumbButtonState === "like"}>
          <ThumbsUp size={20} />
        </div>

        <p>
          {formatter.format(currentPageVotes.likes)}
        </p>
      </button>

      <button
        disabled={voteDisabled}
        class="clean"
        on:click={async () => {
          voteDisabled = true;

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

          if (newPageId && newPageId !== currentPageId) {
            currentPageId = newPageId;
          }

          // Always fetch fresh counts and user vote after voting
          const upvotes = await getLikeDislikeCount(currentPageId as string);
          currentPageVotes = upvotes || { likes: 0, dislikes: 0 };
          const userVote = await getUserVote(
            currentPageId as string,
            $userId as string,
          );
          if (userVote === 1) ThumbButtonState = "like";
          else if (userVote === -1) ThumbButtonState = "dislike";
          else ThumbButtonState = "neutral";

          voteDisabled = false;
        }}
      >
        <div
          class="thumbs-button"
          class:active={ThumbButtonState === "dislike"}
        >
          <ThumbsDown size={20} />
        </div>

        <p>
          {formatter.format(currentPageVotes.dislikes)}
        </p>
      </button>
    </div>

    <div class="tags-toggle">
      <Tickbox
        checked={$extensionStatus.useTags}
        onChange={() => {}}
        onClick={() =>
          extensionStatus.update((s) => ({ ...s, useTags: !s.useTags }))}
      />
      <p class="label">URL tags</p>
    </div>
  </div>

  <div class="tabhead">
    <button class="tabhead-btn">
      <p class="label">comments</p>
    </button>

    <button on:click={handleOpenOptions} class="tabhead-btn">
      <Settings size={20} color="var(--text)" />
    </button>
  </div>
</div>

<style lang="scss">
  .webicon {
    width: 20px;
    height: 20px;
  }

  .tabhead {
    position: absolute;
    bottom: -1px;
    left: 0;
    z-index: 10;
    width: 100%;

    display: flex;
    flex-direction: row;

    .tabhead-btn {
      all: unset;
      padding: 6px;

      border-width: 1px 1px 0 1px;
      border-style: solid;
      border-color: var(--border);
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;

      &:first-child {
        padding: 6px 15px;
        border-bottom-color: var(--accent);
        background-color: var(--accent);
        border-width: 1px 1px 1px 0;
        border-top-left-radius: 0;
        border-top-right-radius: 8px;
      }

      &:last-child {
        cursor: pointer;
        aspect-ratio: 1;
        display: flex;
        margin-left: auto;
        margin-right: 4px;
      }
    }
  }

  .top-header {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-top: 5px;
  }

  .header {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 8px;
    background-color: var(--background);

    padding: 20px 15px 48px 15px;

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
  }

  .header-buttons {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .votes-button {
    display: flex;
    flex-direction: row;
    width: 130px;
    gap: 15px;

    button {
      padding: 0;
      display: flex;
      flex: 1;
      flex-direction: row;
      align-items: center;
    }
  }

  .tags-toggle {
    display: flex;
    flex-direction: row;
    gap: 5px;
    width: max-content;
    margin-left: auto;

    p.label {
      font-size: 14px;
      color: var(--text);
      font-weight: 500;
    }
  }

  .thumbs-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: 5px;
    padding: 7px;
    border-radius: 7px;

    color: var(--text);

    &:active,
    &.active {
      background-color: var(--primary);
      color: var(--background);
    }
  }
</style>
