<script lang="ts">
import {
  addComment,
  findCommentsDataByPageId,
  findPageByRoute,
  CommentData,
} from "@/lib/database";
import { supabase } from "@/lib/supabase";
import { getBaseUrlAndPath } from "@/lib/utils";

import { onMount } from "svelte";
import moment from "moment";
import { RealtimeChannel } from "@supabase/supabase-js";
import Header from "@/lib/components/Header.svelte";

import ReturnIcon from "@/assets/icons/return.svg";

let currentUrl: string | undefined;

let currentUrlSplit: {
  baseUrl: string;
  domain: string;
  route: string;
} | null;

let initialComments: CommentData[] = [
  // {
  //   id: 1,
  //   page_id: 1,
  //   created_at: new Date().toLocaleDateString(),
  //   author: "John Doe",
  //   content: "Hello, world!",
  // },
];

// Fetch the current tab's URL on component mount
let channel: RealtimeChannel;
onMount(() => {
  chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, async (response) => {
    if (response?.url) {
      currentUrl = response.url;
      currentUrlSplit = getBaseUrlAndPath(response.url);

      if (!currentUrlSplit) {
        console.error("Unable to fetch current URL.");
        return;
      }

      initialComments =
        (await findCommentsDataByPageId(
          await findPageByRoute(currentUrlSplit.domain, currentUrlSplit.route),
        )) || [];

      // Subscribe to the comments_change channel
      if (currentUrlSplit?.domain) {
        console.log("Subscribing to comments_change channel.");
        channel = supabase
          .channel("comments_realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "comments",
              filter: `page_id=eq.${await findPageByRoute(currentUrlSplit.domain, currentUrlSplit.route)}`,
            },
            (payload) => {
              console.log("Comments table changed.");

              // TODO update initialComments by changes
            },
          )
          .subscribe();
      } else {
        console.log("Subscribing to comments_change channel.");
      }
    } else {
      currentUrl = "Unable to fetch URL.";
    }
  });
});

let currentComment: string = "";

// Handle form submission
const handleSubmit = async () => {
  console.log(currentComment);
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

  try {
    await addComment(currentUrl, currentComment);
    currentComment = "";
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

onDestroy(() => {
  if (channel) {
    console.log("Unsubscribing from comments_change channel.");
    channel.unsubscribe();
  }
});
</script>

<main>
  <!-- <button on:click={async () => await signOut()}>Sign out</button> -->
  <Header currentUrl={currentUrl} currentUrlSplit={currentUrlSplit} />

  <ul class="comments">
    {#each initialComments as comment}
      <li>
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
          </div>
        </div>
      </li>
    {/each}
  </ul>

  <form
    class="comment-form"
    on:submit|preventDefault={async () => await handleSubmit()}
  >
    <textarea
      bind:value={currentComment}
      on:keydown={handleEnterKey}
      placeholder="Share your thoughts..."
      required
      rows="3"
      maxlength="500"
    ></textarea>

    <div class="form-buttons">
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
  padding-bottom: 1rem;

  overflow-y: scroll;

  &::-webkit-scrollbar {
    display: none;
  }
}

.comment {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding-top: 1rem;
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
    gap: 0.2rem;
    flex: 1 1 1;

    margin-top: 0.1;
  }

  .comment-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex: 1 1 1;

  .form-buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 0.5rem;

    height: 2rem;

    button {
      cursor: pointer;
    }
  }

  .form-submit {
    background-color: var(--text);
    color: var(--background);
    border: none;
    padding: 0.5rem 1rem;
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
