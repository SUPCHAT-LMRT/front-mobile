<script lang="ts">
	import {
		PUBLIC_API_OAUTH_FACEBOOK_URL,
		PUBLIC_API_OAUTH_GOOGLE_URL,
	} from "$env/static/public";
	import { loginUser } from "$lib/api/user";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { notifyByLevel, success } from "$lib/toast/toast";
	import { cn } from "$lib/utils.js";
	import { goto } from "$lib/utils/goto";
	import preventDefault from "$lib/utils/preventDefault";
	import { Loader } from "lucide-svelte";

	let className: string | undefined | null = undefined;
	export { className as class };

	// --- NOUVEAU ---
	let showEmailForm = $state(false);
	function handleShowEmail() {
		showEmailForm = true;
	}

	let isSubmitting = $state(false);
	let email = $state("");
	let password = $state("");
	let rememberMe = $state(false);

	async function onSubmit() {
		isSubmitting = true;
		try {
			const response = await loginUser(email, password, rememberMe);
			console.log("User logged in successfully:", response);
			success("Connexion réussie !", "Vous êtes maintenant connecté.");
			goto("/");
		} catch (error) {
			console.error("Error logging in user:", error);
			const errorData = error.response?.data || {};
			const status = error.response?.status;

			let title = "Erreur lors de la connexion";
			let level: "warning" | "error" = errorData.level || "error";
			let message = errorData.messageDisplay || "Une erreur est survenue";

			if (status === 400) {
				message = "Requête invalide. Vérifiez vos identifiants et réessayez.";
			}

			notifyByLevel({ title, level, message });
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class={cn("grid gap-6", className)}>
	<!-- Boutons OAuth toujours visibles -->
	<div class="flex flex-col gap-1">
		<Button class="w-full" variant="outline" href={PUBLIC_API_OAUTH_GOOGLE_URL} disabled={isSubmitting}>
			{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin"/>{/if}
			Google
		</Button>
		<Button class="w-full" variant="outline" href={PUBLIC_API_OAUTH_FACEBOOK_URL} disabled={isSubmitting}>
			{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin"/>{/if}
			Facebook
		</Button>
		<!-- Bouton pour révéler le formulaire -->
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
		<form on:submit={preventDefault(onSubmit)} class="grid gap-6">
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
					<input type="checkbox" bind:checked={rememberMe} disabled={isSubmitting}/>
					<span>Se souvenir de moi</span>
				</label>
			</div>

			<Button class="bg-[#61A0AF] dark:text-white" type="submit" disabled={isSubmitting}>
				{#if isSubmitting}<Loader class="mr-2 h-4 w-4 animate-spin"/>{/if}
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
