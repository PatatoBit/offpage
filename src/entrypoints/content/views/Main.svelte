<script lang="ts">
  import {
    addComment,
    CommentData,
    findCommentsDataByPageId,
    findPageByRoute,
  } from "@/lib/database";
  import { signOut, supabase } from "@/lib/supabase";
  import { getBaseUrlAndPath } from "@/lib/utils";
  import { onMount } from "svelte";
  import moment from "moment";

  let currentUrl: string | undefined;
  let currentUrlSplit: {
    baseUrl: string;
    domain: string;
    route: string;
  } | null;

  let initialComments: CommentData[] = [];

  // Fetch the current tab's URL on component mount
  let channel;
  onMount(() => {
    chrome.runtime.sendMessage(
      { type: "GET_CURRENT_URL" },
      async (response) => {
        if (response?.url) {
          currentUrl = response.url;
          currentUrlSplit = getBaseUrlAndPath(response.url);

          if (!currentUrlSplit) {
            console.error("Unable to fetch current URL.");
            return;
          }

          initialComments =
            (await findCommentsDataByPageId(
              await findPageByRoute(
                currentUrlSplit.domain,
                currentUrlSplit.route
              )
            )) || [];

          // Subscribe to the comments_change channel
          if (currentUrlSplit?.domain) {
            console.log(
              await findPageByRoute(
                currentUrlSplit.domain,
                currentUrlSplit.route
              )
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
                  console.log(payload);
                }
              )
              .subscribe();
          } else {
            console.log("Subscribing to comments_change channel.");
          }
        } else {
          currentUrl = "Unable to fetch URL.";
        }
      }
    );
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
</script>

<p>Signed in</p>

{#if currentUrl}
  <p>Current URL: {currentUrl}</p>
  <p>Base URL: {currentUrlSplit?.baseUrl}</p>
  <p>Page path: {currentUrlSplit?.route}</p>
  <p></p>
{/if}

<ul class="comments">
  {#each initialComments as comment}
    <li>
      <!-- <h4>{comment.author}</h4> -->
      <p>{comment.content}</p>
      <p>{moment(comment.created_at).startOf("hour").fromNow()}</p>
    </li>
  {/each}
</ul>

<form action="" on:submit|preventDefault={async () => await handleSubmit()}>
  <input
    bind:value={currentComment}
    type="text"
    placeholder="Comment something..."
    required
  />
  <button type="submit">Submit</button>
</form>

<button on:click={async () => await signOut()}>Sign out</button>

<style lang="scss">
</style>
