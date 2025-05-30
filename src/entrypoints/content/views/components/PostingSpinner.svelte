<script lang="ts">
  import { fly } from "svelte/transition";
  import LoadSpinner from "@/lib/components/LoadSpinner.svelte";
</script>

<div transition:fly={{ y: -50 }} class="posting-spinner">
  <div class="spinner">
    <LoadSpinner />
  </div>
  <p>Posting</p>
</div>

<style lang="scss">
  .posting-spinner {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    z-index: 1000;
    background-color: var(--background);
    border: 1px solid var(--border);
    border-radius: 32px;
    padding-right: 16px;

    .spinner {
      scale: 0.5;
    }

    p {
      font-size: 14px;
      color: var(--text);
      margin: 0;
    }
  }
</style>
