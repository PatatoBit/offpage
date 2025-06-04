<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { RealtimeChannel } from "@supabase/supabase-js";
  import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

  import {
    addComment,
    findCommentsDataByPageId,
    findPageByRoute,
  } from "@/lib/database";
  import type { CommentData } from "@/lib/database";
  import { fetchUserProfile, supabase } from "@/lib/supabase";
  import { getBaseUrlAndPath } from "@/lib/utils";
  import { extensionStatus } from "@/stores/AppStatus";

  import Header from "@/lib/components/Header.svelte";
  import CommentList from "./components/CommentList.svelte";
  import CommentForm from "./components/CommentForm.svelte";

  import { currentPageId, initialComments, isEmpty } from "@/stores/AppStatus";

  const currentUrl = writable<string | null>(null);

  let channel: RealtimeChannel;
  const postingComment = writable<boolean>(false);

  async function initialize() {
    // Log when initialize is called
    console.log("[ContentScript] initialize called");

    chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, (response) => {
      console.log("[ContentScript] GET_CURRENT_URL response:", response);
      if (response?.url) {
        currentUrl.set(response.url);
      } else {
        currentUrl.set("Unable to fetch URL");
      }
    });
  }

  onMount(() => {
    console.log(
      "[ContentScript] onMount, window.location.href:",
      window.location.href,
    );
    initialize();

    window.addEventListener("message", (event) => {
      if (event.data?.type === "OFFPAGE_URL_CHANGED") {
        console.log(
          "[ContentScript] OFFPAGE_URL_CHANGED event:",
          event.data.url,
        );
        currentUrl.set(event.data.url);
      }
    });
  });

  onDestroy(() => {
    if (channel) {
      console.log("Unsubscribing from comments_change channel.");
      channel.unsubscribe();
    }
  });

  let urlMeta: { baseUrl: string; domain: string; route: string } | null = null;
  $: $currentUrl, $extensionStatus;
  $: if ($currentUrl && $extensionStatus) {
    urlMeta = getBaseUrlAndPath($currentUrl, $extensionStatus.useTags);
  }

  $: if (urlMeta) {
    (async () => {
      isEmpty.set(false);

      const pageId = await findPageByRoute(urlMeta.domain, urlMeta.route);
      currentPageId.set(pageId);

      if (!pageId) {
        isEmpty.set(true);
        initialComments.set([]);
        return;
      }

      const comments = await findCommentsDataByPageId(pageId);
      initialComments.set(comments || []);
      if (!comments || comments.length === 0) {
        isEmpty.set(true);
      }

      if (channel) {
        await channel.unsubscribe();
      }
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
          async (payload: RealtimePostgresChangesPayload<CommentData>) => {
            isEmpty.set(false);
            if (Object.keys(payload.new).length > 0) {
              const comment = payload.new as CommentData;
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

        // Listen for UPDATES
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "comments",
            filter: `page_id=eq.${pageId}`,
          },
          async (payload: RealtimePostgresChangesPayload<CommentData>) => {
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
                prev.filter((comment) => comment.id !== deletedComment.id),
              );
            } else {
              console.warn(
                "Received an empty object as payload.old for DELETE",
              );
            }
          },
        )
        .subscribe();
    })();
  }

  async function handleCommentSubmit(comment: string, imageUrl: string | null) {
    if (!urlMeta || !$currentUrl) {
      console.error("Unable to fetch current URL.");
      return;
    }

    try {
      postingComment.set(true);
      await addComment($currentUrl as string, comment, imageUrl);

      if (!$currentPageId) {
        console.log("Page was missing, trying to fetch again.");
        const pageId = await findPageByRoute(urlMeta.domain, urlMeta.route);

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
    currentUrlSplit={urlMeta}
    currentPageId={$currentPageId as string}
  />

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
