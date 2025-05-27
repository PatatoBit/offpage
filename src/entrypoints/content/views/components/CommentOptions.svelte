<script lang="ts">
  import { supabase } from "@/lib/supabase";
  import { Ellipsis } from "@lucide/svelte";
  const { commentId } = $props<{ commentId: string | number }>();

  let popupOpen = $state(false);

  const deleteComment = async () => {
    // Implement the delete comment logic here
    console.log(`Delete comment with ID: ${commentId}`);

    const res = await supabase.from("comments").delete().eq("id", commentId);

    if (res.error) {
      console.error("Error deleting comment:", res.error);
      return;
    }

    console.log("Comment deleted successfully");
    popupOpen = false; // Close the popup after deletion
  };
</script>

<div class="comment-options">
  <button
    onclick={(e) => {
      popupOpen = !popupOpen;
    }}
  >
    <Ellipsis class="lucide" color="var(--border)" size={16} />
  </button>

  {#if popupOpen}
    <div class="popup">
      <button onclick={deleteComment}>Delete</button>
    </div>
  {/if}
</div>

<style lang="scss">
  .comment-options {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      background-color: var(--highlight);
      border-radius: 50%;
    }
  }

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    .lucide {
      &:hover,
      &:active {
        color: var(--text);
      }
    }
  }

  .popup {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 1000;

    display: flex;
    flex-direction: column;
    gap: 8px;

    button {
      background: transparent;
      border: none;
      color: var(--text);
      padding: 8px;
      cursor: pointer;

      &:hover {
        background-color: var(--highlight);
        border-radius: 4px;
      }
    }
  }
</style>
