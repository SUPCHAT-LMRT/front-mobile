<script lang="ts">
	import { RecentChatKind, type RecentChats as RecentChatStore } from '$lib/api/recentChats';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { getUserProfile, PublicStatus } from '$lib/api/user';
	import ws from '$lib/api/ws';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import recentChatsStore from '$lib/stores/recentChatsStore';
	import { StoreResultState, type StoreResult } from '$lib/stores/store.svelte';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters.js';
	import { goto } from '$lib/utils/goto';
	import { onMount } from 'svelte';

	let recentChats: StoreResult<any[]> = $state({
		state: StoreResultState.LOADING,
		data: []
	});

	const convertRecentChat = async (chat: RecentChatStore) => {
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
			recentChats.data = await Promise.all(data.recentChats.map(convertRecentChat));
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

	$effect(() =>
		ws.subscribe(
			'recent-direct-chat-added',
			async (msg: { otherUserId: string; chatName: string }) => {
				const recentChatStore = {
					id: msg.otherUserId,
					name: msg.chatName,
					avatarUrl: '',
					kind: RecentChatKind.DIRECT
				} as RecentChatStore;
				recentChatsStore.add(recentChatStore);

				recentChats.data = [await convertRecentChat(recentChatStore), ...recentChats.data];
			}
		)
	);

	$effect(() =>
		ws.subscribe('recent-group-chat-added', async (msg: { groupId: string; chatName: string }) => {
			const recentChatStore = {
				id: msg.groupId,
				name: msg.chatName,
				avatarUrl: '',
				kind: RecentChatKind.GROUP
			} as RecentChatStore;
			recentChatsStore.add(recentChatStore);

			recentChats.data = [await convertRecentChat(recentChatStore), ...recentChats.data];
		})
	);

	$effect(() => {
		return ws.subscribe('recent-group-chat-removed', async (msg: { groupId: string }) => {
			recentChatsStore.remove(msg.groupId);
			recentChats.data = recentChats.data.filter((chat) => chat.id !== msg.groupId);
			goto('/chat');
		});
	});
</script>

<div class="p-4">
	<p class="mb-4 text-xs font-bold text-gray-600 uppercase dark:text-gray-300">Messages privés</p>

	{#if recentChats.state === StoreResultState.LOADING}
		{#each Array(10) as _}
			<Skeleton class="mb-3 h-screen w-full rounded-xl" />
		{/each}
	{:else if recentChats.data.length > 0}
		{#each recentChats.data as chat (chat.id)}
			<a
				href={`/chat/${chat.kind.toLowerCase()}?${chat.kind === RecentChatKind.DIRECT ? 'chatId=' + chat.id : 'groupId=' + chat.id}`}
				class="mb-3 block"
			>
				<div
					class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md transition-all duration-200 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
				>
					<div class="relative h-9 w-9 shrink-0">
						<Avatar.Root>
							<Avatar.Image
								src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, chat.id)}
								alt={chat.id}
								class="h-full w-full rounded-full object-cover"
							/>
							<Avatar.Fallback
								class="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-200"
							>
								{fallbackAvatarLetters(chat.name)}
							</Avatar.Fallback>
						</Avatar.Root>
						{#if chat.kind === RecentChatKind.DIRECT}
							<span
								class={cn(
									'absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800',
									{
										'bg-green-500': chat.userStatus === PublicStatus.ONLINE,
										'bg-yellow-500': chat.userStatus === PublicStatus.AWAY,
										'bg-red-500': chat.userStatus === PublicStatus.DO_NOT_DISTURB,
										'bg-gray-400': chat.userStatus === PublicStatus.OFFLINE
									}
								)}
							/>
						{/if}
					</div>
					<div class="flex-1 overflow-hidden">
						<p class="truncate text-base font-semibold text-gray-900 dark:text-white">
							{chat.name}
						</p>
						<p class="truncate text-sm text-gray-500 dark:text-gray-400">
							{#if chat.lastMessage}
								{#if chat.lastMessage.authorId !== chat.id}
									<span class="font-semibold">{chat.lastMessage.authorName}:</span>
								{:else}
									<span class="font-semibold">Vous:</span>
								{/if}
								{chat.lastMessage.content}
							{:else}
								Aucun message
							{/if}
						</p>
					</div>
				</div>
			</a>
		{/each}
	{:else if recentChats.state === StoreResultState.ERROR}
		<span class="text-md text-red-500">Erreur lors du chargement</span>
	{:else}
		<span class="text-md text-gray-500">Aucun chat récent</span>
	{/if}
</div>
