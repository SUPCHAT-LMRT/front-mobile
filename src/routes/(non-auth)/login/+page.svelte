<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { error, success } from "$lib/toast/toast";
	import { Moon, Sun } from "lucide-svelte";
	import { toggleMode } from "mode-watcher";
	import { tick } from "svelte";
	import UserAuthForm from "./(components)/user-auth-form.svelte";

	$effect(() => {
		const notifyError = async () => {
			await tick();
			if (page.url.searchParams.get("error")) {
				const errorMsg = page.url.searchParams.get("error");
				if (errorMsg) {
					// Display error message to the user
					error("Une erreur est survenue lors de la connexion.", errorMsg);
					// Clear the error message from the URL
					const url = new URL(window.location.href);
					url.searchParams.delete("error");
					window.history.replaceState({}, document.title, url.toString());
				}
			}
		};

		const notifySuccess = async () => {
			await tick();
			if (page.url.searchParams.get("success")) {
				const successMsg = page.url.searchParams.get("success");
				if (successMsg) {
					// Display success message to the user
					success("Compte créé avec succès", successMsg);
					// Clear the success message from the URL
					const url = new URL(window.location.href);
					url.searchParams.delete("success");
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
		<div
			class="mx-auto flex w-full flex-col justifier-center space-y-6 sm:w-[350px]"
		>
			<div class="flex flex-col space-y-2 text-center pb-12">
				<h1 class="text-2xl font-semibold tracking-tight">Se connecter</h1>
			</div>
			<UserAuthForm />
			<p class="text-muted-foreground px-8 text-center text-xs">
				En cliquant sur continuer, vous acceptez nos
				<a
					href="/terms"
					class="hover:text-primary underline underline-offset-4"
				>
					Conditions d'utilisation
				</a>
				et
				<a
					href="/privacy"
					class="hover:text-primary underline underline-offset-4"
				>
					Politique de confidentialité
				</a>
				.
			</p>
		</div>
	</div>

	<Button
		onclick={toggleMode}
		variant="outline"
		size="icon"
		class="absolute bottom-4 right-4"
	>
		<Sun
			class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
		/>
		<Moon
			class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
		/>
		<span class="sr-only">Toggle theme</span>
	</Button>
</div>
