<script lang="ts">
  import Password from "@/lib/SignIn.svelte";
  import { FirebaseApp, SignedIn, SignedOut } from "sveltefire";
  import { auth, db as firestore } from "@/entrypoints/background";
</script>

<FirebaseApp {auth} {firestore}>
  <main>
    <SignedIn let:user>
      <p>Welcome {user.email}</p>
    </SignedIn>

    <SignedOut>
      <Password />
    </SignedOut>
  </main>
</FirebaseApp>
