<script lang="ts">
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { changeUserStatus, PrivateStatus } from '$lib/api/user';
	import { page } from '$app/state';
	import type { AuthenticatedUserState } from '../../../../routes/(auth)/authenticatedUser.svelte';
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from '$lib/utils';
	import { BellOff, LaptopMinimal, Mail, Smile, User, UserCheck, UserX } from 'lucide-svelte';
	import { Separator } from "$lib/components/ui/separator/index.js";


	const {authenticatedUserState} = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const selectStatus = (s: PrivateStatus) => {
		changeUserStatus(s).then(() => {
			authenticatedUserState.user.status = s;
		});
	};
</script>

<div class="flex flex-col gap-1 justify-start items-start">
	<div class="px-4 w-full">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "option" }), "text-gray-800 justify-start")}>
				<Smile />
				Quel est votre statut ?
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="min-w-[200px]">
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

	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">
		<Button variant="option" size="sm" class="text-gray-800 justify-start">
			<BellOff />
			Suspendre les notifications
		</Button>

		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start"
			onclick={() => selectStatus(authenticatedUserState.user.status === PrivateStatus.AWAY ? PrivateStatus.ONLINE : PrivateStatus.AWAY)}
		>
			{#if authenticatedUserState.user.status === PrivateStatus.AWAY}
				<UserCheck />
				Me signaler disponible
			{:else}
				<UserX />
				Me signaler absent(e)
			{/if}
		</Button>
	</div>

	<Separator class="my-4" />
	<p class="text-gray-500 px-2">Admin</p>
	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">
		<Button variant="option">
			<User />
			Gestion des utilisateurs
		</Button>

		<Button variant="option">
			<LaptopMinimal />
			Gestion des postes
		</Button>

		<Button variant="option">
			<Mail />
			Gestion des invitations
		</Button>
	</div>
</div>