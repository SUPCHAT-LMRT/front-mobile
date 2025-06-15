<script lang="ts">
	import { page } from '$app/state';
	import {
		PUBLIC_API_OAUTH_GITHUB_URL,
		PUBLIC_API_OAUTH_GOOGLE_URL
	} from '$env/static/public';
	import { getInviteLinkData, registerUser } from '$lib/api/user';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { error, notifyByLevel, success } from '$lib/toast/toast';
	import { goto } from '$lib/utils/goto';
	import { Loader } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let isSubmitting = $state(false);
	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let firstName = $state('');
	let lastName = $state('');

	const token = $derived(page.url.searchParams.get('token') || '');

	const passwordRegex =
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|\\:;"'<>,.\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|\\:;"'<>,.\/]{8,}$/;

	onMount(async () => {
		try {
			const inviteData = await getInviteLinkData(token);
			email = inviteData.email;
			firstName = inviteData.firstName;
			lastName = inviteData.lastName;
		} catch (error) {
			console.error('Error fetching invite link data:', error);
		}
	});

	async function onSubmit() {
		isSubmitting = true;

		if (!passwordRegex.test(password)) {
			error(
				'Mot de passe invalide',
				'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.'
			);
			isSubmitting = false;
			return;
		}

		try {
			const response = await registerUser(
				token,
				password,
				passwordConfirmation
			);
			console.log('User registered successfully:', response);
			goto('/login');
			success('Inscription réussie !', 'Votre compte a bien été créé.');
		} catch (error) {
			const errorData = error.response?.data || {};
			const title = 'Erreur lors de l\'inscription';
			const level: 'warning' | 'error' = errorData.level || 'error';
			const message = errorData.messageDisplay || 'Une erreur est survenue';
			notifyByLevel({ title, level, message });
		} finally {
			isSubmitting = false;
		}
	}
</script>

{#if token}
	<main class="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
		<div class="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md w-full max-w-md">
			<h1 class="text-3xl font-bold mb-6 text-center">Créer un compte</h1>
			<form on:submit|preventDefault={onSubmit}>
				<Input
					id="email"
					placeholder="Email"
					type="email"
					bind:value={email}
					disabled
					class="mb-4 w-full"
				/>

				<Input
					id="password"
					placeholder="Mot de passe"
					type="password"
					bind:value={password}
					class="mb-4 w-full"
					disabled={isSubmitting}
				/>

				<Input
					id="passwordConfirmation"
					placeholder="Confirmer le mot de passe"
					type="password"
					bind:value={passwordConfirmation}
					class="mb-4 w-full"
					disabled={isSubmitting}
				/>

				<Input
					id="firstName"
					placeholder="Prénom"
					type="text"
					bind:value={firstName}
					disabled
					class="mb-4 w-full"
				/>

				<Input
					id="lastName"
					placeholder="Nom"
					type="text"
					bind:value={lastName}
					disabled
					class="mb-4 w-full"
				/>

				<Button type="submit" class="w-full bg-[#61A0AF] dark:text-white" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					S'enregistrer
				</Button>
			</form>

			<div class="my-6 text-center text-sm text-muted-foreground">
				ou continuer avec
			</div>

			<div class="space-y-2">
				<Button
					class="w-full"
					href="{PUBLIC_API_OAUTH_GOOGLE_URL}?token={token}"
					variant="outline"
					type="button"
					disabled={isSubmitting}
				>
					Google
				</Button>

				<Button
					class="w-full"
					href="{PUBLIC_API_OAUTH_GITHUB_URL}?token={token}"
					variant="outline"
					type="button"
					disabled={isSubmitting}
				>
					GitHub
				</Button>
			</div>

			<div class="mt-6 text-center">
				<Button href="/login" variant="ghost">Déjà inscrit ? Se connecter</Button>
			</div>
		</div>
	</main>
{:else}
	<main class="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-center">
		<div class="bg-red-50 dark:bg-red-900 p-8 rounded-lg shadow-md">
			<p class="text-red-500 mb-4">Lien d'invitation invalide ou manquant.</p>
			<Button href="/login" variant="ghost">Se connecter</Button>
		</div>
	</main>
{/if}