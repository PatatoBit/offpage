<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import { auth } from "../entrypoints/background";
  import { signInWithEmailAndPassword } from "firebase/auth";
  let email: string = "";
  let password: string = "";

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Signed in");
    } catch (error) {
      console.error(error);
    }
  };
</script>

<form on:submit={async () => await signIn()} on:submit|preventDefault>
  <input type="text" bind:value={email} placeholder="Email" />
  <input type="password" bind:value={password} placeholder="Password" />
  <input type="submit" />
</form>
