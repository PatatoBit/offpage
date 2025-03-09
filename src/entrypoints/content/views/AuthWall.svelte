<script lang="ts">
import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
import Cat from "@/assets/cat.gif";

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
});
</script>

{#if $isSignedIn}
  <slot />
{:else if loading}
  <img src={Cat} alt="oia cat" />
{:else}
  <button onclick={async () => await loginWithGoogle()}>Sign in</button>
{/if}
