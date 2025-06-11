<script lang="ts">
	import { page } from '$app/state';
	import {
		type DirectMessage,
		getDirectMessages
	} from '$lib/api/direct/message.js';
	import { RoomKind } from '$lib/api/room';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import {
		getUserProfile,
		PublicStatus,
		type UserProfile
	} from '$lib/api/user';
	import ws from '$lib/api/ws';
	import '$lib/assets/styles/chats.scss';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters.js';
	import { formatDate } from '$lib/utils/formatDate';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';
	import NumberFlow from '@number-flow/svelte';
	import { ChevronLeft, Languages, Pen, Send, Trash2 } from 'lucide-svelte';
	import type { AuthenticatedUserState } from '../../authenticatedUser.svelte.js';
	import { onDestroy, tick } from 'svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as ContextMenu from '$lib/components/ui/context-menu';

	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const authenticatedUser = $derived(authenticatedUserState.user);

	const aroundMessageId = $derived(
		page.url.searchParams.get('aroundMessageId')
	);

	// the chatId is the userId of the other user
	let currentChatId: string = $derived(page.url.searchParams.get('chatId') || '');
	let otherUserProfile: UserProfile = $state(null);
	let currentMessage = $state('');
	let currentRoom: { id: string | null; messages: DirectMessage[] } = $state({
		id: null,
		messages: []
	});

	let unsubscribeSendMessage = null;
	let unsubscribeMessageReactionAdded = null;
	let unsubscribeMessageReactionRemoved = null;
	let unsubscribeUserStatusUpdated = null;
	let inputElement: HTMLDivElement = $state(null);
	let elementsList: HTMLDivElement = $state(null);
	let isAutoScrolling = $state(false);

	// Ces deux références DOM serviront de sentinelles
	let topSentinel: HTMLDivElement = $state(null);
	let bottomSentinel: HTMLDivElement = $state(null);

	// Observers pour le haut et le bas
	let topObserver: IntersectionObserver = $state(null);
	let bottomObserver: IntersectionObserver = $state(null);

	const LIMIT_LOAD = 50;
	const MAX_MESSAGES = 75;

	$effect(() => {
		joinRoomAndListenMessages(currentChatId);
		getUserProfile(currentChatId).then(
			(userProfile) => (otherUserProfile = userProfile)
		);

		return () => {
			unsubscribeSendMessage?.();
			unsubscribeMessageReactionAdded?.();
			unsubscribeMessageReactionRemoved?.();
			unsubscribeUserStatusUpdated?.();
			ws.leaveRoom(currentRoom.id);
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
			const joinedRoom = await ws.asyncDirectJoinRoom(
				otherUserId,
				RoomKind.DIRECT
			);
			currentRoom.id = joinedRoom.roomId;

			await tick();
			if (aroundMessageId) {
				const aroundMessageElement = document.querySelector(
					'[data-message-id=\'' + aroundMessageId + '\']'
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

			unsubscribeSendMessage = ws.subscribe(
				'send-direct-message',
				async (msg) => {
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
				}
			);

			// Added is triggered when a user adds a reaction to a message,
			// If the reaction already exists, just update the usernames array with the new user, else add the reaction to the message
			unsubscribeMessageReactionAdded = ws.subscribe(
				'direct-message-reaction-added',
				(msg) => {
					const message = currentRoom.messages.find(
						(m) => m.id === msg.messageId
					);
					if (message) {
						const reaction = message.reactions.find(
							(r) => r.reaction === msg.reaction
						);
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
				}
			);

			// Removed is triggered when a user removes a reaction from a message,
			// If the reaction exists, remove the user from the usernames array, if the usernames array is empty, remove the reaction from the message
			unsubscribeMessageReactionRemoved = ws.subscribe(
				'direct-message-reaction-removed',
				(msg) => {
					const message = currentRoom.messages.find(
						(m) => m.id === msg.messageId
					);
					if (message) {
						const reaction = message.reactions.find(
							(r) => r.reaction === msg.reaction
						);
						if (reaction) {
							reaction.users = reaction.users.filter(
								({ id }) => id !== msg.member.userId
							);
							if (reaction.users.length === 0) {
								message.reactions = message.reactions.filter(
									(r) => r.reaction !== msg.reaction
								);
							}
						}
					}
				}
			);

			unsubscribeUserStatusUpdated = ws.subscribe(
				'user-status-updated',
				(msg) => {
					if (msg.userId === otherUserProfile.id) {
						otherUserProfile.status = msg.status;
					}
				}
			);
		} catch (e) {
			console.error(e);
		}
	};

	const scrollToBottomSafe = async (element) => {
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
					...newMessages.sort(
						(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
					),
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
					...newMessages.sort(
						(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
					)
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
		if (currentMessage.trim() === '' && inputElement)
			inputElement.innerText = '';
	});

	const handleInputKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessageToWs();
		}
	};

	onDestroy(() => {
		if (topObserver) topObserver.disconnect();
		if (bottomObserver) bottomObserver.disconnect();
	});

	const handleLanguageButtonClick = () => {
		window.location.href = `/chat/direct/translate`;
	};
</script>

<div class="relative w-full h-screen flex flex-col gap-y-4 flex-1 overflow-auto">
	{#if otherUserProfile}
		<div class="flex items-center justify-between gap-x-2 bg-gray-100 dark:bg-gray-800 p-4">
			<div class="flex items-center gap-x-4 bg-gray-100 p-4 dark:bg-gray-800">
				<a href="/chat" class="text-muted-foreground hover:text-primary">
					<ChevronLeft size={30} />
				</a>
			</div>
			<div class="flex items-center gap-x-2">
				<div class="relative size-12">
					<Avatar.Root>
						<Avatar.Image
							src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, otherUserProfile.id)}
						/>
						<Avatar.Fallback
						>{fallbackAvatarLetters(
							otherUserProfile.firstName + " " + otherUserProfile.lastName,
						)}</Avatar.Fallback
						>
					</Avatar.Root>
					<span
						class={cn("rounded-full absolute bottom-2 right-2 size-3", {
								"bg-green-500": otherUserProfile.status === PublicStatus.ONLINE,
								"bg-yellow-500": otherUserProfile.status === PublicStatus.AWAY,
								"bg-red-500":
									otherUserProfile.status === PublicStatus.DO_NOT_DISTURB,
								"bg-gray-500": otherUserProfile.status === PublicStatus.OFFLINE,
							})}
					>
						</span>
				</div>

				<div class="flex flex-col overflow-hidden">
						<span class="font-semibold text-base truncate">
							{otherUserProfile.firstName} {otherUserProfile.lastName}
						</span>
					<span class="text-sm text-gray-500 truncate">{otherUserProfile.email}</span>
				</div>
			</div>
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto px-3 py-2 space-y-4" bind:this={elementsList}>

		{#if currentRoom.id !== null}
			<!-- Sentinel en haut -->
			<div bind:this={topSentinel} class="sentinel mt-4"></div>

			{#each currentRoom.messages as message (message.id)}
				<div data-message-id={message.id}>
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							<div
								class="flex gap-x-4 items-start"
								class:justify-end={message.author.userId ===
                  authenticatedUser.id}
							>
								{#snippet messageReaction()}
									<div class="flex items-center gap-2 mb-4">
										{#each message.reactions as { reaction, users } (reaction)}
											<div
												class={cn(
                          "flex items-center justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-lg gap-x-2 transition-colors duration-300 select-none",
                          {
                            "ring-2 ring-primary !bg-primary/30": users.find(
                              ({ id }) => id === authenticatedUser.id,
                            ),
                          },
                        )}
												onclick={() =>
                          handleMessageReactionToggle(message.id, reaction)}
												role="button"
												tabindex="-1"
											>
												<span>{reaction}</span>
												<NumberFlow
													spinTiming={{ duration: 150 }}
													value={users.length}
												/>
											</div>
										{/each}
									</div>
								{/snippet}

								{#if message.author.userId !== authenticatedUser.id}
									<div>
										<div class="text-sm font-medium">
											{message.author.firstName} {message.author.lastName}
										</div>
										<div class="bg-muted px-3 py-2 rounded-xl shadow text-sm mt-1">
											{message.content}
										</div>
										<div class="text-xs text-gray-400 mt-1">{formatDate(message.createdAt)}</div>
										{@render messageReaction()}
									</div>
								{:else}
									<div class="max-w-[70%] text-right">
										<div class="rounded-2xl px-4 py-2 bg-primary text-white text-sm shadow inline-block">
											{message.content}
										</div>
										<div class="text-xs text-gray-400 mt-1">{formatDate(message.createdAt)}</div>
										{@render messageReaction()}
									</div>
								{/if}
							</div>
						</ContextMenu.Trigger>
						<ContextMenu.Content class="w-64">
							<ContextMenu.Item
								class="flex justify-between hover:!bg-white dark:hover:!bg-popover"
							>
								{#each ["😊", "😂", "🤷‍♂️", "👍"] as emoji}
									<div
										class="flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-colors duration-300 p-2 rounded-full w-8 h-8 text-lg"
										onclick={() =>
                      handleMessageReactionToggle(message.id, emoji)}
										role="button"
										tabindex="-1"
									>
										{emoji}
									</div>
								{/each}
							</ContextMenu.Item>
							<ContextMenu.Sub>
								<ContextMenu.SubTrigger
								>Ajouter une réaction
								</ContextMenu.SubTrigger
								>
								<ContextMenu.SubContent class="min-w-max">
									{#each ["😉", "😎", "😢"] as emoji}
										<ContextMenu.Item
											class="text-lg"
											onclick={() =>
                        handleMessageReactionToggle(message.id, emoji)}
											role="button"
											tabindex={-1}
										>
											{emoji}
										</ContextMenu.Item>
									{/each}
								</ContextMenu.SubContent>
							</ContextMenu.Sub>
							<ContextMenu.Separator />
							<ContextMenu.Item class="flex justify-between">
								<span>Modifier</span>
								<div>
									<Pen size="18" />
								</div>
							</ContextMenu.Item>
							<ContextMenu.Item
								class="text-red-500 hover:!bg-red-500 hover:!text-white flex justify-between"
							>
								<span>Supprimer</span>
								<div>
									<Trash2 size="18" />
								</div>
							</ContextMenu.Item>
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
			class="sticky bottom-0 z-20 bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 px-4 py-3 flex items-center gap-2">
			<div
				class="flex-1 min-h-[40px] max-h-32 overflow-y-auto rounded-lg bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none"
				contenteditable
				placeholder="Écrivez un message à {otherUserProfile.firstName}"
				bind:this={inputElement}
				bind:innerText={currentMessage}
				onkeydown={handleInputKeyDown}
			></div>
			<button class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" onclick={handleLanguageButtonClick}>
				<Languages size={20} class="text-primary" />
			</button>
			<button class="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" onclick={sendMessageToWs}>
				<Send size={20} class="text-primary" />
			</button>

		</div>
	{/if}
</div>

<style>
    .sentinel {
        height: 1px;
    }
</style>
