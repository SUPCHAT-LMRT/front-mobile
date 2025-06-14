<script lang="ts">
	import { page } from '$app/state';
	import { smartFly } from '$lib/animation/visibleFly.js';
	import { type DirectMessage, getDirectMessages } from '$lib/api/direct/message.js';
	import { RoomKind } from '$lib/api/room';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { getUserProfile, PublicStatus, type UserProfile } from '$lib/api/user';
	import ws from '$lib/api/ws';
	import '$lib/assets/styles/chats.scss';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import { error } from '$lib/toast/toast.js';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters.js';
	import { formatDate } from '$lib/utils/formatDate';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';
	import NumberFlow from '@number-flow/svelte';
	import { ChevronLeft, Languages, Pen, Send, Trash2 } from 'lucide-svelte';
	import { onDestroy, tick } from 'svelte';
	import type { AuthenticatedUserState } from '../../authenticatedUser.svelte.js';

	type CustomDirectMessage = DirectMessage & {
		editMode?: boolean;
		editInputElement?: HTMLDivElement | null;
	};

	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const authenticatedUser = $derived(authenticatedUserState.user);

	const aroundMessageId = $derived(page.url.searchParams.get('aroundMessageId') ?? undefined);

	// the chatId is the userId of the other user
	let currentChatId: string = $derived(page.url.searchParams.get('chatId') || '');
	let otherUserProfile: UserProfile | null = $state(null);
	let currentMessage = $state('');
	let currentRoom: { id: string | null; messages: CustomDirectMessage[] } = $state({
		id: null,
		messages: []
	});

	let deleteMessageDialog: {
		open: boolean;
		message: CustomDirectMessage | null;
	} = $state({
		open: false,
		message: null
	});

	let unsubscribeSendMessage: (() => void) | null = null;
	let unsubscribeMessageReactionAdded: (() => void) | null = null;
	let unsubscribeMessageReactionRemoved: (() => void) | null = null;
	let unsubscribeUserStatusUpdated: (() => void) | null = null;
	let unsubscribeGroupMessageContentEdited: (() => void) | null = null;
	let unsubscribeGroupMessageDeleted: (() => void) | null = null;
	let inputElement: HTMLDivElement | null = $state(null);
	let elementsList: HTMLDivElement | null = $state(null);
	let isAutoScrolling = $state(false);

	// Ces deux références DOM serviront de sentinelles
	let topSentinel: HTMLDivElement | null = $state(null);
	let bottomSentinel: HTMLDivElement | null = $state(null);

	// Observers pour le haut et le bas
	let topObserver: IntersectionObserver | null = $state(null);
	let bottomObserver: IntersectionObserver | null = $state(null);

	const LIMIT_LOAD = 50;
	const MAX_MESSAGES = 75;

	$effect(() => {
		joinRoomAndListenMessages(currentChatId);
		getUserProfile(currentChatId).then((userProfile) => (otherUserProfile = userProfile));

		return () => {
			unsubscribeSendMessage?.();
			unsubscribeMessageReactionAdded?.();
			unsubscribeMessageReactionRemoved?.();
			unsubscribeUserStatusUpdated?.();
			unsubscribeGroupMessageContentEdited?.();
			unsubscribeGroupMessageDeleted?.();
			ws.leaveRoom(currentRoom.id!);
			currentRoom.id = null;
			currentRoom.messages = [];
		};
	});

	const joinRoomAndListenMessages = async (otherUserId: string) => {
		try {
			currentRoom.messages = await getDirectMessages(otherUserId, {
				limit: LIMIT_LOAD,
				aroundMessageId
			});
			currentRoom.messages = currentRoom.messages.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
			);
			const joinedRoom = await ws.asyncDirectJoinRoom(otherUserId, RoomKind.DIRECT);
			currentRoom.id = joinedRoom.roomId;

			await tick();
			if (aroundMessageId) {
				const aroundMessageElement = document.querySelector(
					"[data-message-id='" + aroundMessageId + "']"
				);
				if (aroundMessageElement) {
					aroundMessageElement.scrollIntoView({ block: 'center' });
				}
			} else {
				await scrollToBottom(elementsList, 'auto');
			}

			topObserver = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							// Quand la sentinelle du haut est visible, on charge les messages précédents
							loadPreviousMessages();
						}
					});
				},
				{ root: null, threshold: 0.1 }
			);

			bottomObserver = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting && !isAutoScrolling) {
							// Quand la sentinelle du bas est visible, on charge les messages suivants
							loadNextMessages();
						}
					});
				},
				{ root: null, threshold: 0.1 }
			);

			if (topSentinel) {
				topObserver.observe(topSentinel);
			}
			if (bottomSentinel) {
				bottomObserver.observe(bottomSentinel);
			}

			unsubscribeSendMessage = ws.subscribe('send-direct-message', async (msg) => {
				currentRoom.messages.push({
					id: msg.messageId,
					content: msg.content,
					author: {
						userId: msg.sender.userId,
						firstName: msg.sender.firstName,
						lastName: msg.sender.lastName
					},
					createdAt: new Date(msg.createdAt),
					reactions: []
				});

				await tick();
				await scrollToBottomSafe(elementsList);
			});

			// Added is triggered when a user adds a reaction to a message,
			// If the reaction already exists, just update the usernames array with the new user, else add the reaction to the message
			unsubscribeMessageReactionAdded = ws.subscribe('direct-message-reaction-added', (msg) => {
				const message = currentRoom.messages.find((m) => m.id === msg.messageId);
				if (message) {
					const reaction = message.reactions.find((r) => r.reaction === msg.reaction);
					if (reaction) {
						reaction.users = [
							...reaction.users,
							{ id: msg.member.userId, name: msg.member.username }
						];
					} else {
						message.reactions = [
							...message.reactions,
							{
								reaction: msg.reaction,
								users: [{ id: msg.member.userId, name: msg.member.username }]
							}
						];
					}
				}
			});

			// Removed is triggered when a user removes a reaction from a message,
			// If the reaction exists, remove the user from the usernames array, if the usernames array is empty, remove the reaction from the message
			unsubscribeMessageReactionRemoved = ws.subscribe('direct-message-reaction-removed', (msg) => {
				const message = currentRoom.messages.find((m) => m.id === msg.messageId);
				if (message) {
					const reaction = message.reactions.find((r) => r.reaction === msg.reaction);
					if (reaction) {
						reaction.users = reaction.users.filter(({ id }) => id !== msg.member.userId);
						if (reaction.users.length === 0) {
							message.reactions = message.reactions.filter((r) => r.reaction !== msg.reaction);
						}
					}
				}
			});

			unsubscribeUserStatusUpdated = ws.subscribe('user-status-updated', (msg) => {
				if (otherUserProfile && msg.userId === otherUserProfile.id) {
					otherUserProfile.status = msg.status;
				}
			});

			unsubscribeGroupMessageContentEdited = ws.subscribe(
				'direct-message-content-edited',
				(msg) => {
					const message = currentRoom.messages.find((m) => m.id === msg.messageId);
					if (message) {
						message.content = msg.newContent;
					}
				}
			);

			unsubscribeGroupMessageDeleted = ws.subscribe('direct-message-deleted', (msg) => {
				currentRoom.messages = currentRoom.messages.filter((m) => m.id !== msg.messageId);
				if (deleteMessageDialog.open && deleteMessageDialog.message?.id === msg.messageId) {
					deleteMessageDialog.open = false;
					deleteMessageDialog.message = null;
				}
			});
		} catch (e) {
			console.error(e);
		}
	};

	const scrollToBottomSafe = async (element: HTMLDivElement | null) => {
		if (!element) return;
		isAutoScrolling = true;
		await scrollToBottom(element, 'auto');
		setTimeout(() => {
			isAutoScrolling = false;
		}, 300); // Petite pause pour éviter le déclenchement immédiat
	};

	// Charge les messages plus anciens (en remontant)
	const loadPreviousMessages = async () => {
		if (currentRoom.messages.length === 0) return;
		try {
			// Le plus ancien message affiché
			const oldest = currentRoom.messages[0];
			const newMessages = await getDirectMessages(currentChatId, {
				limit: LIMIT_LOAD,
				before: oldest.createdAt
			});
			if (newMessages.length > 0) {
				// Ajoute les nouveaux messages au début de la liste
				currentRoom.messages = [
					...newMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
					...currentRoom.messages
				];
				// Si on dépasse le nombre maximum, on retire les messages les plus récents
				while (currentRoom.messages.length > MAX_MESSAGES) {
					currentRoom.messages.pop();
				}
			}
		} catch (err) {
			console.error('Erreur lors du chargement des messages précédents:', err);
		}
	};

	// Charge les messages plus récents (en descendant)
	const loadNextMessages = async () => {
		if (currentRoom.messages.length === 0) return;
		try {
			// Le plus récent message affiché
			const newest = currentRoom.messages[currentRoom.messages.length - 1];
			const newMessages = await getDirectMessages(currentChatId, {
				limit: LIMIT_LOAD,
				after: newest.createdAt
			});
			if (newMessages.length > 0) {
				// Ajoute les nouveaux messages à la fin de la liste
				currentRoom.messages = [
					...currentRoom.messages,
					...newMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
				];
				// Si on dépasse le nombre maximum, on retire les messages les plus anciens
				while (currentRoom.messages.length > MAX_MESSAGES) {
					currentRoom.messages.shift();
				}
			}
		} catch (err) {
			console.error('Erreur lors du chargement des messages suivants:', err);
		}
	};

	const handleMessageReactionToggle = (messageId: string, reaction: string) => {
		ws.toggleDirectMessageReaction(currentChatId, messageId, reaction);
	};

	const sendMessageToWs = async () => {
		if (currentMessage.trim() === '') return;

		const now = new Date();
		const lastMessage = currentRoom.messages[currentRoom.messages.length - 1];
		const timeDiff = lastMessage
			? (now.getTime() - lastMessage.createdAt.getTime()) / 1000 / 60
			: 0; // Différence en minutes

		ws.sendDirectMessage(currentChatId, currentMessage);
		currentMessage = '';

		// Si l'utilisateur est "loin" dans l'historique (ex. dernier message > 5 min), recharge les messages récents
		if (timeDiff > 5 || !lastMessage) {
			currentRoom.messages = await getDirectMessages(currentChatId, {
				limit: LIMIT_LOAD
			});
			currentRoom.messages = currentRoom.messages.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
			);
		}
	};

	// Set the input placeholder if the input is empty
	$effect(() => {
		if (currentMessage.trim() === '' && inputElement) inputElement.innerText = '';
	});

	const handleInputKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessageToWs();
		}
	};

	onDestroy(() => {
		if (topObserver) topObserver.disconnect();
		if (bottomObserver) bottomObserver.disconnect();
	});

	const handleMessageEdit = async (message: CustomDirectMessage) => {
		// Toggle edit mode
		message.editMode = !message.editMode;
		if (message.editMode) {
			await tick(); // Wait for the DOM to update
			// Focus the input element if entering edit mode
			message.editInputElement?.focus();
		} else {
			// Send the edited message
			ws.editDirectMessage(currentChatId, message.id, message.content);
		}
	};

	const handleMessageDelete = async (message: CustomDirectMessage) => {
		if (!message) return;

		try {
			await ws.deleteDirectMessage(currentChatId, message.id);
		} catch (e) {
			console.error('Failed to delete message:', e);
			error(
				'Erreur lors de la suppression du message.',
				'Impossible de supprimer le message, veuillez réessayer plus tard.'
			);
		}
	};
</script>

<div class="relative flex h-screen w-full flex-1 flex-col gap-y-4 overflow-auto">
	{#if otherUserProfile}
		<div class="flex items-center justify-between gap-x-2 bg-gray-100 p-4 dark:bg-gray-800">
			<div class="flex items-center gap-x-4 bg-gray-100 p-4 dark:bg-gray-800">
				<a href="/chat" class="text-muted-foreground hover:text-primary">
					<ChevronLeft size={30} />
				</a>
			</div>
			<div class="flex items-center gap-x-2">
				<div class="relative size-12">
					<Avatar.Root>
						<Avatar.Image src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, otherUserProfile.id)} />
						<Avatar.Fallback
							>{fallbackAvatarLetters(
								otherUserProfile.firstName + ' ' + otherUserProfile.lastName
							)}</Avatar.Fallback
						>
					</Avatar.Root>
					<span
						class={cn('absolute right-2 bottom-2 size-3 rounded-full', {
							'bg-green-500': otherUserProfile.status === PublicStatus.ONLINE,
							'bg-yellow-500': otherUserProfile.status === PublicStatus.AWAY,
							'bg-red-500': otherUserProfile.status === PublicStatus.DO_NOT_DISTURB,
							'bg-gray-500': otherUserProfile.status === PublicStatus.OFFLINE
						})}
					>
					</span>
				</div>

				<div class="flex flex-col overflow-hidden">
					<span class="truncate text-base font-semibold">
						{otherUserProfile.firstName}
						{otherUserProfile.lastName}
					</span>
					<span class="truncate text-sm text-gray-500">{otherUserProfile.email}</span>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex-1 space-y-4 overflow-y-auto px-3 py-2" bind:this={elementsList}>
		{#if currentRoom.id !== null}
			<!-- Sentinel en haut -->
			<div bind:this={topSentinel} class="sentinel mt-4"></div>

			{#each currentRoom.messages as message, i (message.id)}
				<div
					data-message-id={message.id}
					in:smartFly|global={{
						y: -10,
						duration: 300,
						delay: 100,
						isNewMessage: i >= Math.max(0, currentRoom.messages.length - 10),
						messageIndex: i,
						totalMessages: currentRoom.messages.length,
						staggerDelay: 50 // 50ms delay between each message
					}}
				>
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							<div
								class="flex items-start gap-x-4"
								class:justify-end={message.author.userId === authenticatedUser.id}
							>
								{#snippet messageReaction()}
									<div class="mb-4 flex items-center gap-2">
										{#each message.reactions as { reaction, users } (reaction)}
											<div
												class={cn(
													'flex items-center justify-center gap-x-2 rounded-lg bg-gray-100 p-1 text-lg transition-colors duration-300 select-none dark:bg-gray-800',
													{
														'ring-primary !bg-primary/30 ring-2': users.find(
															({ id }) => id === authenticatedUser.id
														)
													}
												)}
												onclick={() => handleMessageReactionToggle(message.id, reaction)}
												role="button"
												tabindex="-1"
											>
												<span>{reaction}</span>
												<NumberFlow spinTiming={{ duration: 150 }} value={users.length} />
											</div>
										{/each}
									</div>
								{/snippet}

								{#if message.author.userId !== authenticatedUser.id}
									<div>
										<div class="text-sm font-medium">
											{message.author.firstName}
											{message.author.lastName}
										</div>
										<div class="bg-muted mt-1 rounded-xl px-3 py-2 text-sm shadow">
											{message.content}
										</div>
										<div class="mt-1 text-xs text-gray-400">{formatDate(message.createdAt)}</div>
										{@render messageReaction()}
									</div>
								{:else}
									<div class="max-w-[70%] text-right">
										{#if message.editMode}
											<input
												type="text"
												class="w-full rounded-lg bg-gray-100 p-2 dark:bg-gray-800"
												bind:this={message.editInputElement}
												bind:value={message.content}
												onkeydown={(e) => {
													if (e.key === 'Enter') {
														e.preventDefault();
														handleMessageEdit(message);
													}
												}}
											/>
										{:else}
											<div
												class="bg-primary inline-block rounded-2xl px-4 py-2 text-sm text-white shadow"
											>
												{message.content}
											</div>
										{/if}
										<div class="mt-1 text-xs text-gray-400">{formatDate(message.createdAt)}</div>
										{@render messageReaction()}
									</div>
								{/if}
							</div>
						</ContextMenu.Trigger>
						<ContextMenu.Content class="w-64">
							<ContextMenu.Item class="dark:hover:!bg-popover flex justify-between hover:!bg-white">
								{#each ['😊', '😂', '🤷‍♂️', '👍'] as emoji}
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 p-2 text-lg transition-colors duration-300 dark:bg-gray-800"
										onclick={() => handleMessageReactionToggle(message.id, emoji)}
										role="button"
										tabindex="-1"
									>
										{emoji}
									</div>
								{/each}
							</ContextMenu.Item>
							<ContextMenu.Sub>
								<ContextMenu.SubTrigger>Ajouter une réaction</ContextMenu.SubTrigger>
								<ContextMenu.SubContent class="min-w-max">
									{#each ['😉', '😎', '😢'] as emoji}
										<ContextMenu.Item
											class="text-lg"
											onclick={() => handleMessageReactionToggle(message.id, emoji)}
											role="button"
											tabindex={-1}
										>
											{emoji}
										</ContextMenu.Item>
									{/each}
								</ContextMenu.SubContent>
							</ContextMenu.Sub>
							{#if message.author.userId === authenticatedUser.id}
								<ContextMenu.Separator />
								<ContextMenu.Item
									class="flex justify-between"
									onclick={() => {
										handleMessageEdit(message);
									}}
								>
									<span>Modifier</span>
									<div>
										<Pen size="18" />
									</div>
								</ContextMenu.Item>
								<ContextMenu.Item
									class="flex justify-between text-red-500 hover:!bg-red-500 hover:!text-white"
									onclick={() => {
										deleteMessageDialog.open = true;
										deleteMessageDialog.message = message;
									}}
								>
									<span>Supprimer</span>
									<div>
										<Trash2 size="18" />
									</div>
								</ContextMenu.Item>
							{/if}
						</ContextMenu.Content>
					</ContextMenu.Root>
				</div>
			{/each}

			<!-- Sentinel en bas -->
			<div bind:this={bottomSentinel} class="sentinel mb-4"></div>
		{/if}
	</div>

	{#if otherUserProfile}
		<div
			class="sticky bottom-0 z-20 flex items-center gap-2 border-t border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<div
				class="max-h-32 min-h-[40px] flex-1 overflow-y-auto rounded-lg bg-white px-3 py-2 text-sm focus:outline-none dark:bg-gray-700"
				contenteditable
				placeholder="Écrivez un message à {otherUserProfile.firstName}"
				bind:this={inputElement}
				bind:innerText={currentMessage}
				onkeydown={handleInputKeyDown}
			></div>
			<Button
				variant="ghost"
				class="rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
				href="/chat/direct/translate?chatId={currentChatId}{aroundMessageId
					? `&aroundMessageId=${aroundMessageId}`
					: ''}"
			>
				<Languages size={20} class="text-primary" />
			</Button>
			<button
				class="rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
				onclick={sendMessageToWs}
			>
				<Send size={20} class="text-primary" />
			</button>
		</div>
	{/if}
</div>

<!-- Delete Message Dialog -->
<AlertDialog.Root bind:open={deleteMessageDialog.open}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Supprimer le message</AlertDialog.Title>
			<AlertDialog.Description>
				Êtes-vous sûr de vouloir supprimer ce message ?
			</AlertDialog.Description>
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<Button variant="outline" onclick={() => (deleteMessageDialog.open = false)}>Annuler</Button>
			<Button
				variant="destructive"
				onclick={() => {
					handleMessageDelete(deleteMessageDialog.message!);
				}}
			>
				Supprimer
			</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<style>
	.sentinel {
		height: 1px;
	}
</style>
