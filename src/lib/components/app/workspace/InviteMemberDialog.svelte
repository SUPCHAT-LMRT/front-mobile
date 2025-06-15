<script lang="ts">
	import { createWorkspaceInviteLink } from '$lib/api/workspace/workspace';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { success } from '$lib/toast/toast';
	import { AxiosError } from 'axios';
	import { ClipboardCopy } from 'lucide-svelte';
	import { writable, derived } from 'svelte/store';

	const { workspaceId } = $props();

	let inviteMemberData = writable({
		dialogOpen: false,
		email: ''
	});

	let inviteLink = writable('');
	// Extrait le token du lien en récupérant le dernier segment du pathname
	const inviteToken = derived(inviteLink, ($inviteLink) => {
		try {
			const url = new URL($inviteLink);
			const segments = url.pathname.split('/');
			return segments.pop() || '';
		} catch (error) {
			return '';
		}
	});
	let loading = writable(false);
	let error = writable('');

	const fetchInviteLink = async () => {
		loading.set(true);
		error.set('');
		inviteLink.set('');

		try {
			const link = await createWorkspaceInviteLink(workspaceId);
			inviteLink.set(link);
		} catch (e) {
			console.error(e);
			error.set('Erreur lors de la création du lien d\'invitation.');
			if (e instanceof AxiosError) {
				if (e.response?.status === 403) {
					error.set('Vous n\'avez pas la permission de créer un lien d\'invitation.');
				} else if (e.response?.status === 404) {
					error.set('Espace de travail introuvable.');
				} else {
					error.set('Erreur inconnue lors de la création du lien d\'invitation.');
				}
			} else {
				error.set('Erreur inconnue lors de la création du lien d\'invitation.');
			}
		} finally {
			loading.set(false);
		}
	};

	const copyFullLink = () => {
		navigator.clipboard
			.writeText($inviteLink)
			.then(() => {
				success('Lien copié', 'Le lien d\'invitation complet a été copié dans le presse-papiers.');
			})
			.catch((err) => console.error('Erreur lors de la copie :', err));
	};

	const copyToken = () => {
		navigator.clipboard
			.writeText($inviteToken)
			.then(() => {
				success('Token copié', 'Le token de l\'invitation a été copié dans le presse-papiers.');
			})
			.catch((err) => console.error('Erreur lors de la copie :', err));
	};
</script>

<Dialog.Root bind:open={$inviteMemberData.dialogOpen} onOpenChange={fetchInviteLink}>
	<Dialog.Trigger class="mx-auto">Inviter</Dialog.Trigger>
	<Dialog.Content class="mx-auto w-[95vw] rounded-2xl bg-white p-4 shadow-xl sm:max-w-md sm:p-6 dark:bg-gray-800">
		<Dialog.Header class="flex flex-col items-center justify-center space-y-2 text-center">
			<Dialog.Title class="text-xl font-bold sm:text-2xl">Inviter un membre</Dialog.Title>
			<p class="text-center text-xs text-gray-700 sm:text-sm dark:text-gray-300">
				Ajoute un membre à ton espace de travail en lui envoyant une invitation.
			</p>
		</Dialog.Header>

		{#if $loading}
			<p class="mt-3 text-xs text-gray-600 sm:mt-4 sm:text-sm dark:text-gray-400">
				Chargement du lien...
			</p>
		{:else if $error}
		{:else}
		{/if}
		<div class="mt-3 flex flex-col gap-4 sm:mt-4">
			<div class="flex flex-col gap-1">
				<label class="text-xs dark:text-gray-300">Lien complet</label>
				<input
					type="text"
					class="border p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-xs"
					value={$inviteLink}
					readonly
				/>
				<Button onclick={copyFullLink}
								class="mt-1 touch-manipulation rounded-md bg-[#61A0AF] p-1 text-white hover:bg-[#4B7986]"
								aria-label="Copier le lien complet">
					<ClipboardCopy size={14} class="sm:h-4 sm:w-4" />
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				<label class="text-xs dark:text-gray-300">Token</label>
				<input
					type="text"
					class="border p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-xs"
					value={$inviteToken}
					readonly
				/>
				<Button onclick={copyToken}
								class="mt-1 touch-manipulation rounded-md bg-[#61A0AF] p-1 text-white hover:bg-[#4B7986]"
								aria-label="Copier le token">
					<ClipboardCopy size={14} class="sm:h-4 sm:w-4" />
				</Button>
			</div>
		</div>
		<p class="mt-3 text-xs text-red-500 sm:mt-4 sm:text-sm">{$error}</p>
	</Dialog.Content>
</Dialog.Root>