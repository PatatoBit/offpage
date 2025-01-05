<script lang="ts">
  import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
  import { supabase } from "@/lib/supabase";
  import { fly } from "svelte/transition";

  function loginWithGoogle() {
    chrome.runtime.sendMessage({ action: "loginWithGoogle" }, (response) => {
      if (response.success) {
        console.log("Login successful");
      } else {
        console.error("Login failed:", response.error);
      }
    });
  }

  onMount(() => {
    initializeSession()
      .catch((error) => {
        console.error("Failed to initialize session:", error);
      })
      .then(() => {
        console.log("Session initialized");
      });
  });

  function tester() {
    console.log("Tester");
    console.log(chrome.runtime.id);
  }

  $: $isSignedIn;
</script>

<button on:click={() => tester()}>Test</button>

{#if $isSignedIn}
  <slot />
{:else}
  <button on:click={async () => await loginWithGoogle()}>Sign in </button>
{/if}
