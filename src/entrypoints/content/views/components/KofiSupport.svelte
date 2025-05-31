<script lang="ts">
  import axios from "axios";

  let currentTotal = $state(20);

  onMount(async () => {
    try {
      const response = await axios.get(
        "https://supoaeymlxxwkgyoeuun.supabase.co/functions/v1/total-donations",
      );
      currentTotal = response.data.total;
    } catch (error) {
      console.error("Error fetching Ko-fi data:", error);
    }
  });
</script>

<div class="wrapper">
  <div class="goal">
    <span>
      <p>{Math.round((currentTotal / 500) * 100 * 10) / 10}%</p>
      <p>$500</p>
    </span>

    <div class="bar">
      <div
        class="progress-bar"
        style="width: {(currentTotal / 500) * 100}%"
      ></div>
    </div>
  </div>

  <a href="https://ko-fi.com/T6T162QBR" target="_blank"
    ><img
      height="36"
      style="border:0px;height:36px;"
      src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
      alt="Buy Me a Coffee at ko-fi.com"
    /></a
  >
  <div class="text">
    <h4 class="medium">Help Pat fund a new laptop!</h4>

    <p>
      I’m working from a desktop I can’t move, and I lose access to it on
      weekends. A laptop would help me keep building Offpage consistently,
      whether I’m at school, home, or anywhere in between.
    </p>

    <p>
      It would seriously boost my productivity and let me stay on track with
      both Offpage and school. If you’d like to support its development, please
      consider contributing!
    </p>

    <p>- <strong>Pat</strong>, developer & creator of Offpage</p>
  </div>
</div>

<style lang="scss">
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;

    padding-bottom: 32px;
  }

  .goal {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    span {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      align-items: center;
      gap: 4px;

      p {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .bar {
    width: 100%;
    height: 8px;
    background-color: var(--innie);
    border-radius: 4px;
    margin: 8px 0;

    .progress-bar {
      height: 100%;
      background-color: var(--primary);
      border-radius: 4px;
      transition: width 0.3s ease-in-out;
    }
    border-radius: 4px;
    transition: width 0.3s ease-in-out;
  }
</style>
