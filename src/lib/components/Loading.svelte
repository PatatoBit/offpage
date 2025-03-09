<script lang="ts">
import Bob from "@/assets/bobbing.gif";
</script>

<div class="center">
  <p>Thinking...</p>
  <img src={Bob} alt="Loading" />
</div>

<style lang="scss">
.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

img {
  width: 100px;
  height: 100px;
}
</style>
