import { getLoginUser, PrivateStatus, type User } from "$lib/api/user";
import ws from "$lib/api/ws";
import { goto } from "$lib/utils/goto";
import type { LayoutLoad } from "./$types";
import { authenticatedUserState, type AuthenticatedUserState } from "./authenticatedUser.svelte";

export const load: LayoutLoad = async (): Promise<{ authenticatedUserState: AuthenticatedUserState }> => {
	try {
		authenticatedUserState.user = await getLoginUser();
	} catch (error) {
		console.error("Erreur lors de la vérification de l'utilisateur :", error);
	}
	const state = authenticatedUserState as AuthenticatedUserState;

	if (!state.user) {
		goto("/login");
	}

	ws.subscribe(
		"self-status-updated",
		(msg: { status: PrivateStatus }) => {
			// Update the status of the authenticated user in the store
			(state.user as User).status = msg.status;
		},
	);

	ws.initWebSocket(); // Connect to the WebSocket server

	return {
		authenticatedUserState: state,
	};
};