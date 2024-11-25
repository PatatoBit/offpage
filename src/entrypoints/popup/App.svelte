<script lang="ts">
  import SignIn from "@/lib/SignIn.svelte";
  import { FirebaseApp, SignedIn, SignedOut } from "sveltefire";
  import { auth, db as firestore } from "@/entrypoints/background";
  import { onMount } from "svelte";
  import { addComment, listenToComments } from "@/lib/firestoreService";
  import { getBaseUrl } from "@/lib/utils";

  let currentUrl: string | undefined;
  let currentComment: string = "";
  let comments: { text: string; timestamp: string }[] = [];

  // Fetch the current tab's URL on component mount
  onMount(() => {
    chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, (response) => {
      if (response?.url) {
        currentUrl = response.url;
        const baseUrl = currentUrl ? getBaseUrl(currentUrl) : undefined;
        if (baseUrl) {
          listenToComments(baseUrl, (newComments) => {
            comments = newComments;
          });
        }
      } else {
        currentUrl = "Unable to fetch URL.";
      }
    });
  });
</script>

<FirebaseApp {auth} {firestore}>
  <main>
    <SignedIn let:signOut>
      <button on:click={signOut}>Sign out</button>

      {#if currentUrl}
        <p>Current URL: {currentUrl}</p>
        <ul>
          {#each comments as { text, timestamp }}
            <li>
              <p>{text}</p>
              <small>{new Date(timestamp).toLocaleString()}</small>
            </li>
          {/each}
        </ul>
      {/if}

      <form on:submit={addComment} on:submit|preventDefault>
        <input
          type="text"
          bind:value={currentComment}
          placeholder="Add a comment"
        />
        <button type="submit">Submit</button>
      </form>
    </SignedIn>

    <SignedOut>
      <SignIn />
    </SignedOut>
  </main>
</FirebaseApp>
