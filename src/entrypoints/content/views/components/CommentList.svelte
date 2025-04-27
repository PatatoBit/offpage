<script lang="ts">
  import { fade } from "svelte/transition";
  import moment from "moment";
  import { Filter } from "bad-words";
  import {
    initialComments,
    isEmpty,
    extensionStatus,
  } from "@/stores/AppStatus";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";

  const filter = new Filter();
</script>

{#if $initialComments.length != 0 || isEmpty}
  <ul class="comments">
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

            {#if $extensionStatus.blockFlagged && comment.moderation_status == "flagged"}
              <i>comment flagged</i>
            {:else if $extensionStatus.filterBadWords}
              <p>{filter.clean(comment.content)}</p>
            {:else}
              <p>{comment.content}</p>
            {/if}

            {#if comment.image_url}
              <div class="comment-image">
                {#if $extensionStatus.blockFlagged && comment.moderation_status == "flagged"}
                  <div class="blur">
                    {#if comment.moderation_scores}
                      {#each Object.entries(comment.moderation_scores) as [key, value]}
                        <p>{key}: {Math.round(value * 100)}%</p>
                      {/each}
                    {/if}
                    <!-- content here -->
                  </div>
                {/if}

                <img src={comment.image_url} alt={comment.content} />
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

<style lang="scss">
  .comments {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    padding: 0 16px;

    list-style-type: none;

    overflow-y: scroll;
    -ms-overflow-style: none;
    scrollbar-width: none;

    margin: 0;
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

      text-transform: capitalize;
    }

    img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      object-position: left;
    }

    .blocker {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--background);
      border: 1px solid var(--highlight);
      opacity: 0.5;
      border-radius: 8px;
    }
  }

  .center {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
</style>
