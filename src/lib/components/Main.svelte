<script lang="ts">
  import { signOut } from "@/lib/supabase";

  export let isSignedIn: boolean;
</script>

<p>Signed in</p>
<button on:click={async () => (isSignedIn = await signOut())}>Sign out</button>
