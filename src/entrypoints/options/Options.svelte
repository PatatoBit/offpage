<script lang="ts">
import { fetchUserProfile, signOut } from "@/lib/supabase";
import AuthWall from "../content/views/AuthWall.svelte";
import { userId } from "@/lib/stores/sessionStore";

let userData = {
  username: "",
  avatar_url: "",
};

$: if ($userId) {
  (async () => {
    await fetchUserProfile("84450ce1-b39c-4503-be92-009a5e6841b2").then(
      (profile) => {
        console.log("====================================");
        console.log(profile);
        console.log("====================================");

        if (profile) {
          userData = profile;
        }
      },
    );
  })();
}
</script>

<AuthWall>
  {#if userData.username}
    <main class="page">
      <div class="card">
        <img src={userData.avatar_url} alt="User avatar" />
        <input type="text" value={userData.username} required />

        <button on:click={async() => await signOut()}>Sign out</button>
      </div>
    </main>
  {/if}
</AuthWall>

<style>
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
  align-items: center;
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
}

img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid #ccc;
}
</style>
