<script lang="ts">
  import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
  import { supabase } from "@/lib/supabase";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";

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

{#if $isSignedIn}
  <slot />
{:else if loading}
  <div class="center">
    <LoadSpinner />
  </div>
{:else}
  <main class="page">
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

    <button onclick={async () => await loginWithGoogle()}
      >Sign in with Google</button
    >
  </main>
{/if}

<style lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: var(--background);
    text-align: center;

    height: 100%;
    gap: 16px;
  }

  .center {
    max-width: 960px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
</style>
