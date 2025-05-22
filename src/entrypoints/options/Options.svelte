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

  let filterThreshold = {
    sexualContent: 10,
    hate: 10,
    harassment: 10,
    violence: 10,
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

      // Reset preview and file after saving
      previewProfilePicture = null;
      file = null;
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
          <p class="label">Name</p>

          <span>
            <input
              type="text"
              bind:value={changedUserData.username}
              placeholder="Name"
              required
            />
            <button type="submit" class="primary">Save</button>
          </span>
        </div>

        {#if profileSaveSuccess}
          <p transition:fade>✅Profile Saved</p>
        {/if}

        <button class="signout" on:click={async () => await signOut()}
          >Sign out</button
        >
      </form>

      <section>
        <h3>Filter threshold</h3>

        <div class="input">
          <p class="label">Sexual content</p>
          <span>
            <div class="slider-wrapper">
              <div
                class="slider-progress"
                style="width: {filterThreshold.sexualContent}%"
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={filterThreshold.sexualContent}
                required
                class="custom-range"
              />
            </div>
            <p>{filterThreshold.sexualContent}%</p>
          </span>
        </div>

        <div class="input">
          <p class="label">Hate</p>
          <span>
            <div class="slider-wrapper">
              <div
                class="slider-progress"
                style="width: {filterThreshold.hate}%"
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={filterThreshold.hate}
                required
                class="custom-range"
              />
            </div>
            <p>{filterThreshold.hate}%</p>
          </span>
        </div>

        <div class="input">
          <p class="label">Harassment</p>
          <span>
            <div class="slider-wrapper">
              <div
                class="slider-progress"
                style="width: {filterThreshold.harassment}%"
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={filterThreshold.harassment}
                required
                class="custom-range"
              />
            </div>
            <p>{filterThreshold.harassment}%</p>
          </span>
        </div>

        <div class="input">
          <p class="label">Violence</p>
          <span>
            <div class="slider-wrapper">
              <div
                class="slider-progress"
                style="width: {filterThreshold.violence}%"
              ></div>
              <input
                type="range"
                min="0"
                max="100"
                bind:value={filterThreshold.violence}
                required
                class="custom-range"
              />
            </div>
            <p>{filterThreshold.violence}%</p>
          </span>
        </div>
      </section>

      <!-- Links -->
      <section>
        <a href="https://offpage.featurebase.app/" target="_blank">
          Feedback
        </a>

        <a href="https://discord.gg/nrsug3t6ag" target="_blank"
          >Discord Server</a
        >

        <a href="https://offpage.patato.me" target="_blank">More about us</a>
      </section>
    {/if}
  </AuthWall>
</main>

<style lang="scss">
  @use "../../lib/styles/global.scss";
  @use "../../lib/styles/variables.scss";

  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    max-width: 320px;
    margin-inline: auto;
    gap: 64px;
  }

  section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;

    width: 100%;
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
      border: 1px solid #ccc;
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

  .label {
    font-size: 16px;
    color: var(--text);
    font-weight: 700;
  }

  .input {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 4px;

    input {
      flex: auto;
    }

    span {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 8px;
    }
  }

  .slider-wrapper {
    position: relative;
    width: 100%;
    height: 24px;
    display: flex;
    align-items: center;
  }

  .slider-progress {
    position: absolute;
    left: 0;
    top: 50%;
    height: 4px;
    background: var(--text, #4caf50);
    border-radius: 2px;
    transform: translateY(-50%);
    z-index: 1;
    pointer-events: none;
  }

  input[type="range"].custom-range {
    position: relative;
    width: 100%;
    background: transparent;
    z-index: 2;
    height: 24px;
    margin: 0;
    padding: 0;
    appearance: none;
    -webkit-appearance: none;
  }

  input[type="range"].custom-range::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    margin-top: -7px; // (18-4)/2 = 7, centers on 4px track
    background: url("/handle.svg") no-repeat center center;
    background-size: 16px 16px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  input[type="range"].custom-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: url("/handle.svg") no-repeat center center;
    background-size: 16px 16px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  input[type="range"].custom-range::-ms-thumb {
    width: 18px;
    height: 18px;
    background: url("/handle.svg") no-repeat center center;
    background-size: 16px 16px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
  }

  input[type="range"].custom-range::-webkit-slider-runnable-track {
    height: 4px;
    background: transparent;
  }
  input[type="range"].custom-range::-ms-fill-lower,
  input[type="range"].custom-range::-ms-fill-upper {
    background: transparent;
  }
  input[type="range"].custom-range::-moz-range-track {
    height: 4px;
    background: transparent;
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
