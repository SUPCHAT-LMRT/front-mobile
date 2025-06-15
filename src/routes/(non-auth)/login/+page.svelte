<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { error, success } from '$lib/toast/toast';
	import { Moon, Sun } from 'lucide-svelte';
	import { toggleMode } from 'mode-watcher';
	import { tick } from 'svelte';
	import UserAuthForm from './(components)/user-auth-form.svelte';
	import { Dialog, DialogContent, DialogTitle } from '$lib/components/ui/dialog';
	import { goto } from '$app/navigation';

	let showInviteModal =$state(false);
	let token = $state('');

	const openInviteModal = () => {
		token = '';
		showInviteModal = true;
	};

	const confirmInvite = () => {
		goto('/register?token=' + token);
	}

	$effect(() => {
		const notifyError = async () => {
			await tick();
			if (page.url.searchParams.get('error')) {
				const errorMsg = page.url.searchParams.get('error');
				if (errorMsg) {
					error('Une erreur est survenue lors de la connexion.', errorMsg);
					const url = new URL(window.location.href);
					url.searchParams.delete('error');
					window.history.replaceState({}, document.title, url.toString());
				}
			}
		};

		const notifySuccess = async () => {
			await tick();
			if (page.url.searchParams.get('success')) {
				const successMsg = page.url.searchParams.get('success');
				if (successMsg) {
					success('Compte créé avec succès', successMsg);
					const url = new URL(window.location.href);
					url.searchParams.delete('success');
					window.history.replaceState({}, document.title, url.toString());
				}
			}
		};

		notifyError();
		notifySuccess();
	});
</script>

<div class="container flex flex-col min-h-screen items-center justify-center z-10">
	<div class="px-12">
		<div class="mx-auto flex w-full flex-col justifier-center space-y-6 sm:w-[350px]">
			<div class="flex flex-col space-y-2 text-center pb-12">
				<h1 class="text-2xl font-semibold tracking-tight">Se connecter</h1>
			</div>
			<UserAuthForm />
			<Button onclick={openInviteModal} variant="outline" size="default" class="w-full">
				J'ai une invitation
			</Button>
			<p class="text-muted-foreground px-8 text-center text-xs">
				En cliquant sur continuer, vous acceptez nos
				<a href="/cgus" class="hover:text-primary underline underline-offset-4">Conditions d&#39;utilisation</a>.
			</p>
		</div>
	</div>

	<Button onclick={toggleMode} variant="outline" size="icon" class="absolute bottom-4 right-4">
		<Sun class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
		<Moon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		<span class="sr-only">Toggle theme</span>
	</Button>

	<Dialog bind:open={showInviteModal}>
		<DialogContent class="bg-white dark:bg-gray-800 p-6 rounded shadow-md w-80">
			<DialogTitle class="text-lg font-medium mb-4">Entrez votre token</DialogTitle>
			<input
				type="text"
				class="border p-2 w-full mb-4 rounded"
				bind:value={token}
				placeholder="Token"
			/>
			<div class="flex justify-end space-x-2">
				<Button class="outline" size="default" onclick={() => (showInviteModal = false)}>
					Annuler
				</Button>
				<Button onclick={confirmInvite} class="primary" size="default">
					Confirmer
				</Button>
			</div>
		</DialogContent>
	</Dialog>
</div>
