<script lang="ts">
  import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";

  export let color: string;

  let open = false; // contrôle l'état du popover

  const presetColors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  ];

  const handleColorClick = (presetColor: string) => {
    color = presetColor;
    open = false; // ferme le popover
  };
</script>

<Popover bind:open={open}>
  <PopoverTrigger>
    <button class="h-8 w-8 rounded-md border" style="background-color: {color}" />
  </PopoverTrigger>
  <PopoverContent class="w-64">
    <div class="grid grid-cols-5 gap-2">
      {#each presetColors as presetColor}
        <button
                class="h-6 w-6 rounded-md border"
                style="background-color: {presetColor}"
                onclick={() => handleColorClick(presetColor)}
        />
      {/each}
    </div>
  </PopoverContent>
</Popover>
