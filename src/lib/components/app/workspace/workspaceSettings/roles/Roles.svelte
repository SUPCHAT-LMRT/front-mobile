<script lang="ts">
	import {
		checkRolePermission,
		createWorkspaceRole,
		RolePermission,
		updateWorkspaceRole,
		type WorkspaceRole
	} from '$lib/api/workspace/roles';
	import type { Workspace } from '$lib/api/workspace/workspace';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import * as Tabs from '$lib/components/ui/tabs';
	import { notifyByLevel, success } from '$lib/toast/toast';
	import { AxiosError } from 'axios';
	import { AlertTriangle } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import RoleCreator from './RoleCreator.svelte';
	import RolesList from './RoleList.svelte';
	import RolePermissions from './RolePermissions.svelte';
	import { roleList } from './state.svelte';
	import WorkspaceMembers from './WorkspaceMembers.svelte';

	const { workspace }: { workspace: Workspace } = $props();

	let selectedRole: WorkspaceRole | null = $state(null);
	let showModal = $state(false);
	let error = writable('');
	let hasPermission = $derived.by(async () => {
		try {
			const { hasPermission } = await checkRolePermission(
				workspace.id,
				RolePermission.MANAGE_ROLES.permissionBit
			);
			return hasPermission;
		} catch (err) {
			console.error('Erreur lors de la vérification des permissions :', err);
			return false;
		}
	});
	let activeTab = $state('list');

	const handleSave = async () => {
		if (selectedRole) {
			try {
				await updateWorkspaceRole(
					workspace.id,
					selectedRole.id,
					selectedRole.name,
					selectedRole.permissions,
					selectedRole.color
				);
				success('Rôle mis à jour', 'Le rôle a été mis à jour avec succès.');
			} catch (e) {
				console.error(e);
				error.set('Erreur lors de la mise à jour du rôle.');
				if (e instanceof AxiosError) {
					if (e.response?.status === 403) {
						notifyByLevel({
							title: 'Erreur',
							level: 'error',
							message: 'Vous n\'avez pas la permission de modifier ce rôle."'
						});
					} else if (e.response?.status === 404) {
						notifyByLevel({
							title: 'Erreur',
							level: 'error',
							message: 'Rôle introuvable.'
						});
					} else {
						notifyByLevel({
							title: 'Erreur',
							level: 'error',
							message: 'Erreur inconnue lors de la mise à jour du rôle.'
						});
					}
				} else {
					notifyByLevel({
						title: 'Erreur',
						level: 'error',
						message: 'Erreur inconnue lors de la mise à jour du rôle.'
					});
				}
			}
		}
	};

	const handleRoleCreated = async (role: { name: string; color: string }) => {
		try {
			const createdRole = await createWorkspaceRole(workspace.id, role.name, role.color);
			success('Rôle créé', 'Le rôle a été créé avec succès.');

			roleList.roles = [...roleList.roles, createdRole];

			if (!selectedRole) {
				selectedRole = createdRole;
			}

			showModal = false;
		} catch (e) {
			console.error(e);
			error.set('Erreur lors de la création du rôle.');
			if (e instanceof AxiosError) {
				if (e.response?.status === 403) {
					notifyByLevel({
						title: 'Erreur',
						level: 'error',
						message: "Vous n'avez pas la permission de créer un rôle."
					});
				} else if (e.response?.status === 404) {
					notifyByLevel({
						title: 'Erreur',
						level: 'error',
						message: 'Espace de travail introuvable.'
					});
				} else {
					notifyByLevel({
						title: 'Erreur',
						level: 'error',
						message: 'Erreur inconnue lors de la création du rôle.'
					});
				}
			} else {
				notifyByLevel({
					title: 'Erreur',
					level: 'error',
					message: 'Erreur inconnue lors de la création du rôle.'
				});
			}
		}
	};
</script>

{#if !hasPermission}
	<div class="space-y-6">
		<div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
			<div class="flex">
				<AlertTriangle class="h-5 w-5 text-red-800 dark:text-red-500" />
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-500">Accès refusé</h3>
					<div class="mt-2 text-sm text-red-700 dark:text-red-400">
						<p>
							Vous n'avez pas les permissions nécessaires pour gérer les rôles de cet espace de
							travail.
							<br />
							Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="mb-5 space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Gestion des Rôles</h2>
			<Button class="text-white" onclick={handleSave}>Sauvegarder</Button>
		</div>

		<Card class="p-6">
			<Tabs.Root value={activeTab} onValueChange={(value) => (activeTab = value)}>
				<Tabs.List class="w-full">
					<Tabs.Trigger value="list">Liste des rôles</Tabs.Trigger>
					<Tabs.Trigger value="permissions">Permissions</Tabs.Trigger>
					<Tabs.Trigger value="create">Créer un rôle</Tabs.Trigger>
				</Tabs.List>

				<div class="mt-6">
					<Tabs.Content value="list">
						<div class="flex flex-col gap-6 sm:flex-row sm:gap-4">
							<div class="w-full sm:w-2/3">
								<RolesList bind:selectedRole {workspace} />
							</div>
							<div class="w-full sm:w-1/3">
								<WorkspaceMembers {workspace} />
							</div>
						</div>
					</Tabs.Content>

					<Tabs.Content value="permissions">
						{#if selectedRole}
							<RolePermissions bind:role={selectedRole} />
						{:else}
							<div class="text-muted-foreground py-8 text-center">
								Sélectionnez un rôle pour voir ses permissions
							</div>
						{/if}
					</Tabs.Content>

					<Tabs.Content value="create">
						<RoleCreator onRoleCreated={handleRoleCreated} />
					</Tabs.Content>
				</div>
			</Tabs.Root>
		</Card>
	</div>
{/if}

<Dialog open={showModal} onOpenChange={(open) => (showModal = open)}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Créer un nouveau rôle</DialogTitle>
		</DialogHeader>
		<RoleCreator onRoleCreated={handleRoleCreated} />
	</DialogContent>
</Dialog>
