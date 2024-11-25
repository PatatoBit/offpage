<script lang="ts">
  import SignIn from "@/lib/SignIn.svelte";
  import { FirebaseApp, SignedIn, SignedOut } from "sveltefire";
  import { auth, db as firestore } from "@/entrypoints/background";
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

<FirebaseApp {auth} {firestore}>
  <main>
    <SignedIn let:user let:signOut>
      <p>Welcome {user.email}</p>

      {#if currentUrl}
        <p>Current URL: {currentUrl}</p>
      {/if}

      <button on:click={signOut}>Sign out</button>
    </SignedIn>

    <SignedOut>
      <SignIn />
    </SignedOut>
  </main>
</FirebaseApp>
