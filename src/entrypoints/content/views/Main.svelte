<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
  } from "@supabase/supabase-js";

  import {
    addComment,
    findCommentsDataByPageId,
    findPageByRoute,
    CommentData,
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
  import { getBaseUrlAndPath } from "@/lib/utils";

  import Header from "@/lib/components/Header.svelte";
  import FilterOptions from "@/lib/components/CommentsOptions.svelte";
  import CommentList from "./components/CommentList.svelte";
  import CommentForm from "./components/CommentForm.svelte";
  import PostingSpinner from "./components/PostingSpinner.svelte";
  import { writable } from "svelte/store";

  let channel: RealtimeChannel;
  const postingComment = writable<boolean>(false);

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
            if (channel) {
              console.log("Cleaning up previous subscription.");
              await channel.unsubscribe();
            }

            channel = supabase
              .channel("comments_inserts")
              .on(
                "postgres_changes",
                {
                  event: "INSERT",
                  schema: "public",
                  table: "comments",
                  filter: `page_id=eq.${await findPageByRoute($currentUrlSplit.domain, $currentUrlSplit.route)}`,
                },
                async (
                  payload: RealtimePostgresChangesPayload<CommentData>,
                ) => {
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

  onDestroy(() => {
    if (channel) {
      console.log("Unsubscribing from comments_change channel.");
      channel.unsubscribe();
    }
  });

  async function handleCommentSubmit(comment: string, imageUrl: string | null) {
    if (!$currentUrlSplit || !$currentUrl) {
      console.error("Unable to fetch current URL.");
      return;
    }

    try {
      postingComment.set(true);
      await addComment($currentUrl as string, comment, imageUrl);

      // After adding comment, check if pageId was null before
      if (!$currentPageId) {
        console.log("Page was missing, trying to fetch again.");
        const pageId = await findPageByRoute(
          $currentUrlSplit.domain,
          $currentUrlSplit.route,
        );

        if (pageId) {
          currentPageId.set(pageId);
          initialize(); // Only call initialize if pageId was missing
        }
      }
      // If page already existed, no need to call initialize
    } catch (error) {
      console.error((error as Error).message);
    } finally {
      postingComment.set(false);
    }
  }
</script>

<main>
  <Header
    currentUrl={$currentUrl as string}
    currentUrlSplit={$currentUrlSplit}
    currentPageId={$currentPageId as string}
  />

  {#if $postingComment}
    <PostingSpinner />
  {/if}
  <br />
  <FilterOptions />
  <CommentList />
  <CommentForm onSubmit={handleCommentSubmit} isPosting={$postingComment} />
</main>

<style lang="scss">
  main {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: transparent;
  }
</style>
