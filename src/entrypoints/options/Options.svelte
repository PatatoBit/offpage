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
type FileChangeEvent = Event & { target: HTMLInputElement };

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
      } else {
        console.warn("Received an empty object as payload.new");
      }
    },
  );

  channel.subscribe();
});
</script>

<AuthWall>
  {#if userData.username}
    <main class="page">
      <div class="card">
        <form
          on:submit={async() => await handleProfileSave()}
          on:submit|preventDefault
        >
          <img
            src={previewProfilePicture ? previewProfilePicture : userData.avatar_url}
            alt="User avatar"
          />
          <input
            type="file"
            accept="image/png, image/jpeg"
            on:change={handleFileChange}
          />

          <input type="text" bind:value={changedUserData.username} required />

          <div>
            <button type="submit" class="primary">Save</button>
          </div>
        </form>
        <button on:click={async() => await signOut()}>Sign out</button>
      </div>
    </main>
  {/if}
</AuthWall>

<style lang="scss">
@use "../../lib/styles/variables.scss";

.page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
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
</style>
