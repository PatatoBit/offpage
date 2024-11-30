<script lang="ts">
  export let baseUrl: string;
  export let pagePath: string;
</script>

<div class="header page">
  <h3>{baseUrl}</h3>
  <h1>{pagePath}</h1>
</div>

<style lang="scss">
  .header {
    background-color: var(--primary);
    color: white;
  }

  h1 {
    font-size: 1.5em;
  }

  h3 {
    font-size: 1em;
  }
</style>
