import { goto } from "$app/navigation";
import { logout } from "$lib/api/user";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
	await logout();
	goto("/login");
}