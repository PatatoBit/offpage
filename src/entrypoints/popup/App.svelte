<script lang="ts">
  import { onMount } from "svelte";
  import moment from "moment";
  import { Timestamp } from "firebase/firestore";
  import { FirebaseApp, SignedIn, SignedOut } from "sveltefire";

  import { auth, db as firestore } from "@/entrypoints/background";
  import { addComment, listenToComments } from "@/lib/firestoreService";
  import { getBaseUrlAndPath } from "@/lib/utils";

  import SignIn from "@/lib/SignIn.svelte";

  type CommentData = {
    text: string;
    sender: string;
    timestamp: Timestamp;
  };

  type URLPath = {
    baseUrl: string;
    pagePath: string;
  };

  let currentUrl: string | undefined;
  let currentText: string = "";

  let comments: { text: string; sender: string; timestamp: Timestamp }[] = [];
  let currentPath: URLPath | undefined;

  // Fetch the current tab's URL on component mount
  onMount(() => {
    chrome.runtime.sendMessage({ type: "GET_CURRENT_URL" }, (response) => {
      if (response?.url) {
        currentUrl = response.url;

        const parsedUrl = getBaseUrlAndPath(currentUrl!);
        if (parsedUrl) {
          currentPath = parsedUrl;

          // Listen to comments for the specific page
          listenToComments(currentPath, (newComments) => {
            comments = newComments.map((comment) => ({
              ...comment,
              sender: comment.sender || "Unknown sender",
              timestamp: comment.timestamp,
            }));
          });
        }
      } else {
        currentUrl = "Unable to fetch URL.";
      }
    });
  });

  async function handleSubmitComment(userEmail: string) {
    if (currentPath && userEmail) {
      console.table({
        currentPath,
        currentComment: currentText,
        userEmail,
      });
      await addComment(currentText, userEmail, currentPath);
      currentText = ""; // Clear the input field
    }
  }
</script>

<FirebaseApp {auth} {firestore}>
  <main>
    <SignedIn let:user let:signOut>
      <p>User: {user.email}</p>
      <button on:click={signOut}>Sign out</button>

      {#if currentUrl}
        <p>Current URL: {currentPath?.baseUrl}</p>
        <p>Page Path: {currentPath?.pagePath}</p>

        <ul>
          {#each comments as { text, sender, timestamp }}
            <li>
              <p>{text}</p>
              <small>By: {sender}</small>
              {#if timestamp}
                <small>At: {moment(timestamp.toDate()).fromNow()}</small>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <form
        on:submit|preventDefault={() =>
          user.email && handleSubmitComment(user.email)}
      >
        <input
          type="text"
          bind:value={currentText}
          placeholder="Add a comment"
          required
        />
        <button type="submit">Submit</button>
      </form>
    </SignedIn>

    <SignedOut>
      <SignIn />
    </SignedOut>
  </main>
</FirebaseApp>
