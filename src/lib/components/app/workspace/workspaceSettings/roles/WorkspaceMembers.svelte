<script lang="ts">
	import {
		assignRoleToMember,
		dessasignRoleToMember,
		getRolesForMember
	} from '$lib/api/workspace/roles';
	import {
		getWorkspaceMembers,
		type Workspace,
		type WorkspaceMember
	} from '$lib/api/workspace/workspace';
	import * as Dialog from '$lib/components/ui/dialog';
	import { onMount } from 'svelte';

	const { workspace }: { workspace: Workspace } = $props();

	let members: WorkspaceMember[] = $state([]);
	let loading = $state(true);
	let isOpen = $state(false);
	let selectedMember: (WorkspaceMember & { roles?: any[] }) | null = $state(null);

	onMount(async () => {
		try {
			const data = await getWorkspaceMembers(workspace.id, 1, 100);
			members = data.members;
		} catch (error) {
			console.error('Erreur lors de la récupération des membres :', error);
		} finally {
			loading = false;
		}
	});

	function handleMemberClick(member: WorkspaceMember) {
		getRolesForMember(workspace.id, member.id)
			.then((roles) => {
				console.log('Rôles récupérés pour le membre :', roles);
				selectedMember = { ...member, roles }; // forcé réactif
				isOpen = true;
			})
			.catch((error) => {
				console.error('Erreur lors de la récupération des rôles :', error);
			});
	}

	async function handleAssignRole(roleId: string) {
		if (!selectedMember) return;

		try {
			await assignRoleToMember(workspace.id, selectedMember.id, roleId);

			selectedMember = {
				...selectedMember,
				roles: selectedMember.roles?.map((role) =>
					role.id === roleId ? { ...role, isAssigned: true } : role
				)
			};
		} catch (error) {
			console.error("Erreur lors de l'assignation du rôle :", error);
		}
	}

	async function handleDessasignRole(roleId: string) {
		if (!selectedMember) return;

		try {
			await dessasignRoleToMember(workspace.id, selectedMember.id, roleId);

			selectedMember = {
				...selectedMember,
				roles: selectedMember.roles?.map((role) =>
					role.id === roleId ? { ...role, isAssigned: false } : role
				)
			};
		} catch (error) {
			console.error('Erreur lors du retrait du rôle :', error);
		}
	}

	function handleOpenChange(open: boolean) {
		isOpen = open;
		if (!open) {
			selectedMember = null;
		}
	}
</script>

<div class="space-y-4">
	<h2 class="text-xl font-semibold">Membres du Workspace</h2>

	{#if loading}
		<p>Chargement des membres...</p>
	{:else if members.length === 0}
		<p>Aucun membre trouvé.</p>
	{:else}
		<ul>
			{#each members as member}
				<li class="border-b">
					<button
						class="m-1 flex w-full items-center justify-between rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
						onclick={() => handleMemberClick(member)}
					>
						<span>{member.pseudo}</span>
						<div>
							{#if member.roles}
								{#each member.roles as role}
									<span class="text-white">{role.name}</span>
								{/each}
							{/if}
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
	<Dialog.Overlay class="fixed inset-0 bg-black/30" />
	<Dialog.Content
		class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
	>
		<Dialog.Title class="text-xl font-semibold">Détails du Membre</Dialog.Title>
		{#if selectedMember?.roles}
			<div class="mt-4 space-y-4">
				<p><strong>Pseudo:</strong> {selectedMember.pseudo}</p>

				<div class="space-y-2">
					<h3 class="text-lg font-medium">Rôles disponibles</h3>
					<ul class="space-y-2">
						{#each selectedMember.roles as role}
							<li
								class="flex items-center justify-between rounded-md bg-gray-100 p-2 dark:bg-gray-700"
							>
								<div class="flex items-center space-x-2">
									<span class="h-3 w-3 rounded-full" style="background-color: {role.color};"></span>
									<span>{role.name}</span>
								</div>
								<button
									onclick={() =>
										role.isAssigned ? handleDessasignRole(role.id) : handleAssignRole(role.id)}
									class="rounded-md px-3 py-1 text-sm
                                        {role.isAssigned
										? 'bg-red-600 text-white hover:bg-red-700'
										: 'bg-primary text-white hover:bg-[#4B7986]'}"
								>
									{role.isAssigned ? 'Désassigner' : 'Assigner'}
								</button>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
