<script lang="ts">

    import {ModeWatcher} from "mode-watcher";

    let { children } = $props();
</script>

<ModeWatcher />

<div class="relative bg-left min-h-screen">
    {#if children}
        <div class="relative z-10">
            {@render children?.()}
        </div>
    {/if}
</div>

<style lang="postcss">
    .bg-left {
        position: relative;
    }
    .bg-left::before {
        content: '';
        position: absolute;
        inset: 0;

        background-image:
          radial-gradient(circle at top right,    #96C9DC 0%, #61A0AF 20%, transparent 60%),
          radial-gradient(circle at 50% 140%,      #96C9DC 0%, #24586B 20%, transparent 60%);

        background-size: 300px 300px, 400px 400px;
        background-repeat: no-repeat;
        background-position: top right, bottom center;

        filter: blur(25px);

        z-index: -1;
    }
</style>
