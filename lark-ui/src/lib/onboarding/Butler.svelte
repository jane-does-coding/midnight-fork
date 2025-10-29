<script lang="ts">
    const { variant = 1 }: { variant?: number } = $props();
</script>

<img src="/butler/{variant}.png" alt="Butler" />

<style>
  img {
    position: absolute;
    bottom: 0;
    right: 0;

    width: 100%;
    height: auto;
    display: block;
  }
</style>