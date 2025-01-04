<script lang="ts">
  import { supabase } from "@/lib/supabase";
  import Main from "@/lib/components/Main.svelte";
  import { fly } from "svelte/transition";

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

  let showPopup = false;
</script>

<div class="left-hover">
  {#if showPopup}
    <main class="page" transition:fly={{ x: 100, duration: 300 }}>
      <button on:click={() => tester()}>Test</button>

      {#if isSignedIn}
        <Main isSignedIn />
      {:else}
        <button on:click={async () => await loginWithGoogle()}>Sign in </button>
      {/if}

      <button on:click={() => (showPopup = !showPopup)}>X</button>
    </main>
  {:else}
    <button
      transition:fly={{ x: 100, duration: 300 }}
      on:click={() => (showPopup = !showPopup)}
      style="position:absolute; top:50%; right:1rem; transform:translateY(-50%)"
      >Show</button
    >
    <!-- else content here -->
  {/if}
</div>

<style lang="scss">
  .page {
    width: 500px;
    height: 80vh;

    background-color: white;
    border: 2px solid red;

    gap: 1rem;

    button {
      cursor: pointer;
    }
  }

  .left-hover {
    position: fixed;
    top: 50%;
    right: 1rem;

    display: flex;

    transform: translateY(-50%);
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
