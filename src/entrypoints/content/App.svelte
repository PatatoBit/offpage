<script lang="ts">
  import { supabase } from "@/lib/supabase";
  import Main from "@/lib/components/Main.svelte";

  let isSignedIn: boolean = false;

  function loginWithGoogle() {
    chrome.runtime.sendMessage({ action: "loginWithGoogle" }, (response) => {
      if (response.success) {
        console.log("Login successful");
      } else {
        console.error("Login failed:", response.error);
      }
    });
  }

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

  function tester() {
    console.log("Tester");
    console.log(chrome.runtime.id);
  }
</script>

<main class="page">
  <button on:click={() => tester()}>Test</button>

  {#if isSignedIn}
    <Main isSignedIn />
  {:else}
    <button on:click={async () => await loginWithGoogle()}>Sign in </button>
  {/if}
</main>

<style lang="scss">
  .page {
    position: fixed;
    top: 0;
    bottom: 0;
    right: 0;

    width: 500px;
    height: 80vh;

    gap: 1rem;

    button {
      cursor: pointer;
    }
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

      &:hover {
        background-color: var(--primary);
      }
    }
  }
</style>
