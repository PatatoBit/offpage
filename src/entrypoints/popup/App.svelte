<script lang="ts">
  import { onMount } from "svelte";
  import moment from "moment";
  import { Timestamp } from "firebase/firestore";
  import { FirebaseApp, SignedIn, SignedOut } from "sveltefire";

  import { auth, db as firestore } from "@/entrypoints/background";
  import { addComment, listenToComments } from "@/lib/firestoreService";
  import { getBaseUrlAndPath } from "@/lib/utils";

  import Header from "@/lib/components/Header.svelte";
  import SignIn from "@/lib/components/SignIn.svelte";
  import Comment from "@/lib/components/Comment.svelte";

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
  {#if currentPath}
    <Header baseUrl={currentPath?.baseUrl} pagePath={currentPath?.pagePath} />
  {/if}

  <main class="page">
    <SignedIn let:user>
      {#if currentUrl}
        {#if comments.length > 0}
          <div class="comments">
            {#each comments as { text, sender, timestamp }}
              <Comment {sender} {text} {timestamp} />
            {/each}
          </div>
        {:else}
          <h3>nothing here yet</h3>
          <p>
            be the first to share your thoughts and this corner of the internet!
          </p>
          <!-- else content here -->
        {/if}
      {/if}

      <form
        class="comment-form"
        on:submit|preventDefault={() =>
          user.email && handleSubmitComment(user.email)}
      >
        <input
          type="text"
          bind:value={currentText}
          placeholder="share your thoughts..."
          required
        />
        <button type="submit">post</button>
      </form>
    </SignedIn>

    <SignedOut>
      <SignIn />
    </SignedOut>
  </main>
</FirebaseApp>

<style lang="scss">
  .page {
    gap: 1rem;
  }

  .comments {
    display: flex;
    flex-direction: column;
    padding: 0;
    gap: 0.5rem;
    overflow: scroll;
    overflow-x: hidden;

    height: 15rem;
  }

  .comment-form {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;

    input {
      flex: 1;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid var(--primary);
    }

    button {
      background-color: var(--primary);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
    }
  }
</style>
