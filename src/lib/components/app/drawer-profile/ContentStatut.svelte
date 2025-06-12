<script lang="ts">
	import { changeUserStatus, PrivateStatus } from '$lib/api/user';
	import { page } from '$app/state';
	import type { AuthenticatedUserState } from '../../../../routes/(auth)/authenticatedUser.svelte';
	import { Button } from "$lib/components/ui/button/index.js";


	const {authenticatedUserState} = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const selectStatus = (s: PrivateStatus) => {
		changeUserStatus(s).then(() => {
			authenticatedUserState.user.status = s;
		});
	};
</script>

<div class="space-y-6 px-2">
	<div class="flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-700">Gestion des invitations</h2>
	</div>

	<Button
		variant="option" size="sm" class="text-gray-800 justify-start"
		onclick={() => selectStatus(PrivateStatus.ONLINE)}
	>
		<span class="w-3 h-3 bg-green-500 rounded-full"></span>
		Connecté
	</Button>
	<Button
		variant="option" size="sm" class="text-gray-800 justify-start"
		onclick={() => selectStatus(PrivateStatus.AWAY)}
	>
		<span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
		Absent
	</Button>
	<Button
		variant="option" size="sm" class="text-gray-800 justify-start"
		onclick={() => selectStatus(PrivateStatus.DO_NOT_DISTURB)}
	>
		<span class="w-3 h-3 bg-red-500 rounded-full"></span>
		Ne pas déranger
	</Button>
	<Button
		variant="option" size="sm" class="text-gray-800 justify-start"
		onclick={() => selectStatus(PrivateStatus.INVISIBLE)}
	>
		<span class="w-3 h-3 bg-gray-500 rounded-full"></span>
		Invisible
	</Button>
</div>