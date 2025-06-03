<script lang="ts">
	import { page } from '$app/state';
	import { getWorkspaceChannel } from '$lib/api/workspace/channels';
	import { type Channel, type Workspace } from '$lib/api/workspace/workspace';
	import { error } from '$lib/toast/toast';
	import { ChevronLeft } from '@lucide/svelte';
	import { currentWorkspaceState } from '../workspaces/currentWorkspace.svelte';

	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);
	let channelId: string = $derived(page.url.searchParams.get('channelId') || '');
	let channel: Channel | null = $state(null);

	$effect(() => {
		const fetchChannel = async () => {
			if (!workspace?.id || !channelId) return;
			try {
				channel = await getWorkspaceChannel(workspace.id, channelId);
			} catch (e) {
				console.error('Erreur lors de la récupération des salons du workspace:', e);
				error('Erreur', 'Impossible de récupérer les salons du workspace');
			}
		};

		fetchChannel();
	});
</script>

{#if channel && workspace}
	<div class="flex h-full w-full flex-col gap-y-4">
		<div class="flex items-center gap-x-4 bg-gray-100 p-4 dark:bg-gray-800">
			<a href="/workspaces?workspaceId={workspace.id}" class="flex">
				<ChevronLeft size={30} />
			</a>
			<div class="flex items-center gap-x-2">
				<span class="text-2xl font-semibold">#{channel.name}</span>
				<span class="text-muted-foreground text-md translate-y-[1px]">{channel.topic}</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.sentinel {
		height: 1px;
	}
</style>
