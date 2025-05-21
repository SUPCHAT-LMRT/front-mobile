<script lang="ts">
	import { page } from '$app/state';

	const workspaceId: string = $derived(page.url.searchParams.get('workspaceId') || '');
</script>

{#if workspaceId}
	<div class="flex h-full w-full items-center justify-center">
		<p class="text-2xl font-bold">Workspace {workspaceId}</p>
	</div>
{/if}
