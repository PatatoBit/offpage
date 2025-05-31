<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import moment from "moment";
  import { Filter } from "bad-words";
  import {
    initialComments,
    isEmpty,
    extensionStatus,
  } from "@/stores/AppStatus";
  import type { ModerationStatus } from "@/stores/AppStatus";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";
  import CommentsOptions from "@/lib/components/FilterOptions.svelte";
  import { writable } from "svelte/store";
  import { userId } from "@/lib/stores/sessionStore";
  import CommentOptions from "./CommentOptions.svelte";
  import { onMount } from "svelte";

  const filter = new Filter();

  function passThreshold(value: ModerationStatus) {
    for (const category in $extensionStatus.filterThreshold) {
      // Check all keys in value that match the category or its subcategories
      for (const key in value) {
        if (key === category || key.startsWith(category + "/")) {
          if (value[key] >= $extensionStatus.filterThreshold[category]) {
            return false;
          }
        }
      }
    }
    return true;
  }

  // Track revealed comments by their id
  const revealed = writable<Set<string | number>>(new Set());

  function revealComment(id: string | number) {
    revealed.update((set) => {
      set.add(id);
      return set;
    });
  }

  // Modal state
  const showScoresModal = writable(false);
  let modalScores: Record<string, number> | null = null;
  let modalTitle = "";

  function openScoresModal(scores: Record<string, number>, title: string) {
    modalScores = scores;
    modalTitle = title;
    showScoresModal.set(true);
  }

  function closeScoresModal() {
    showScoresModal.set(false);
    modalScores = null;
    modalTitle = "";
  }
</script>

{#if $initialComments.length != 0 || isEmpty}
  <ul class="comments">
    <CommentsOptions />

    {#each $initialComments as comment}
      <li transition:fade>
        <div class="comment">
          <div class="user-profile">
            {#if comment.profiles}
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username + "'s avatar"}
              />
            {:else}
              <img src="https://placehold.co/400" alt="Placeholder" />
            {/if}
          </div>

          <div class="comment-main">
            <div class="comment-header">
              {#if comment.profiles}
                <h5>{comment.profiles.username}</h5>
              {/if}
              <h5 class="label">
                {moment
                  .utc(comment.created_at)
                  .local()
                  .startOf("second")
                  .fromNow()}
              </h5>
            </div>

            {#if ($extensionStatus.blockFlagged && comment.moderation_status == "flagged") || ($extensionStatus.blockFlagged && !passThreshold(comment.moderation_scores as ModerationStatus))}
              <div class="blocked-wrapper">
                <p class:invisible={!$revealed.has(comment.id)}>
                  {#if $extensionStatus.filterBadWords}
                    {filter.clean(comment.content)}
                  {:else}
                    {comment.content}
                  {/if}
                </p>
                {#if !$revealed.has(comment.id)}
                  <!-- svelte-ignore a11y_click_events_have_key_events -->
                  <div
                    class="blocked-text"
                    on:click={() => revealComment(comment.id)}
                    tabindex="0"
                    role="button"
                    aria-label="Reveal blocked comment"
                  ></div>
                {/if}
              </div>
            {:else if $extensionStatus.filterBadWords}
              <p>{filter.clean(comment.content)}</p>
            {:else}
              <p>{comment.content}</p>
            {/if}

            {#if comment.image_url}
              <div class="comment-image">
                {#if ($extensionStatus.blockFlagged && comment.moderation_status == "flagged") || ($extensionStatus.blockFlagged && !passThreshold(comment.moderation_scores as ModerationStatus))}
                  {#if !$revealed.has(comment.id)}
                    <div class="blur">
                      <h4>Post hidden</h4>
                      <p>
                        This post is hidden because it's flagged or has exceeded
                        threshold(s).
                      </p>

                      <br />

                      {#if comment.moderation_scores}
                        <button
                          class="secondary"
                          on:click={() =>
                            openScoresModal(
                              comment.moderation_scores!,
                              comment.content,
                            )}
                        >
                          see why
                        </button>
                      {/if}
                    </div>
                  {/if}
                {/if}
                <img src={comment.image_url} alt={comment.content} />
              </div>
            {/if}

            {#if comment.author === $userId}
              <div class="comment-buttons">
                <CommentOptions commentId={comment.id} />
              </div>
            {/if}
          </div>
        </div>
      </li>
    {/each}
  </ul>
{:else}
  <div class="center">
    <LoadSpinner />
  </div>
{/if}

{#if $showScoresModal && modalScores}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    on:click={closeScoresModal}
    transition:fade={{ duration: 100 }}
  >
    <div
      class="modal"
      on:click|stopPropagation
      transition:scale={{ duration: 100 }}
    >
      <h3>Moderation Scores</h3>
      <ul>
        {#each Object.entries(modalScores) as [key, value]}
          <li>{key}: {Math.round(value * 100)}%</li>
        {/each}
      </ul>

      <br />

      <button on:click={closeScoresModal}>Close</button>
    </div>
  </div>
{/if}

<style lang="scss">
  .comments {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    padding: 0 16px 16px 16px;
    margin: 0;

    list-style-type: none;
    overflow-y: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;

    background-color: var(--accent);
    border-top: 1px solid var(--border);
  }

  .comment {
    display: flex;
    flex-direction: row;
    gap: 8px;
    padding-top: 16px;
    width: 100%;

    h5,
    p {
      margin: 0;
    }

    .user-profile {
      display: flex;
      flex-shrink: 0;
      img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px solid var(--border);
        object-fit: cover;
      }
    }

    .comment-main {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1 1 1;
      margin-top: 0.1;

      text-align: left;
    }

    .comment-header {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
    }

    .comment-image {
      position: relative;
      max-height: 300px;
      width: fit-content;
      height: auto;

      overflow: hidden;
      border-radius: 8px;
    }

    .blur {
      box-sizing: border-box;
      position: absolute;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(8px);
      background: rgba(0, 0, 0, 0.8);

      overflow: hidden;
      border-radius: 8px;

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 8px;

      h4,
      p {
        color: var(--background);
        text-align: center;
      }
    }

    img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      object-position: left;
    }
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .blocked-wrapper {
    position: relative;
    width: fit-content;
    max-width: 100%;
  }

  .blocked-wrapper p {
    margin: 0;
    transition: opacity 0.15s;
  }

  .blocked-wrapper p.invisible {
    visibility: hidden;
  }

  .blocked-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--border);
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    border: none;
    transition: background 0.15s;
    z-index: 1;
    &:hover,
    &:focus {
      filter: brightness(1.2);
      outline: none;
    }
  }

  .comment-buttons {
    display: flex;
    flex-direction: row;
    gap: 8px;
    margin-top: 8px;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal {
    background: #fff;
    padding: 32px;
    border-radius: 8px;
    min-width: 300px;
    max-width: 90vw;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);

    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: left;
  }
</style>
