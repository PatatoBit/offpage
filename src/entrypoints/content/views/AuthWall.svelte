<script lang="ts">
import { initializeSession, isSignedIn } from "@/lib/stores/sessionStore";
import Loading from "@/lib/components/Loading.svelte";
import { supabase } from "@/lib/supabase";

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

async function signInWithMagicLink() {
  console.log("Signing in with email:", email);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Set to false if you don't want to allow new users
    },
  });

  if (error) {
    console.error("Error sending magic link:", error.message);
  } else {
    console.log("Magic link sent! Check your email.");
  }
}
</script>

{#if $isSignedIn}
  <slot />
{:else if loading}
  <Loading />
{:else}
  <main class="page">
    <form
      onsubmit={async (event) => { event.preventDefault(); await signInWithMagicLink(); }}
    >
      <input required type="email" placeholder="Email" bind:value={email} />
      <button class="primary" type="submit">Passwordless Sign-in</button>
    </form>

    <button onclick={async () => await loginWithGoogle()}
      >Sign in with Google</button
    >
  </main>
{/if}

<style lang="scss">
@use "../../../lib/styles/global.scss";
@use "../../../lib/styles/variables.scss";

.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--background);

  gap: 1rem;
}

.center {
  max-width: 60rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
