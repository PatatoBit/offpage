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

<style lang="scss">
.comments {
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0.5rem;
  overflow: scroll;
  overflow-x: hidden;

  height: 15rem;
}

.comment-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;

  input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--primary);
  }

  button {
    background-color: var(--primary);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      background-color: var(--primary);
    }
  }
}
</style>
