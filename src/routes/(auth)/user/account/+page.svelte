<script lang="ts">
    import {page} from "$app/state";
    import {requestResetPassword} from "$lib/api/user";
    import ProfileCard from "$lib/components/app/user/ProfileCard.svelte";
    import {Button} from "$lib/components/ui/button";
    import {error, success} from "$lib/toast/toast";
    import type {AuthenticatedUserState} from "../../authenticatedUser.svelte";

    const {authenticatedUserState} = page.data as {
        authenticatedUserState: AuthenticatedUserState;
    };
    const authenticatedUser = $derived(authenticatedUserState.user);

    const handlePasswordChange = async () => {
        try {
            await requestResetPassword();
            success(
                "Réinitialisation de mot de passe",
                "Un email de réinitialisation de mot de passe a été envoyé.",
            );
        } catch (e) {
            console.error(e);
            error(
                "Erreur",
                "Une erreur est survenue lors de la réinitialisation de mot de passe.",
            );
        }
    };
</script>

<section class="px-4 py-2 ml-2 pt-8 w-[500px]">
    <ProfileCard {authenticatedUser}/>

    <h2 class="text-gray-700 text-xs font-bold mt-7 uppercase">
        Changement de mot de passe
    </h2>
    <p class="text-gray-700 text-sm mt-3">
        Changer ton mot de passe signifie que tu ne pourras plus le récupérer.
    </p>
    <Button
            onclick={handlePasswordChange}
            class="bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors h-8 mt-3"
    >
        Changer le mot de passe
    </Button>

    <h2 class="text-gray-700 text-xs font-bold mt-7 uppercase">
        Suppression du compte
    </h2>
    <p class="text-gray-700 text-sm mt-3">
        Supprimer ton compte signifie que tu ne pourras plus le récupérer.
    </p>
    <Button
            class="bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors h-8 mt-3 mb-10"
    >
        Supprimer le compte
    </Button>
</section>
