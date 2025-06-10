<script lang="ts">
	import {
		deleteWorkspaceRole,
		getListWorkspaceRoles,
		type WorkspaceRole
	} from '$lib/api/workspace/roles';
	import type { Workspace } from '$lib/api/workspace/workspace';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { success } from '$lib/toast/toast';
	import { AxiosError } from 'axios';
	import { Trash2 } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { roleList } from './state.svelte';

	let {
		selectedRole = $bindable(),
		workspace
	}: { selectedRole: WorkspaceRole | null; workspace: Workspace } = $props();

	let loading = $state(true);
	let showDeleteConfirmation = $state(false);
	let roleToDelete = $state<string | null>(null);

	let error = writable('');

	const handleRoleSelect = (role: WorkspaceRole) => {
		selectedRole = role;
	};

	onMount(async () => {
		try {
			roleList.roles = await getListWorkspaceRoles(workspace.id);
			if (roleList.roles.length > 0) {
				selectedRole = roleList.roles[0];
			}
		} catch (e) {
			console.error(e);
			error.set('Erreur lors du chargement des rôles.');
			if (e instanceof AxiosError) {
				if (e.response?.status === 403) {
					error.set("Vous n'avez pas la permission de voir les rôles.");
				} else if (e.response?.status === 404) {
					error.set('Espace de travail introuvable.');
				} else {
					error.set('Erreur inconnue lors du chargement des rôles.');
				}
			} else {
				error.set('Erreur inconnue lors du chargement des rôles.');
			}
		} finally {
			loading = false;
		}
	});

	const handleDeleteRole = (roleId: string, event: Event) => {
		event.stopPropagation();
		roleToDelete = roleId;
		showDeleteConfirmation = true;
	};

	const confirmDeleteRole = async () => {
		if (!roleToDelete) return;

		try {
			await deleteWorkspaceRole(workspace.id, roleToDelete);
			success('Rôle supprimé', 'Le rôle a été supprimé avec succès.');
			// Mettre à jour la liste après suppression
			roleList.roles = roleList.roles.filter((role) => role.id !== roleToDelete);

			// Si le rôle supprimé était sélectionné, sélectionner un autre rôle
			if (selectedRole && selectedRole.id === roleToDelete) {
				selectedRole = roleList.roles.length > 0 ? roleList.roles[0] : null;
			}
		} catch (error) {
			console.error('Erreur lors de la suppression du rôle :', error);
		} finally {
			showDeleteConfirmation = false;
			roleToDelete = null;
		}
	};

	const cancelDeleteRole = () => {
		showDeleteConfirmation = false;
		roleToDelete = null;
	};
</script>

<ScrollArea class="pr-4">
	<div class="space-y-2">
		{#if loading}
			<p>Chargement des rôles...</p>
		{:else if roleList.roles.length === 0}
			<p>Aucun rôle disponible.</p>
		{:else}
			{#each roleList.roles as role}
				<button
					type="button"
					class="flex w-full cursor-pointer items-center justify-between rounded-md p-2 text-left transition
                                                    {selectedRole?.id === role.id
						? 'bg-accent'
						: 'hover:bg-accent/50'}"
					onclick={() => handleRoleSelect(role)}
				>
					<div class="flex items-center gap-2">
						<Badge
							style="background-color: {role.color}"
							class="max-w-[180px] truncate text-white"
							title={role.name}
						>
							{role.name}
						</Badge>
					</div>
					<div class="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							class="h-7 w-7"
							onclick={(event) => handleDeleteRole(role.id, event)}
						>
							<Trash2 class="h-4 w-4" />
						</Button>
					</div>
				</button>
			{/each}
		{/if}
	</div>
</ScrollArea>

<!-- Dialog de confirmation de suppression -->
<Dialog.Root open={showDeleteConfirmation} onOpenChange={(open) => (showDeleteConfirmation = open)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Confirmer la suppression</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end space-x-2 pt-4">
			<Button variant="outline" onclick={cancelDeleteRole}>Annuler</Button>
			<Button variant="destructive" onclick={confirmDeleteRole}>Supprimer</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
