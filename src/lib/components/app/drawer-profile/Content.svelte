<script lang="ts">
	import { changeUserStatus, PrivateStatus } from '$lib/api/user';
	import { page } from '$app/state';
	import type { AuthenticatedUserState } from '../../../../routes/(auth)/authenticatedUser.svelte';
	import { Button } from "$lib/components/ui/button/index.js";
	import { BellOff, LaptopMinimal, Mail, Smile, User, UserCheck, UserX } from 'lucide-svelte';
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import ContentUserAdmin from '$lib/components/app/drawer-admin/user/ContentUserAdmin.svelte';
	import ContentPostesAdmin from '$lib/components/app/drawer-admin/postes/ContentPostesAdmin.svelte';
	import ContentInvitationsAdmin from '$lib/components/app/drawer-admin/invitations/ContentInvitationsAdmin.svelte';
	import ContentStatut from '$lib/components/app/drawer-profile/ContentStatut.svelte';
	import ContentAuthentification from '$lib/components/app/drawer-profile/ContentAuthentification.svelte';
	import ContentNotification from '$lib/components/app/drawer-profile/ContentNotification.svelte';



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
		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option" size="sm" class="text-gray-800 justify-start dark:text-gray-200">
					<Smile />
					Quel est votre statut ?
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
				>
					<ContentStatut />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>

	</div>

	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">
		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option" size="sm" class="text-gray-800 justify-start dark:text-gray-200">
					<BellOff />
					Suspendre les notifications
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
				>
					<ContentNotification />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>
	</div>

	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">
		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start dark:text-gray-200"
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

	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">
		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option" size="sm" class="text-gray-800 justify-start dark:text-gray-200">
					<User />
					Authentification
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
				>
					<ContentAuthentification />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>
	</div>

	<Separator class="my-4" />
	<p class="text-gray-500 px-2">Admin</p>
	<div class="px-4 flex flex-col gap-2 justify-start items-start w-full">

		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option">
					<User />
					Gestion des utilisateurs
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
				>
					<ContentUserAdmin />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>


		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option">
					<LaptopMinimal />
					Gestion des postes
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="flex flex-col fixed bottom-0 left-0 right-0 max-h-[96%] rounded-t-[10px] overflow-hidden"
				>
					<div class="max-w-md w-full mx-auto flex flex-col overflow-auto p-4 rounded-t-[10px]">
						<ContentPostesAdmin />
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>


		<Drawer.NestedRoot setBackgroundColorOnScale={false}>
			<Drawer.Trigger>
				<Button variant="option">
					<Mail />
					Gestion des invitations
				</Button>
			</Drawer.Trigger>
			<Drawer.Portal>
				<Drawer.Overlay class="fixed inset-0 bg-black/40" />
				<Drawer.Content
					class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
				>
					<ContentInvitationsAdmin />
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.NestedRoot>
	</div>
</div>