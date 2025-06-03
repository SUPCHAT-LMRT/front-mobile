<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { changeUserStatus, PrivateStatus, PublicStatus } from '$lib/api/user';
	import { page } from '$app/state';
	import type { AuthenticatedUserState } from '../../../../routes/(auth)/authenticatedUser.svelte';
	import { buttonVariants } from "$lib/components/ui/button/index.js";
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


<div class="flex flex-col gap-1">
	<div class="pl-4">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={buttonVariants({ variant: "outline" })}
			>Changer de status</DropdownMenu.Trigger
			>	<DropdownMenu.Content
			class="min-w-[200px]"
		>
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>Status</DropdownMenu.GroupHeading>
				<DropdownMenu.Item
					class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => selectStatus(PrivateStatus.ONLINE)}
				>
					<span class="w-3 h-3 bg-green-500 rounded-full"></span>
					Connecté
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => selectStatus(PrivateStatus.AWAY)}
				>
					<span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
					Absent
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => selectStatus(PrivateStatus.DO_NOT_DISTURB)}
				>
					<span class="w-3 h-3 bg-red-500 rounded-full"></span>
					Ne pas déranger
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
					onclick={() => selectStatus(PrivateStatus.INVISIBLE)}
				>
					<span class="w-3 h-3 bg-gray-500 rounded-full"></span>
					Invisible
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>

	<div class="pl-4">
		<Button
			variant="outline"
			class="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
			onclick={() => {
				authenticatedUserState.user.status = PublicStatus.OFFLINE;
			}}
		>
			Déconnexion
		</Button>
	</div>
</div>