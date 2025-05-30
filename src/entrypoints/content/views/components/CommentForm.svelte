<script lang="ts">
  import { CornerUpRight, Image } from "@lucide/svelte";
  import axios from "axios";

  import Cross from "@/assets/icons/cross.svg";
  import { uploadCommentImage } from "@/lib/database";
  import { currentPageId } from "@/stores/AppStatus";
  import { userId } from "@/lib/stores/sessionStore";
  import { convertImageToBase64, isValidImage } from "@/lib/utils";
  import { supabase } from "@/lib/supabase";
  import PostingSpinner from "./PostingSpinner.svelte";
  import { fly } from "svelte/transition";

  export let onSubmit: (
    comment: string,
    imageUrl: string | null,
  ) => Promise<void>;

  export let isPosting: boolean;

  let currentComment: string = "";
  let inputRef: HTMLInputElement | null = null;
  let file: File | null = null;
  let currentFileUrl: string | null = null;

  async function handleSubmit() {
    if (!currentComment) {
      console.error("Comment cannot be empty.");
      return;
    }

    const comment = currentComment;
    currentComment = "";

    let image64Data: string | null = null;

    if (file) {
      image64Data = await convertImageToBase64(file);

      if (image64Data) {
        file = null;
        currentFileUrl = null;
      } else {
        console.error("Unable to upload image.");
      }
    }

    await onSubmit(comment, image64Data);
  }

  async function handleEnterKey(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await handleSubmit();
    }
  }

  function handleFileDrop(event: DragEvent) {
    event.preventDefault();
    const droppedFile = event.dataTransfer?.files[0];

    if (droppedFile && isValidImage(droppedFile)) {
      file = droppedFile;
      currentFileUrl = URL.createObjectURL(file);
    }
  }

  function handleFileSelect(event: Event) {
    const selectedFile = (event.target as HTMLInputElement)?.files?.[0];
    if (selectedFile && isValidImage(selectedFile)) {
      file = selectedFile;
      currentFileUrl = URL.createObjectURL(file);
    } else {
      console.error("Invalid file type.");
    }
  }

  function triggerFileInput() {
    if (inputRef) {
      inputRef.click();
    }
  }
</script>

<form
  class="file-area"
  on:submit|preventDefault={handleSubmit}
  on:dragover|preventDefault
  on:drop={handleFileDrop}
>
  {#if isPosting}
    <div class="spinner-container" transition:fly={{ y: -50 }}>
      <PostingSpinner />
    </div>
  {/if}

  <div class="input-area">
    {#if currentFileUrl}
      <div class="dropped-file-area">
        <div class="dropped-image">
          <img src={currentFileUrl} alt="Dropped file" />

          <button
            on:click={() => {
              file = null;
              currentFileUrl = null;
            }}
          >
            <img src={Cross} alt="Remove" />
          </button>
        </div>
      </div>
    {/if}

    <textarea
      bind:value={currentComment}
      on:keydown={handleEnterKey}
      placeholder="Share your thoughts..."
      required
      rows="3"
      maxlength="500"
      disabled={isPosting}
    ></textarea>

    <input
      type="file"
      bind:this={inputRef}
      accept="image/png, image/jpeg, image/gif"
      on:change={handleFileSelect}
      hidden
    />

    <div class="form-buttons">
      <button type="button" class="file-input" on:click={triggerFileInput}>
        <Image size={20} color="var(--text)" />
      </button>

      <button class="primary" type="submit" disabled={isPosting}>
        <p>Send</p>
        <CornerUpRight size={15} color="var(--background)" />
      </button>
    </div>
  </div>
</form>

<style lang="scss">
  textarea {
    max-width: 100%;
    padding: 12px 12px 48px 12px;
  }

  .form-buttons {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;

    display: flex;
    flex-direction: row;
    justify-content: space-between;
    max-width: 100%;
    gap: 8px;
    height: 35px;

    button {
      cursor: pointer;
    }
  }
  .file-area {
    position: relative;
    display: flex;
    flex-direction: column;
    pointer-events: none;
    width: 100%;
    gap: 0.5rem;

    .file-input {
      all: unset;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: scale 0.3s cubic-bezier(0.075, 0.82, 0.165, 1);

      img {
        width: 30px;
        height: 30px;
      }
    }
  }

  .spinner-container {
    position: absolute;
    top: -50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
  }

  .input-area {
    position: relative;
    box-sizing: border-box;
    pointer-events: all;
    width: 100%;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    background: var(--background);
    border-top: 1px solid var(--border);
  }

  .dropped-file-area {
    position: absolute;
    display: flex;
    flex-direction: row;
    gap: 8px;
    width: 100%;
    height: 100%;
    top: -140px;

    .dropped-image {
      position: relative;
      border-radius: 8px;
      background-color: var(--border);
      box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);
      -webkit-box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);
      -moz-box-shadow: -1px 5px 7px 0px rgba(0, 0, 0, 0.17);

      button {
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: var(--red);
        border: none;
        padding: 4px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          filter: invert(1);
          width: 10px;
          height: 10px;
        }
      }

      img {
        height: 100%;
        width: auto;
      }
    }
  }
</style>
