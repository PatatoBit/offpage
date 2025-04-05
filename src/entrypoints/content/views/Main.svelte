<script lang="ts">
import { fade } from "svelte/transition";
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
import Loading from "@/lib/components/Loading.svelte";

import ReturnIcon from "@/assets/icons/return.svg";
import Cross from "@/assets/icons/cross.svg";
import Image from "@/assets/icons/image.svg";

// Fetch the current tab's URL on component mount
let channel: RealtimeChannel;

async function initialize() {
  chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, async (response) => {
    if (response?.url) {
      $currentUrl = response.url;
      $currentUrlSplit = getBaseUrlAndPath(response.url);

      if (!$currentUrlSplit) {
        isEmpty.set(true);
        console.error("Unable to fetch current URL.");
        return;
      }

      currentPageId.set(
        await findPageByRoute($currentUrlSplit.domain, $currentUrlSplit.route),
      );

      if (currentPageId == null) {
        isEmpty.set(true);
        console.error("Page not found.");
        return;
      }

      const comments = await findCommentsDataByPageId($currentPageId as string);

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
            async (payload: RealtimePostgresChangesPayload<CommentData>) => {
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

                initialComments.update((prev) => [newUpdatedComment, ...prev]);
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
  });
}

onMount(() => {
  initialize();
});

let currentComment: string = "";

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
    await addComment($currentUrl as string, comment, uploadedImageUrl);

    if ($initialComments.length == 0) {
      initialComments.set([]);
      initialize();
    }
  } catch (error) {
    console.error((error as Error).message);
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
  <!-- <button on:click={async () => await signOut()}>Sign out</button> -->
  <Header
    currentUrl={$currentUrl as string}
    currentUrlSplit={$currentUrlSplit}
    currentPageId={$currentPageId as string}
  />

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
                  {moment.utc(comment.created_at).local().startOf("second").fromNow()}
                </h5>
              </div>

              <p>{comment.content}</p>

              {#if comment.image_url}
                <img src={comment.image_url} alt={comment.content} />
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <Loading />
  {/if}

  <form
    class="input-form"
    on:submit|preventDefault={async () => await handleSubmit()}
    on:dragover|preventDefault
    on:drop={handleFileDrop}
  >
    {#if currentFileUrl}
      <div class="file-dropdown-area">
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

    <textarea
      bind:value={currentComment}
      on:keydown={handleEnterKey}
      placeholder="Share your thoughts..."
      required
      rows="3"
      maxlength="500"
    ></textarea>

    <!-- Hidden file input -->
    <input
      type="file"
      bind:this={inputRef}
      accept="image/png, image/jpeg, image/gif"
      on:change={handleFileSelect}
      hidden
    />

    <div class="form-buttons">
      <button type="button" class="file-input" on:click={triggerFileInput}>
        <img src={Image} alt="File input" />
      </button>

      <button class="form-submit" type="submit">
        <img src={ReturnIcon} alt="Return" />
      </button>
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

.comments {
  display: flex;
  flex-direction: column;

  flex: auto;
  padding: 0;
  margin: 0;
  padding-right: 10px;
  padding-bottom: 16px;

  overflow-y: scroll;
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
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

  img {
    width: 100%;
    height: auto;
    max-height: 15rem;

    object-fit: contain;
    object-position: left;
  }
}

.file-dropdown-area {
  position: absolute;
  display: flex;
  flex-direction: row;
  /* overflow-x: scroll; */
  gap: 8px;
  height: 160px;
  width: 100%;
  top: -176px;

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

.input-form {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 1;

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
    color: var(--background);
    border: none;
    padding: 8px 16px;
    border: 1px solid var(--text);
    border-radius: 6px;
    cursor: pointer;

    display: flex;
    justify-content: center;
    align-items: center;

    transition: scale 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

    img {
      width: 20px;
      height: 20px;

      filter: invert(1);
    }

    &:hover {
      transform: scale(1.05);
    }
  }
}
</style>
