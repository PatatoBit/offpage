<div>
  <span class="loader"></span>
</div>

<style lang="scss">
  .loader {
    border: 24px solid #fff;
    border-bottom-color: var(--primary);
    border-radius: 50%;
    display: inline-block;
    position: relative;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
