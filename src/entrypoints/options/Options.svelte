<script lang="ts">
  import { RealtimeChannel } from "@supabase/supabase-js";
  import {
    fetchUserProfile,
    signOut,
    supabase,
    updateUserProfile,
  } from "@/lib/supabase";
  import { userId } from "@/lib/stores/sessionStore";
  import { uploadProfilePicture } from "@/lib/database";
  import { fade } from "svelte/transition";

  import "../../lib/styles/global.scss";
  import "../../lib/styles/variables.scss";
  import AuthWall from "../content/views/AuthWall.svelte";
  import { Pen } from "@lucide/svelte";

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
      <form
        on:submit={async () => await handleProfileSave()}
        on:submit|preventDefault
      >
        <label class="avatar-label">
          <div class="avatar-wrapper {previewProfilePicture ? 'unsaved' : ''}">
            <img
              src={previewProfilePicture
                ? previewProfilePicture
                : userData.avatar_url}
              alt="User avatar"
              class="avatar-img"
            />
            <div class="avatar-overlay">
              <Pen color="var(--background)" />
            </div>
          </div>
          <input
            type="file"
            accept="image/png, image/jpeg"
            on:change={handleFileChange}
            style="display: none;"
          />
        </label>

        <div class="input">
          <input
            type="text"
            bind:value={changedUserData.username}
            placeholder="Name"
            required
          />
          <button type="submit" class="primary">Save</button>
        </div>

        <button class="signout" on:click={async () => await signOut()}
          >Sign out</button
        >
      </form>

      {#if profileSaveSuccess}
        <p transition:fade>✅Profile Saved</p>
      {/if}
      <!-- <LoadSpinner /> -->

      <div class="bottom-buttons">
        <a href="https://offpage.featurebase.app/" target="_blank">
          <button>Feedback</button>
        </a>
      </div>
    {/if}
  </AuthWall>
</main>

<style lang="scss">
  @use "../../lib/styles/global.scss";
  @use "../../lib/styles/variables.scss";

  .page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;

    background-color: var(--overlay-background);
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 50px;
    gap: 16px;

    label {
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;

      &:hover {
        img {
          border-color: var(--accent);
        }
      }
    }
  }

  img {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 2px solid #ccc;

    object-fit: cover;
  }

  .avatar-label {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    position: relative;
  }

  .avatar-wrapper {
    position: relative;
    display: inline-block;

    &.unsaved .avatar-img {
      border-color: var(--primary, green);
    }

    .avatar-img {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      border: 2px solid #ccc;
      object-fit: cover;
      transition: border-color 0.2s;
      display: block;
    }

    .avatar-overlay {
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: rgba(128, 128, 128, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:hover .avatar-overlay {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .input {
    display: flex;
    flex-direction: row;
    width: 100%;

    input {
      flex: auto;
    }
    gap: 8px;
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

  .bottom-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
  }

  .signout {
    border: 0;
    background-color: var(--red);
    color: white;
  }
</style>
