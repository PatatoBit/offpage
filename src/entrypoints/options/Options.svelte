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
