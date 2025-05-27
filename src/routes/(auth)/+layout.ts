import { getLoginUser } from "$lib/api/user";
import { goto } from "$lib/utils/goto";
import type { LayoutLoad } from "./$types";
import { authenticatedUserState, type AuthenticatedUserState } from "./authenticatedUser.svelte";

export const load: LayoutLoad = async (): Promise<{ authenticatedUserState: AuthenticatedUserState }> => {
	try {
		authenticatedUserState.user = await getLoginUser();
	} catch (error) {
		console.error("Erreur lors de la vérification de l'utilisateur :", error);
	}

	if (!authenticatedUserState.user) {
		goto("/login");
	}

	return {
		authenticatedUserState,
	};
};