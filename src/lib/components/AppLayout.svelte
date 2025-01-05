<script lang="ts">
  import { fly } from "svelte/transition";
  let showPopup = false;
</script>

<div class="left-hover">
  {#if showPopup}
    <main class="page" transition:fly={{ x: 100, duration: 300 }}>
      <button on:click={() => (showPopup = !showPopup)}>X</button>
      <slot />
    </main>
  {:else}
    <button
      transition:fly={{ x: 100, duration: 300 }}
      on:click={() => (showPopup = !showPopup)}
      style="position:absolute; top:50%; right:1rem; transform:translateY(-50%)"
      >Show</button
    >
  {/if}
</div>

<style lang="scss">
  @import "../styles/variables.scss";

  .page {
    width: 350px;
    height: 80vh;
    z-index: 100;

    background-color: var(--white);
    border: 2px solid red;

    gap: 1rem;

    button {
      cursor: pointer;
    }
  }

  .left-hover {
    position: fixed;
    top: 50%;
    right: 1rem;

    display: flex;

    transform: translateY(-50%);
  }
</style>
