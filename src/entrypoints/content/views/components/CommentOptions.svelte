<script lang="ts">
  import { supabase } from "@/lib/supabase";
  import { Ellipsis } from "@lucide/svelte";
  import { onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  // Accept commentId and imageUrl as props from the parent
  const { commentId, imageUrl = null } = $props<{
    commentId: string | number;
    imageUrl?: string | null;
  }>();

  let popupOpen = $state(false);
  let popupRef = $state<HTMLDivElement | null>(null);
  let buttonRef = $state<HTMLButtonElement | null>(null);

  function handleClickOutside(event: PointerEvent) {
    if (
      (popupRef && popupRef.contains(event.target as Node)) ||
      (buttonRef && buttonRef.contains(event.target as Node))
    ) {
      return;
    }
    popupOpen = false;
  }

  $effect(() => {
    if (popupOpen && popupRef) {
      document.addEventListener("pointerdown", handleClickOutside);
    } else {
      document.removeEventListener("pointerdown", handleClickOutside);
    }
  });

  onDestroy(() => {
    document.removeEventListener("pointerdown", handleClickOutside);
  });

  const deleteComment = async () => {
    console.log(`Delete comment with ID: ${commentId}`);
    // If imageUrl exists, delete the image via edge function
    if (imageUrl) {
      let storagePath = imageUrl;
      const prefix =
        "https://blbixtcshtlrvmgkgpco.supabase.co/storage/v1/object/public/comments-images/";
      if (imageUrl.startsWith(prefix)) {
        storagePath = imageUrl.slice(prefix.length);
      }

      console.log(`Deleting image at storage path: ${storagePath}`);

      const { error } = await supabase.storage
        .from("comments-images")
        .remove([storagePath]);
      if (error) {
        console.error("Error deleting image:", error.message);
        return;
      }
    }

    const res = await supabase.from("comments").delete().eq("id", commentId);
    if (res.error) {
      console.error("Error deleting comment:", res.error);
      return;
    }
    console.log("Comment deleted successfully");
    popupOpen = false;
  };
</script>

<div class="comment-options">
  <button
    bind:this={buttonRef}
    onclick={(e) => {
      popupOpen = !popupOpen;
    }}
  >
    <Ellipsis class="lucide" color="var(--border)" size={16} />
  </button>

  {#if popupOpen}
    <div
      class="popup"
      bind:this={popupRef}
      onpointerdown={(e) => e.stopPropagation()}
      transition:fly={{
        y: -10,
        duration: 200,
      }}
    >
      <button onclick={deleteComment}><p class="label">Delete</p></button>
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
