import type { User } from "$lib/api/user";

export type AuthenticatedUserState = {
	user: User | null;
}

export const authenticatedUserState: { user: null } = $state({ user: null });