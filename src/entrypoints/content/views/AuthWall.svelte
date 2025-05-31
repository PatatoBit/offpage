<script lang="ts">
  import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
  import { supabase } from "@/lib/supabase";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";
  let { children } = $props();

  let loading: boolean = $state(true);

  function loginWithGoogle() {
    chrome.runtime.sendMessage({ type: "loginWithGoogle" }, (response) => {
      console.log("Login response:", response);

      if (response.success) {
        console.log("Login successful");
      } else {
        console.error("Login failed:", response.error);
      }
    });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "logout" || message.type === "login") {
      console.log("Auth refresh action received");

      initializeSession(); // Re-check session and update isSignedIn
      isSignedIn.set(false); // Set isSignedIn to false to trigger reactivity
    }
  });

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

  let email = $state("");
  let sentMail = $state("");
  let magicLinkSent = $state(false);

  async function signInWithMagicLink() {
    magicLinkSent = false;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // Set to false if you don't want to allow new users
      },
    });

    if (error) {
      console.error("Error sending magic link:", error.message);
    } else {
      sentMail = email;
      email = "";
      magicLinkSent = true;
    }
  }
</script>

<div class="page">
  {#if $isSignedIn}
    {@render children()}
  {:else if loading}
    <div class="center">
      <LoadSpinner />
    </div>
  {:else}
    <div class="center">
      {#if magicLinkSent}
        <p>✅Magic link sent to {sentMail}</p>
        <p>Check spam / junk folders too!</p>
      {/if}

      <form
        onsubmit={async (event) => {
          event.preventDefault();
          await signInWithMagicLink();
        }}
      >
        <input required type="email" placeholder="Email" bind:value={email} />
        <button class="primary" type="submit">Passwordless Sign-in</button>
      </form>

      <br />

      <button class="tertiary" onclick={async () => await loginWithGoogle()}
        >Sign in with Google</button
      >
    </div>
  {/if}
</div>

<style lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;

    margin-block: auto;

    width: 100%;
    height: 100%;
    gap: 16px;
    background-color: var(--background);
  }

  .center {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
