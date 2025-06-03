<script lang="ts">
	import { PUBLIC_API_OAUTH_FACEBOOK_URL, PUBLIC_API_OAUTH_GOOGLE_URL } from '$env/static/public';
	import { loginUser } from '$lib/api/user';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { notifyByLevel, success } from '$lib/toast/toast';
	import { cn } from '$lib/utils.js';
	import { goto } from '$lib/utils/goto';
	import preventDefault from '$lib/utils/preventDefault';
	import { Loader } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let className: string | undefined | null = $state(undefined);
	export { className as class };

	let showEmailForm = $state(false);
	function handleShowEmail() {
		showEmailForm = true;
	}

	let isSubmitting = $state(false);
	let email = $state('');
	let password = $state('');
	let rememberMe = $state(false);

	async function onSubmit() {
		isSubmitting = true;
		try {
			const response = await loginUser(email, password, rememberMe);
			console.log('User logged in successfully:', response);
			success('Connexion réussie !', 'Vous êtes maintenant connecté.');
			goto('/');
		} catch (e) {
			console.error('Error logging in user:', JSON.stringify(e));
			const errorData = e.response?.data || {};
			const status = e.response?.status;

			let title = 'Erreur lors de la connexion';
			let level: 'warning' | 'error' = errorData.level || 'error';
			let message = errorData.messageDisplay || 'Une erreur est survenue';

			if (status === 400) {
				message = 'Requête invalide. Vérifiez vos identifiants et réessayez.';
			}

			notifyByLevel({ title, level, message });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class={cn('grid gap-6', className)}>
	<div class="flex flex-col gap-1">
		<Button
			class="w-full"
			variant="outline"
			href={PUBLIC_API_OAUTH_GOOGLE_URL}
			disabled={isSubmitting}
		>
			{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin" />{/if}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				x="0px"
				y="0px"
				width="30"
				height="30"
				viewBox="0 0 48 48"
			>
				<path
					fill="#fbc02d"
					d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12    s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20    s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
				></path><path
					fill="#e53935"
					d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039    l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
				></path><path
					fill="#4caf50"
					d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36    c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
				></path><path
					fill="#1565c0"
					d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571    c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
				></path>
			</svg>
			Google
		</Button>
		<Button
			class="w-full"
			variant="outline"
			href={PUBLIC_API_OAUTH_FACEBOOK_URL}
			disabled={isSubmitting}
		>
			{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin" />{/if}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				x="0px"
				y="0px"
				width="31"
				height="31"
				viewBox="0 0 48 48"
			>
				<path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path><path
					fill="#fff"
					d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"
				></path>
			</svg>
			Facebook
		</Button>
		<Button
			class="w-full"
			variant="outline"
			type="button"
			onclick={handleShowEmail}
			disabled={showEmailForm}
		>
			Continuer avec une adresse mail
		</Button>
	</div>

	<!-- Formulaire mail masqué tant que showEmailForm=false -->
	{#if showEmailForm}
		<form on:submit={preventDefault(onSubmit)} class="grid gap-6" transition:fade>
			<div class="grid gap-2">
				<Label class="sr-only" for="email">Email</Label>
				<Input
					id="email"
					placeholder="nom@example.com"
					type="email"
					autocapitalize="none"
					autocomplete="email"
					autocorrect="off"
					bind:value={email}
					disabled={isSubmitting}
				/>
				<Label class="sr-only" for="password">Mot de passe</Label>
				<Input
					id="password"
					placeholder="Mot de passe"
					type="password"
					bind:value={password}
					disabled={isSubmitting}
				/>
				<label class="flex items-center space-x-2">
					<input type="checkbox" bind:checked={rememberMe} disabled={isSubmitting} />
					<span>Se souvenir de moi</span>
				</label>
			</div>

			<Button class="bg-[#61A0AF] dark:text-white" type="submit" disabled={isSubmitting}>
				{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin" />{/if}
				Se connecter
			</Button>

			<div class="flex items-center justify-between">
				<Button
					href="/password-forget"
					variant="ghost"
					class="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Mot de passe oublié ?
				</Button>
			</div>
		</form>
	{/if}
</div>
