<script lang="ts">
  import { addComment } from "@/lib/database";
  import { signOut } from "@/lib/supabase";
  import { getBaseUrlAndPath } from "@/lib/utils";
  import { onMount } from "svelte";

  let currentUrl: string | undefined;
  let currentUrlSplit: { baseUrl: string; pagePath: string } | null;

  // Fetch the current tab's URL on component mount
  onMount(() => {
    chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, (response) => {
      if (response?.url) {
        currentUrl = response.url;
        currentUrlSplit = getBaseUrlAndPath(response.url);
      } else {
        currentUrl = "Unable to fetch URL.";
      }
    });
  });

  let comment: string = "";
  // Handle form submission
  const handleSubmit = async () => {
    console.log(comment);
    if (!currentUrlSplit) {
      console.error("Unable to fetch current URL.");
      return;
    }

    try {
      const newComment = await addComment(
        currentUrlSplit?.baseUrl,
        "This is a test comment."
      );
      console.log("Comment added:", newComment);
    } catch (error) {
      console.error((error as Error).message);
    }
  };
</script>

<p>Signed in</p>

{#if currentUrl}
  <p>Current URL: {currentUrl}</p>
  <p>Base URL: {currentUrlSplit?.baseUrl}</p>
  <p>Page path: {currentUrlSplit?.pagePath}</p>
  <p></p>
{/if}

<form action="" on:submit|preventDefault={async () => await handleSubmit()}>
  <input bind:value={comment} type="text" placeholder="Comment something..." />
  <button type="submit">Submit</button>
</form>

<button on:click={async () => await signOut()}>Sign out</button>
