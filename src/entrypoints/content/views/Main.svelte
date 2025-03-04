<script lang="ts">
import {
  addComment,
  findCommentsDataByPageId,
  findPageByRoute,
  CommentData,
} from "@/lib/database";
import { signOut, supabase } from "@/lib/supabase";
import { getBaseUrlAndPath, getIcon } from "@/lib/utils";

import { onMount } from "svelte";
import moment from "moment";
import { RealtimeChannel } from "@supabase/supabase-js";
import Header from "@/lib/components/Header.svelte";

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
        console.log(
          await findPageByRoute(currentUrlSplit.domain, currentUrlSplit.route),
        );

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
            <img src="https://placehold.co/400" alt="Placeholder" />
          </div>

          <div class="comment-main">
            <div class="comment-header">
              <h5>{comment.author.substring(0, 8)}</h5>
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
    <input
      bind:value={currentComment}
      type="text"
      placeholder="Comment something..."
      required
    />
    <button class="form-submit" type="submit">Submit</button>
  </form>
</main>

<style lang="scss">
main {
  display: flex;
  flex-direction: column;
  height: 100%;
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
      width: 45px;
      height: 45px;
      border-radius: 50%;
    }
  }

  .comment-main {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1 1 1;

    margin-top: 0.2rem;
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
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex: 1 1 1;

  input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--text);
  }

  .form-submit {
    background-color: var(--background);
    color: var(--text);
    border: none;
    padding: 0.5rem 1rem;
    border: 1px solid var(--text);
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      background-color: var(--text);
      color: var(--background);
    }
  }
}
</style>
