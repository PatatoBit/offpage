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

            const pageId = await findPageByRoute(
              $currentUrlSplit.domain,
              $currentUrlSplit.route,
            );

            channel = supabase
              .channel("comments_inserts_updates_deletes")

              // Listen for INSERTS
              .on(
                "postgres_changes",
                {
                  event: "INSERT",
                  schema: "public",
                  table: "comments",
                  filter: `page_id=eq.${pageId}`,
                },
                async (
                  payload: RealtimePostgresChangesPayload<CommentData>,
                ) => {
                  isEmpty.set(false);
                  if (Object.keys(payload.new).length > 0) {
                    const comment = payload.new as CommentData;
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

              // Listen for UPDATES
              .on(
                "postgres_changes",
                {
                  event: "UPDATE",
                  schema: "public",
                  table: "comments",
                  filter: `page_id=eq.${pageId}`,
                },
                async (
                  payload: RealtimePostgresChangesPayload<CommentData>,
                ) => {
                  if (Object.keys(payload.new).length > 0) {
                    const updatedComment = payload.new as CommentData;
                    const newUpdatedComment = {
                      ...updatedComment,
                      profiles: await fetchUserProfile(updatedComment.author),
                    };
                    initialComments.update((prev) =>
                      prev.map((comment) =>
                        comment.id === updatedComment.id
                          ? newUpdatedComment
                          : comment,
                      ),
                    );
                  } else {
                    console.warn(
                      "Received an empty object as payload.new for UPDATE",
                    );
                  }
                },
              )

              // Listen for DELETES
              .on(
                "postgres_changes",
                {
                  event: "DELETE",
                  schema: "public",
                  table: "comments",
                },
                (payload: RealtimePostgresChangesPayload<CommentData>) => {
                  if (Object.keys(payload.old).length > 0) {
                    const deletedComment = payload.old as CommentData;
                    initialComments.update((prev) =>
                      prev.filter(
                        (comment) => comment.id !== deletedComment.id,
                      ),
                    );
                  } else {
                    console.warn(
                      "Received an empty object as payload.old for DELETE",
                    );
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
  <CommentList />
  <CommentForm onSubmit={handleCommentSubmit} isPosting={$postingComment} />
</main>

<style lang="scss">
  main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
</style>
