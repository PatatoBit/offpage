<script lang="ts">
import { fetchUserProfile } from "@/lib/supabase";
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
    <h1>{userData.username}</h1>
    <img src={userData.avatar_url} alt="User avatar" />
  {/if}
</AuthWall>

<style>
h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px solid #ccc;
}
</style>
