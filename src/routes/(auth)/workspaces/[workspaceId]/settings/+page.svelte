<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
	import DrawerGeneral from '$lib/components/app/workspace/workspaceSettings/general/DrawerGeneral.svelte';
	import DrawerConfidentiality
		from '$lib/components/app/workspace/workspaceSettings/confidentiality/DrawerConfidentiality.svelte';
	import DrawerRoles from '$lib/components/app/workspace/workspaceSettings/roles/DrawerRoles.svelte';
	import DrawerMember from '$lib/components/app/workspace/workspaceSettings/member-management/DrawerMember.svelte';


	let currentWorkspaceId = $derived(page.params.workspaceId);

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

<section class="bg-background flex h-full w-full flex-col">
	<div class="pt-safe px-4 flex flex-col">
		<a
			href="/workspaces?workspaceId={currentWorkspaceId}"
			class="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
		>
			<ArrowLeft size={20} />
			<span>Retour</span>
		</a>

		<section>
			<div class="flex items-end mb-4">
				<h1 class="text-2xl font-bold text-gray-700 dark:text-gray-200">
					Paramètres
				</h1>
				<span class="mx-2 mb-1">-</span>
				<span class="text-gray-700 text-base font-semibold dark:text-gray-200"
				>{activeTab?.displayName}</span
				>
			</div>
		</section>

		<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<DrawerGeneral />
			<DrawerConfidentiality />
			<DrawerRoles />
			<DrawerMember />
		</section>

		<div class="flex mt-5 pb-safe w-full">
			<div class="w-full">
				{@render children?.()}
			</div>
		</div>
	</div>
</section>