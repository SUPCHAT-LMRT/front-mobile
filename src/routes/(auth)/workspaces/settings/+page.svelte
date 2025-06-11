<script lang="ts">
	import type { Workspace } from '$lib/api/workspace/workspace';
	import DrawerConfidentiality from '$lib/components/app/workspace/workspaceSettings/confidentiality/DrawerConfidentiality.svelte';
	import DrawerGeneral from '$lib/components/app/workspace/workspaceSettings/general/DrawerGeneral.svelte';
	import DrawerMember from '$lib/components/app/workspace/workspaceSettings/member-management/DrawerMember.svelte';
	import DrawerRoles from '$lib/components/app/workspace/workspaceSettings/roles/DrawerRoles.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { currentWorkspaceState } from '../currentWorkspace.svelte';

	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);

	type Tab = {
		displayName: string;
		label: string;
	};

	let activeTab: Tab | null = $state({
		displayName: 'Général',
		label: 'general'
	});

	let { children } = $props();
</script>

{#if workspace}
	<section class="bg-background flex h-full w-full flex-col">
		<div class="pt-safe flex flex-col px-4">
			<a
				href="/workspaces?workspaceId={workspace.id}"
				class="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
			>
				<ArrowLeft size={20} />
				<span>Retour</span>
			</a>

			<section>
				<div class="mb-4 flex items-end">
					<h1 class="text-2xl font-bold text-gray-700 dark:text-gray-200">Paramètres</h1>
					<span class="mx-2 mb-1">-</span>
					<span class="text-base font-semibold text-gray-700 dark:text-gray-200"
						>{activeTab?.displayName}</span
					>
				</div>
			</section>

			<section class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<DrawerGeneral {workspace} />
				<DrawerConfidentiality {workspace} />
				<DrawerRoles {workspace} />
				<DrawerMember {workspace} />
			</section>

			<div class="pb-safe mt-5 flex w-full">
				<div class="w-full">
					{@render children?.()}
				</div>
			</div>
		</div>
	</section>
{/if}
