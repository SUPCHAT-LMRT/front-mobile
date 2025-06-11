<script lang="ts">
	import { onMount } from 'svelte';
	import { getUserProfile, PublicStatus } from '$lib/api/user';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters.js';
	import { cn } from '$lib/utils';
	import ws from '$lib/api/ws';
	import { StoreResultState, type StoreResult } from '$lib/stores/store.svelte';
	import recentChatsStore from '$lib/stores/recentChatsStore';
	import { RecentChatKind, type RecentChats as RecentChantStore } from '$lib/api/recentChats';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';

	let recentChats: StoreResult<any[]> = $state({
		state: StoreResultState.LOADING,
		data: []
	});

	const convertRecentChat = async (chat: RecentChantStore) => {
		if (chat.kind === RecentChatKind.DIRECT) {
			const userProfile = await getUserProfile(chat.id);
			return {
				...chat,
				userStatus: userProfile.status
			};
		}
		return chat;
	};

	onMount(async () => {
		try {
			const data = await recentChatsStore.fetch();
			recentChats.data = await Promise.all(
				data.recentChats.map(convertRecentChat)
			);
			recentChats.state = StoreResultState.LOADED;
		} catch (e) {
			console.error('Erreur lors du chargement des messages récents', e);
			recentChats.state = StoreResultState.ERROR;
		}
	});


	$effect(() =>
		ws.subscribe('user-status-updated', (msg: { userId: string; status: PublicStatus }) => {
			recentChats.data = recentChats.data.map((chat) =>
				chat.kind === RecentChatKind.DIRECT && chat.id === msg.userId
					? { ...chat, userStatus: msg.status }
					: chat
			);
		})
	);
</script>

<div class="p-4">
	<p class="text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-4">
		Messages privés
	</p>

	{#if recentChats.state === StoreResultState.LOADING}
		{#each Array(10) as _}
			<Skeleton class="h-screen w-full mb-3 rounded-xl" />
		{/each}
	{:else if recentChats.data.length > 0}
		{#each recentChats.data as chat (chat.id)}
			<a href={`/chat/${chat.kind.toLowerCase()}?chatId=${chat.id}`} class="block mb-3">
				<div
					class="flex items-center gap-4 p-4 rounded-2xl shadow-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
				>
					<div class="relative w-9 h-9 shrink-0">
						<Avatar.Root>
							<Avatar.Image
								src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, chat.id)}
								alt={chat.id}
								class="h-full w-full rounded-full object-cover"
							/>
							<Avatar.Fallback
								class="flex items-center justify-center h-full w-full rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-200"
							>
								{fallbackAvatarLetters(chat.name)}
							</Avatar.Fallback>
						</Avatar.Root>
						{#if chat.kind === RecentChatKind.DIRECT}
			<span
				class={cn(
					"absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800",
					{
						"bg-green-500": chat.userStatus === PublicStatus.ONLINE,
						"bg-yellow-500": chat.userStatus === PublicStatus.AWAY,
						"bg-red-500": chat.userStatus === PublicStatus.DO_NOT_DISTURB,
						"bg-gray-400": chat.userStatus === PublicStatus.OFFLINE,
					}
				)}
			/>
						{/if}
					</div>
					<div class="flex-1 overflow-hidden">
						<p class="text-base font-semibold text-gray-900 dark:text-white truncate">{chat.name}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400 truncate">
							LE DERNIER MESSAGE SI CEST POSSIBLE
						</p>
					</div>
				</div>
			</a>
		{/each}
	{:else if recentChats.state === StoreResultState.ERROR}
		<span class="text-red-500 text-md">Erreur lors du chargement</span>
	{:else}
		<span class="text-gray-500 text-md">Aucun chat récent</span>
	{/if}
</div>

