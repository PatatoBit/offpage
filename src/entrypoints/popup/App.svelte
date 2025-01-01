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

  import { createClient } from "@supabase/supabase-js";

  // Create a single supabase client for interacting with your database
  const supabase = createClient(
    "https://blbixtcshtlrvmgkgpco.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYml4dGNzaHRscnZtZ2tncGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MTg1MDAsImV4cCI6MjA1MTI5NDUwMH0.R--eWEssN7Loz3WIEk8zthDLEcZGHTlnysQ2HX0ZadI"
  );

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

  let comments: {
    text: string;
    sender: string;
    timestamp: Timestamp;
    upvotes: number;
  }[] = [];
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
      await addComment(currentText, userEmail, currentPath);
      currentText = ""; // Clear the input field
    }
  }

  export async function loginWithGoogle() {
    console.log(chrome.identity.getRedirectURL());

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: chrome.identity.getRedirectURL(),
      },
    });
    if (error) throw error;

    await chrome.tabs.create({ url: data.url });
  }

  let isSignedIn: boolean = false;

  onMount(async () => {
    const { session } = await chrome.storage.local.get("session");
    if (session) {
      const { error: supaAuthError } = await supabase.auth.setSession(session);
      if (supaAuthError) {
        throw supaAuthError;
      }

      isSignedIn = true;
    }
  });

  async function signOut() {
    await supabase.auth.signOut();
    isSignedIn = false;
  }
</script>

<main class="page">
  {#if isSignedIn}
    <p>Signed in</p>
    <button on:click={async () => await signOut()}>Sign out</button>
  {:else}
    <button on:click={async () => await loginWithGoogle()}>Sign in </button>
  {/if}
</main>

<!-- <FirebaseApp {auth} {firestore}>
  {#if currentPath}
    <Header baseUrl={currentPath?.baseUrl} pagePath={currentPath?.pagePath} />
  {/if}

  <main class="page">
    <SignedIn let:user>
      {#if currentUrl}
        {#if comments.length > 0}
          <div class="comments">
            {#each comments as { text, sender, timestamp, upvotes }}
              <Comment {sender} {text} {timestamp} {upvotes} />
            {/each}
          </div>
        {:else}
          <h3>nothing here yet</h3>
          <p>
            be the first to share your thoughts and this corner of the internet!
          </p>
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
</FirebaseApp> -->

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
