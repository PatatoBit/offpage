<script lang="ts">
  import EmailAuth from "./../../lib/EmailAuth.svelte";
  import { auth, signInWithEmailLink } from "../background";
</script>

<main>
  <h2>Backstage</h2>

  <EmailAuth />
</main>
