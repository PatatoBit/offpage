<script lang="ts">
import { fetchUserProfile, signOut, updateUserProfile } from "@/lib/supabase";
import AuthWall from "../content/views/AuthWall.svelte";
import { userId } from "@/lib/stores/sessionStore";

let userData = {
  username: "",
  avatar_url: "",
};

let changedUserData = {
  username: "",
  avatar_url: "",
};

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

let files: FileList;

async function handleProfileSave() {
  if ($userId) {
    await updateUserProfile(
      $userId,
      changedUserData.username,
      changedUserData.avatar_url,
    );
  } else {
    console.error("User not found");
  }
}
</script>

<AuthWall>
  {#if userData.username}
    <main class="page">
      <div class="card">
        <form
          on:submit={async() => await handleProfileSave()}
          on:submit|preventDefault
        >
          <img src={userData.avatar_url} alt="User avatar" />
          <input
            type="file"
            accept="image/png, image/jpeg"
            bind:files={files}
          />

          <input type="text" bind:value={changedUserData.username} required />

          <div>
            <!-- <button on:click={async() => await signOut()}>Sign out</button> -->
            <button type="submit" class="primary">Save</button>
          </div>
        </form>
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
}
</style>
