import type { User } from "$lib/api/user";

export type AuthenticatedUserState = {
	user: User;
}

export let authenticatedUserState: { user: User | null } = $state({ user: null });
