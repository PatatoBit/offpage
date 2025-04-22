<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  import moment from "moment";
  import {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
  } from "@supabase/supabase-js";

  import {
    addComment,
    findCommentsDataByPageId,
    findPageByRoute,
    CommentData,
    uploadCommentImage,
  } from "@/lib/database";
  import {
    currentPageId,
    currentUrl,
    currentUrlSplit,
    initialComments,
    isEmpty,
  } from "@/stores/AppStatus";
  import { userId } from "@/lib/stores/sessionStore";
  import { fetchUserProfile, supabase } from "@/lib/supabase";
  import { getBaseUrlAndPath, isValidImage } from "@/lib/utils";

  import Header from "@/lib/components/Header.svelte";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";

  import { CornerUpRight, Image } from "@lucide/svelte";
  import Cross from "@/assets/icons/cross.svg";
  import { writable } from "svelte/store";

  // Fetch the current tab's URL on component mount
  let channel: RealtimeChannel;

  async function initialize() {
    chrome.runtime.sendMessage(
      { type: "GET_CURRENT_URL" },
      async (response) => {
        if (response?.url) {
          $currentUrl = response.url;
          $currentUrlSplit = getBaseUrlAndPath(response.url);

          if (!$currentUrlSplit) {
            isEmpty.set(true);
            console.error("Unable to fetch current URL.");
            return;
          }

          currentPageId.set(
            await findPageByRoute(
              $currentUrlSplit.domain,
              $currentUrlSplit.route,
            ),
          );

          if (currentPageId == null) {
            isEmpty.set(true);
            console.error("Page not found.");
            return;
          }

          const comments = await findCommentsDataByPageId(
            $currentPageId as string,
          );

          initialComments.set(comments || []);

          if ($initialComments.length == 0) {
            isEmpty.set(true);
          }

          // Subscribe to the comments_change channel
          if ($currentUrlSplit?.domain) {
            channel = supabase
              .channel("comments_inserts")
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "comments",
                  filter: `page_id=eq.${await findPageByRoute($currentUrlSplit.domain, $currentUrlSplit.route)}`,
                },
                async (
                  payload: RealtimePostgresChangesPayload<CommentData>,
                ) => {
                  console.log("Comments table changed.");
                  console.log(payload.new);
                  isEmpty.set(false);

                  // Check if payload.new is not an empty object
                  if (Object.keys(payload.new).length > 0) {
                    const comment = payload.new as CommentData; // Type assertion
                    const newUpdatedComment = {
                      ...comment,
                      profiles: await fetchUserProfile(comment.author),
                    };

                    initialComments.update((prev) => [
                      newUpdatedComment,
                      ...prev,
                    ]);
                  } else {
                    console.warn("Received an empty object as payload.new");
                  }
                },
              )
              .subscribe();
          } else {
            console.log("Subscribing to comments_change channel.");
          }
        } else {
          currentUrl.set("Unable to fetch URL");
        }
      },
    );
  }

  onMount(() => {
    initialize();
  });

  let currentComment: string = "";

  const postingComment = writable<boolean>(false);

  // Handle form submission
  const handleSubmit = async () => {
    if (!currentUrlSplit) {
      console.error("Unable to fetch current URL.");
      return;
    }

    if (!currentComment) {
      console.error("Comment cannot be empty.");
      return;
    }

    if (!currentUrl) {
      console.error("Current URL cannot be empty.");
      return;
    }

    const comment = currentComment;
    currentComment = "";

    let uploadedImageUrl: string | null = null;

    if (file) {
      uploadedImageUrl = await uploadCommentImage(
        file,
        $currentPageId as string,
        $userId as string,
      );

      if (uploadedImageUrl) {
        file = null;
        currentFileUrl = null;
      } else {
        console.error("Unable to upload image.");
      }
    }

    try {
      postingComment.set(true);
      await addComment($currentUrl as string, comment, uploadedImageUrl);

      if ($initialComments.length == 0) {
        initialComments.set([]);
        initialize();
      }
    } catch (error) {
      console.error((error as Error).message);
    } finally {
      postingComment.set(false);
    }
  };

  async function handleEnterKey(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      await handleSubmit(); // Call submit function
    }
  }

  let inputRef: HTMLInputElement | null = null;
  let file: File | null = null;
  let currentFileUrl: string | null = null;

  function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const droppedFile = event.dataTransfer?.files[0];

    if (droppedFile && isValidImage(droppedFile)) {
      file = droppedFile;
      currentFileUrl = URL.createObjectURL(file);
    }
  }

  function handleFileSelect(event: Event) {
    const selectedFile = (event.target as HTMLInputElement)?.files?.[0];
    if (selectedFile && isValidImage(selectedFile)) {
      file = selectedFile;
      currentFileUrl = URL.createObjectURL(file);
    } else {
      console.error("Invalid file type.");
    }
  }

  function triggerFileInput() {
    if (inputRef) {
      inputRef.click();
    }
  }

  onDestroy(() => {
    if (channel) {
      console.log("Unsubscribing from comments_change channel.");
      channel.unsubscribe();
    }
  });
</script>

<main>
  <Header
    currentUrl={$currentUrl as string}
    currentUrlSplit={$currentUrlSplit}
    currentPageId={$currentPageId as string}
  />

  {#if $postingComment}
    <div transition:fly={{ y: -50 }} class="posting-spinner">
      <div class="spinner">
        <LoadSpinner />
      </div>

      <p>Posting</p>
    </div>
  {/if}

  {#if $initialComments.length != 0 || isEmpty}
    <!-- content here -->
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

              <p>{comment.content}</p>

              <div class="comment-image">
                {#if comment.image_url}
                  <img src={comment.image_url} alt={comment.content} />
                {/if}
              </div>
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
  <form
    class="file-area"
    on:submit|preventDefault={async () => await handleSubmit()}
    on:dragover|preventDefault
    on:drop={handleFileDrop}
  >
    <div class="input-area">
      {#if currentFileUrl}
        <div class="dropped-file-area">
          <div class="dropped-image">
            <img src={currentFileUrl} alt="Dropped file" />

            <button
              on:click={() => {
                file = null;
                currentFileUrl = null;
              }}
            >
              <img src={Cross} alt="Remove" />
            </button>
          </div>
        </div>
      {/if}

      <div class="form-buttons">
        <button type="button" class="file-input" on:click={triggerFileInput}>
          <Image size={20} color="var(--text)" />
        </button>

        <button class="form-submit" type="submit">
          <p>Send</p>
          <CornerUpRight size={15} color="var(--background)" />
        </button>
      </div>

      <textarea
        bind:value={currentComment}
        on:keydown={handleEnterKey}
        placeholder="Share your thoughts..."
        required
        rows="3"
        maxlength="500"
      ></textarea>

      <input
        type="file"
        bind:this={inputRef}
        accept="image/png, image/jpeg, image/gif"
        on:change={handleFileSelect}
        hidden
      />
    </div>
  </form>
</main>

<style lang="scss">
  main {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: transparent;
  }

  .posting-spinner {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    z-index: 1000; /* Ensure it appears above other content */

    background-color: var(--background);
    border: 1px solid var(--highlight);
    border-radius: 32px;
    padding-right: 16px;

    .spinner {
      scale: 0.5;
    }

    p {
      font-size: 14px;
      color: var(--text);
      margin: 0;
    }
  }

  .comments {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    padding: 0 16px;

    overflow-y: scroll;
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */

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
      max-height: 300px;
      height: auto;
      width: auto;
    }

    img {
      max-height: 100%;
      max-width: 100%;
      height: auto;
      width: auto;
      border-radius: 8px;
      object-fit: contain;
      object-position: left;
    }
  }

  .file-area {
    display: flex;
    flex-direction: column;
    pointer-events: none;

    width: 100%;
    gap: 0.5rem;

    .form-buttons {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 8px;

      height: 32px;

      button {
        cursor: pointer;
      }
    }

    .file-input {
      all: unset;
      border: none;
      cursor: pointer;

      display: flex;
      justify-content: center;
      align-items: center;

      transition: scale 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

      img {
        width: 30px;
        height: 30px;
      }

      &:hover {
        transform: scale(1.05);
      }
    }

    .form-submit {
      background-color: var(--text);
      border: none;
      padding: 8px 10px;
      border: 1px solid var(--text);
      border-radius: 6px;
      cursor: pointer;

      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;

      transition: scale 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

      p {
        font-size: 14px;
        color: var(--background);
      }

      &:hover {
        transform: scale(1.05);
      }
    }
  }

  .input-area {
    position: relative;
    box-sizing: border-box;
    pointer-events: all;
    width: 100%;
    bottom: 0;
    padding: 12px;

    display: flex;
    flex-direction: column;
    gap: 8px;
    background: var(--background);
  }

  .dropped-file-area {
    position: absolute;
    display: flex;
    flex-direction: row;
    /* overflow-x: scroll; */
    gap: 8px;
    width: 100%;
    height: 100%;
    top: -140px;

    .dropped-image {
      position: relative;
      border-radius: 8px;
      background-color: var(--border);

      box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);
      -webkit-box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);
      -moz-box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);

      button {
        position: absolute;
        top: -8px;
        right: -8px;

        background-color: var(--red);
        border: none;
        padding: 4px;
        border-radius: 50%;
        cursor: pointer;

        display: flex;
        justify-content: center;
        align-items: center;

        img {
          filter: invert(1);
          width: 10px;
          height: 10px;
        }
      }

      img {
        height: 100%;
        width: auto;
      }
    }
  }
</style>
