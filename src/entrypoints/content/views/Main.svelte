<script lang="ts">
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
</script>

<p>Signed in</p>

{#if currentUrl}
  <p>Current URL: {currentUrl}</p>
  <p>Base URL: {currentUrlSplit?.baseUrl}</p>
  <p>Page path: {currentUrlSplit?.pagePath}</p>
  <p></p>
{/if}

<form action="">
  <input type="text" placeholder="Comment something..." />
</form>

<button on:click={async () => await signOut()}>Sign out</button>
