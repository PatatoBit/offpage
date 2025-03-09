<script lang="ts">
import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
import Loading from "@/lib/components/Loading.svelte";

let loading: boolean = $state(true);

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

  setTimeout(() => {
    loading = false;
  }, 1000);
});
</script>

{#if $isSignedIn}
  <slot />
{:else if loading}
  <Loading />
{:else}
  <button onclick={async () => await loginWithGoogle()}>Sign in</button>
{/if}
