<script lang="ts">
  import { auth } from "@/entrypoints/background";
  import {
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
  } from "firebase/auth";
  import { onMount } from "svelte";

  let email = "";
  let message = "";

  const actionCodeSettings = {
    url: "https://example.com/finishSignUp",
    handleCodeInApp: true,
  };

  async function sendEmailLink() {
    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      message = "Email sent! Check your inbox.";
    } catch (error) {
      message = `Error: ${(error as any).message}`;
    }
  }

  async function completeSignIn() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        email = prompt("Enter your email for confirmation") || "";
      }
      try {
        const userCredential = await signInWithEmailLink(
          auth,
          storedEmail || email,
          window.location.href
        );
        message = `Welcome back, ${userCredential.user.email}`;
        window.localStorage.removeItem("emailForSignIn");
      } catch (error) {
        message = `Error: ${(error as any).message}`;
      }
    }
  }

  onMount(completeSignIn);
</script>

<div>
  <h1>Login with Email</h1>
  <input type="email" bind:value={email} placeholder="Enter your email" />
  <button on:click={sendEmailLink}>Send Email Link</button>
  <p>{message}</p>
</div>
