<script lang="ts">
  import { Timestamp } from "firebase/firestore";
  import moment from "moment";

  export let sender: string;
  export let text: string;
  export let timestamp: Timestamp;
  export let upvotes: number;
</script>

<div>
  <div>
    {#if sender}
      <small>@sender</small>
    {/if}

    {#if timestamp}
      <small>{moment(timestamp.toDate()).fromNow()}</small>
    {/if}
  </div>

  <p>{text}</p>

  <small>{upvotes}</small>
</div>

<style lang="scss">
  div {
    border-radius: 5px;
  }

  small {
    color: #666;
    margin-right: 10px;
  }
</style>
