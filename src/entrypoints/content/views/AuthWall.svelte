<script lang="ts">
  import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
  import { supabase } from "@/lib/supabase";
  import { fly } from "svelte/transition";

  function loginWithGoogle() {
    chrome.runtime.sendMessage({ action: "loginWithGoogle" }, (response) => {
      console.log("Login response:", response);

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

  $: $isSignedIn;
</script>

{#if $isSignedIn}
  <slot />
{:else}
  <button on:click={async () => await loginWithGoogle()}>Sign in </button>
{/if}
