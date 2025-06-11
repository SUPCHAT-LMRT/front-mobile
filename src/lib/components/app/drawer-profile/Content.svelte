<script lang="ts">
	import { page } from '$app/state';
	import { changeUserStatus, logout, PrivateStatus } from '$lib/api/user';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { goto } from '$lib/utils/goto';
	import type { AuthenticatedUserState } from '../../../../routes/(auth)/authenticatedUser.svelte';

	const { authenticatedUserState } = page.data as {
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
			<DropdownMenu.Trigger class={buttonVariants({ variant: 'outline' })}
				>Changer de status</DropdownMenu.Trigger
			>
			<DropdownMenu.Content class="min-w-[200px]">
				<DropdownMenu.Group>
					<DropdownMenu.GroupHeading>Status</DropdownMenu.GroupHeading>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
						onclick={() => selectStatus(PrivateStatus.ONLINE)}
					>
						<span class="h-3 w-3 rounded-full bg-green-500"></span>
						Connecté
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
						onclick={() => selectStatus(PrivateStatus.AWAY)}
					>
						<span class="h-3 w-3 rounded-full bg-yellow-500"></span>
						Absent
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
						onclick={() => selectStatus(PrivateStatus.DO_NOT_DISTURB)}
					>
						<span class="h-3 w-3 rounded-full bg-red-500"></span>
						Ne pas déranger
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
						onclick={() => selectStatus(PrivateStatus.INVISIBLE)}
					>
						<span class="h-3 w-3 rounded-full bg-gray-500"></span>
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
				logout();
				goto('/login');
			}}
		>
			Déconnexion
		</Button>
	</div>
</div>
