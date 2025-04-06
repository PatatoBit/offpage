<script lang="ts">
  import { RealtimeChannel } from "@supabase/supabase-js";
  import {
    fetchUserProfile,
    signOut,
    supabase,
    updateUserProfile,
  } from "@/lib/supabase";
  import AuthWall from "../content/views/AuthWall.svelte";
  import { userId } from "@/lib/stores/sessionStore";
  import { uploadProfilePicture } from "@/lib/database";
  import { fade } from "svelte/transition";

  import "../../lib/styles/global.scss";
  import "../../lib/styles/variables.scss";

  import LoadSpinner from "../../lib/components/LoadSpinner.svelte";

  let profileSaveSuccess: boolean = false;

  interface UserProfileData {
    username: string;
    avatar_url: string;
  }

  let userData = {
    username: "",
    avatar_url: "",
  };

  let changedUserData = {
    username: "",
    avatar_url: "",
  };

  let previewProfilePicture: string | null = null;

  $: if ($userId && !userData.username && !userData.avatar_url) {
    (async () => {
      await fetchUserProfile($userId).then((profile) => {
        if (profile) {
          userData = profile;
          changedUserData = profile;
        }
      });
    })();
  }

  let file: File | null = null;
  // Handle file selection

  function handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      file = files[0];
      previewProfilePicture = URL.createObjectURL(file);
    }
  }

  async function handleProfileSave() {
    if ($userId) {
      if (file) {
        changedUserData.avatar_url = await uploadProfilePicture(file, $userId);
      }

      profileSaveSuccess = false;

      await updateUserProfile(
        $userId,
        changedUserData.username,
        changedUserData.avatar_url,
      );
    } else {
      console.error("User not found");
    }
  }

  // Realtime updates
  let channel: RealtimeChannel;
  onMount(async () => {
    channel = supabase.channel("profile_updates").on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
      },
      (payload) => {
        console.log("Profile table changed.");
        console.log(payload.new);

        if (Object.keys(payload.new).length > 0) {
          const profile = payload.new as UserProfileData;
          userData = profile;
          changedUserData = profile;

          profileSaveSuccess = true;
        } else {
          console.warn("Received an empty object as payload.new");
        }
      },
    );

    channel.subscribe();
  });
</script>

<main class="page">
  <AuthWall>
    {#if userData.username}
      <div class="card">
        <form
          on:submit={async () => await handleProfileSave()}
          on:submit|preventDefault
        >
          <img
            src={previewProfilePicture
              ? previewProfilePicture
              : userData.avatar_url}
            alt="User avatar"
          />

          <div class="input">
            <label for="profile"><p class="label">Avatar</p></label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              on:change={handleFileChange}
            />
          </div>

          <div class="input">
            <label for="profile"><p class="label">Username</p></label>
            <input type="text" bind:value={changedUserData.username} required />
          </div>

          <div>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>

        {#if profileSaveSuccess}
          <p transition:fade>✅Profile Saved</p>
        {/if}
        <LoadSpinner />

        <button class="signout" on:click={async () => await signOut()}
          >Sign out</button
        >
      </div>
    {/if}
  </AuthWall>
</main>

<style lang="scss">
  @use "../../lib/styles/global.scss";
  @use "../../lib/styles/variables.scss";

  .page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;

    background-color: var(--background);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    text-align: center;
    max-width: 300px;
    min-height: 500px;
    width: 100%;
    margin: 0 auto;

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    img {
      align-self: center;
    }
  }

  img {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 2px solid #ccc;

    object-fit: cover;
  }

  .input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    input {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 5px;
    }
  }

  label {
    width: 100%;

    .label {
      margin: 0;
      font-size: 0.8rem;
      color: #666;
      text-align: left;
    }
  }

  .signout {
    margin-top: auto;
    background-color: white;
    border-color: var(--red);
    color: var(--red);
  }
</style>
