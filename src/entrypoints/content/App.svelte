<script lang="ts">
import Main from "@/entrypoints/content/views/Main.svelte";
import AppLayout from "@/lib/components/AppLayout.svelte";
import AuthWall from "./views/AuthWall.svelte";
</script>

<AppLayout>
  <AuthWall>
    <Main />
  </AuthWall>
</AppLayout>
