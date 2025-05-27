<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {validateAccount} from "$lib/api/user";
    import {page} from "$app/state";
    import {error, success} from "$lib/toast/toast";
    import {goto} from "$lib/utils/goto";

    const token = $derived(page.url.searchParams.get("token") || "");

    async function handleValidation() {
        try {
            await validateAccount(token);
            success("Compte validé", "Votre compte a été validé avec succès. Vous pouvez maintenant vous connecter.");
            goto("/login");
        } catch(e) {
            console.error(e);
            error("Erreur", "Erreur lors de la validation de votre compte.");
        }
    }
</script>

{#if token}
    <div class="container flex min-h-screen items-center justify-center">
        <div class="pl-32">
            <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div class="flex flex-col space-y-2 text-center">
                    <h1 class="text-2xl font-semibold tracking-tight">Valider votre compte</h1>
                </div>
                <div class="flex justify-center">
                    <Button onclick={handleValidation}>Valider mon compte</Button>
                </div>
            </div>
        </div>
    </div>
{#else}
    <div class="container flex min-h-screen items-center justify-center">
        <div class="pl-32">
            <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div class="flex flex-col space-y-2 text-center">
                    <h1 class="text-2xl font-semibold tracking-tight">Erreur</h1>
                    <p>Le lien de validation est invalide ou a expiré.</p>
                </div>
            </div>
        </div>
    </div>
{/if}