<script lang="ts">
  import { fly } from "svelte/transition";
  import closeButton from "../../assets/icons/cross.svg";
  let showPopup = false;
</script>

<div class="left-hover">
  {#if showPopup}
    <div class="page" transition:fly={{ x: 100, duration: 300 }}>
      <button class="close-button" on:click={() => (showPopup = !showPopup)}>
        <img src={closeButton} alt="Close" />
      </button>
      <slot />
    </div>
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
  @use "../styles/variables.scss";
  @use "../styles/fonts.scss";

  .close-button {
    all: unset;

    position: absolute;
    top: 1rem;
    right: 1rem;
  }

  .page {
    width: 300px;
    height: 85vh;
    z-index: 100;
    padding: 0.5rem;

    border-radius: 0.8rem;
    background-color: var(--white);
    -webkit-box-shadow: 0px 10px 15px 0px rgba(207, 207, 207, 1);
    -moz-box-shadow: 0px 10px 15px 0px rgba(207, 207, 207, 1);
    box-shadow: 0px 10px 15px 0px rgba(207, 207, 207, 1);

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
