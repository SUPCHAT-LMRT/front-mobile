<script lang="ts">
	import { createWorkspaceInviteLink } from '$lib/api/workspace/workspace';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { success } from '$lib/toast/toast';
	import { AxiosError } from 'axios';
	import { ClipboardCopy } from 'lucide-svelte';
	import { writable } from 'svelte/store';

	const { workspaceId } = $props();

	let inviteMemberData = writable({
		dialogOpen: false,
		email: ''
	});

	let inviteLink = writable('');
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
			error.set("Erreur lors de la création du lien d'invitation.");
			if (e instanceof AxiosError) {
				if (e.response?.status === 403) {
					error.set("Vous n'avez pas la permission de créer un lien d'invitation.");
				} else if (e.response?.status === 404) {
					error.set('Espace de travail introuvable.');
				} else {
					error.set("Erreur inconnue lors de la création du lien d'invitation.");
				}
			} else {
				error.set("Erreur inconnue lors de la création du lien d'invitation.");
			}
		} finally {
			loading.set(false);
		}
	};

	const copyInviteLink = () => {
		navigator.clipboard
			.writeText($inviteLink)
			.then(() => {
				success('Lien copié', "Le lien d'invitation a été copié dans le presse-papiers.");
			})
			.catch((err) => console.error('Erreur lors de la copie :', err));
	};

	function shortenLink(link: string): string {
		const maxLength = 40;
		return link.length > maxLength ? link.slice(0, 40) + '...' + link.slice(-5) : link;
	}
</script>

<Dialog.Root bind:open={$inviteMemberData.dialogOpen} onOpenChange={fetchInviteLink}>
	<Dialog.Trigger class="mx-auto">Inviter</Dialog.Trigger>
	<Dialog.Content
		class="mx-auto w-[95vw] rounded-2xl bg-white p-4 shadow-xl sm:max-w-md sm:p-6 dark:bg-gray-800"
	>
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
			<p class="mt-3 text-xs text-red-500 sm:mt-4 sm:text-sm">{$error}</p>
		{:else}
			<div class="mt-3 flex flex-col gap-3 sm:mt-4">
				<div
					class="flex items-center justify-between gap-2 rounded-md border bg-gray-100 p-2 sm:p-3 dark:bg-gray-700"
				>
					<span class="flex-1 truncate text-xs sm:text-sm dark:text-gray-300"
						>{shortenLink($inviteLink)}</span
					>
					<div class="flex items-center">
						<Button
							onclick={copyInviteLink}
							class="touch-manipulation rounded-md bg-[#61A0AF] p-1.5 text-white hover:bg-[#4B7986] sm:p-2"
							aria-label="Copier le lien"
						>
							<ClipboardCopy size={14} class="sm:h-4 sm:w-4" />
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
