<script lang="ts">
  import { signOut } from "@/lib/supabase";
</script>

<p>Signed in</p>
<button on:click={async () => await signOut()}>Sign out</button>
