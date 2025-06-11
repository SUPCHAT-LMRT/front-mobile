<script lang="ts">
	import { checkRolePermission, RolePermission } from '$lib/api/workspace/roles';
	import {
		updateWorkspace,
		updateWorkspaceIcon,
		type Workspace
	} from '$lib/api/workspace/workspace';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { notifyByLevel, success } from '$lib/toast/toast';
	import { AlertTriangle } from 'lucide-svelte';

	const { workspace }: { workspace: Workspace } = $props();

	let workspaceName = $derived(workspace.name);
	let workspaceTopic = $derived(workspace.topic);
	let workspaceIcon: File | null = null;
	// eslint-disable-next-line svelte/valid-compile
	let iconPreview: string | null = $state(null);
	let hasPermission = $derived.by(async () => {
		if (!workspace) return false;
		try {
			const { hasPermission: canManageSettings } = await checkRolePermission(
				workspace.id,
				RolePermission.MANAGE_WORKSPACE_SETTINGS.permissionBit
			);
			return canManageSettings;
		} catch (err) {
			console.error('Erreur lors de la vérification des permissions :', err);
			return false;
		}
	});

	const handleSave = async () => {
		try {
			await updateWorkspace(workspace.id, workspaceName, workspaceTopic);
			success('Succès', 'Le workspace a été mis à jour avec succès.');
		} catch (err) {
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: 'Une erreur est survenue lors de la mise à jour du workspace.'
			});
			console.error('Error updating workspace:', err);
		}
	};

	const handleIconUpload = async () => {
		if (!workspaceIcon) {
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: 'Veuillez sélectionner une icône à télécharger.'
			});
			return;
		}

		try {
			await updateWorkspaceIcon(workspace.id, workspaceIcon);
			success('Succès', "L'icône du workspace a été mise à jour avec succès.");
		} catch (err) {
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: "Une erreur est survenue lors de la mise à jour de l'icône."
			});
			console.error('Error updating workspace icon:', err);
		}
	};

	const handleFileChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			workspaceIcon = target.files[0];
			iconPreview = URL.createObjectURL(workspaceIcon);
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
							Vous n'avez pas les permissions nécessaires pour modifier les paramètres de cet espace
							de travail.
							<br />
							Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold">Informations de l'espace de travail</h2>
			<Button class="text-white" onclick={handleSave}>Sauvegarder</Button>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Informations de l'espace de travail</CardTitle>
				<CardDescription>Définissez le nom et le sujet de votre espace de travail</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<Label for="name">Nom de l'espace de travail</Label>
					<Input id="name" bind:value={workspaceName} />
				</div>
				<div class="space-y-2">
					<Label for="topic">Sujet</Label>
					<Textarea
						id="topic"
						placeholder="Décrivez le sujet principal de ce workspace..."
						bind:value={workspaceTopic}
						class="min-h-[100px]"
					/>
				</div>
				<div class="space-y-4">
					<Label for="icon">Icône de l'espace de travail</Label>
					<Input id="icon" type="file" accept="image/*" onchange={handleFileChange} />
					{#if iconPreview}
						<img src={iconPreview} alt="Aperçu de l'icône" class="mt-2 h-16 w-16 rounded-full" />
					{/if}
					<Button class="mt-2 text-white" onclick={handleIconUpload}>Mettre à jour l'icône</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
