<script lang="ts">
  import { signOut } from "@/lib/supabase";
  import { onMount } from "svelte";

  let currentUrl: string | undefined;

  // Fetch the current tab's URL on component mount
  onMount(() => {
    chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, (response) => {
      if (response?.url) {
        currentUrl = response.url;
      } else {
        currentUrl = "Unable to fetch URL.";
      }
    });
  });
</script>

<p>Signed in</p>

{#if currentUrl}
  <p>Current URL: {currentUrl}</p>
{/if}

<button on:click={async () => await signOut()}>Sign out</button>
