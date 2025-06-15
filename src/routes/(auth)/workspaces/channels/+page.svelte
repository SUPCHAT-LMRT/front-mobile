<script lang="ts">
	import { page } from '$app/state';
	import { smartFly } from '$lib/animation/visibleFly';
	import { RoomKind } from '$lib/api/room';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import {
		type Channel,
		type ChannelMessage,
		getPrivateChannelMembers,
		getWorkspaceChannel,
		getWorkspaceChannelMessages,
		uploadChannelFile
	} from '$lib/api/workspace/channels';
	import { getWorkspaceMembers } from '$lib/api/workspace/member';
	import type { Workspace } from '$lib/api/workspace/workspace';
	import ws from '$lib/api/ws';
	import '$lib/assets/styles/chats.scss';
	import FileDropZone from '$lib/components/app/FileDropZone.svelte';
	import HoveredUserProfile from '$lib/components/app/HoveredUserProfile.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { error, success } from '$lib/toast/toast';
	import { cn } from '$lib/utils';
	import { formatDate } from '$lib/utils/formatDate';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';
	import { FileIcon } from '@lucide/svelte';
	import NumberFlow from '@number-flow/svelte';
	import { format } from 'date-fns';
	import { fr } from 'date-fns/locale';
	import { ChevronLeft, Languages, Pen, Send, Trash2, UserIcon } from 'lucide-svelte';
	import { onDestroy, tick } from 'svelte';
	import type { AuthenticatedUserState } from '../../authenticatedUser.svelte';
	import { currentWorkspaceState } from '../currentWorkspace.svelte';

	type CustomChannelMessage = ChannelMessage & {
		editMode?: boolean;
		editInputElement?: HTMLInputElement;
	};

	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const authenticatedUser = $derived(authenticatedUserState.user);

	const aroundMessageId = $derived(page.url.searchParams.get('aroundMessageId') ?? undefined);

	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);
	let currentChannelId: string = $derived(page.url.searchParams.get('channelId') || '');
	let currentChannel: Channel | null = $state(null);

	let currentWorkspaceId: string = $derived(page.url.searchParams.get('workspaceId') || '');
	let currentMessage = $state('');
	let currentRoom: { id: string | null; messages: CustomChannelMessage[] } = $state({
		id: null,
		messages: []
	});
	let channelMembers: { id: string; name: string }[] = $state([]);

	let deleteMessageDialog: {
		open: boolean;
		message: CustomChannelMessage | null;
	} = $state({
		open: false,
		message: null
	});

	let selectedFiles: File[] = $state([]);
	let sendFileDialogOpen = $state(false);

	let unsubscribeSendMessage: (() => void) | null = null;
	let unsubscribeMessageReactionAdded: (() => void) | null = null;
	let unsubscribeMessageReactionRemoved: (() => void) | null = null;
	let unsubscribeGroupMessageContentEdited: (() => void) | null = null;
	let unsubscribeGroupMessageDeleted: (() => void) | null = null;
	let unsubscribeChannelMessageAttachmentCreated: (() => void) | null = null;
	let inputElement: HTMLDivElement | null = $state(null);
	let elementsList: HTMLDivElement | null = $state(null);
	let isAutoScrolling: boolean = $state(false);

	// Ces deux références DOM serviront de sentinelles
	let topSentinel: HTMLDivElement | null = $state(null);
	let bottomSentinel: HTMLDivElement | null = $state(null);

	// Observers pour le haut et le bas
	let topObserver: IntersectionObserver | null = $state(null);
	let bottomObserver: IntersectionObserver | null = $state(null);

	const LIMIT_LOAD = 50;
	const MAX_MESSAGES = 75;

	$effect(() => {
		joinRoomAndListenMessages(currentWorkspaceId, currentChannelId);
		getWorkspaceChannel(currentWorkspaceId, currentChannelId).then(
			(channel) => (currentChannel = channel)
		);

		return () => {
			unsubscribeSendMessage?.();
			unsubscribeMessageReactionAdded?.();
			unsubscribeMessageReactionRemoved?.();
			unsubscribeGroupMessageContentEdited?.();
			unsubscribeGroupMessageDeleted?.();
			ws.leaveRoom(currentRoom?.id!);
			currentRoom.id = null;
			currentRoom.messages = [];
		};
	});

	const loadMembers = async () => {
		try {
			if (!currentWorkspaceId || !currentChannelId || !currentChannel) return;

			if (currentChannel.isPrivate) {
				channelMembers = await getPrivateChannelMembers(currentWorkspaceId, currentChannelId);
			} else {
				const res = await getWorkspaceMembers(currentWorkspaceId, 1, 50);
				channelMembers = res.members.map((m) => ({
					id: m.userId,
					name: m.pseudo
				}));
			}
		} catch (err) {
			console.error('Erreur lors du chargement des membres :', err);
		}
	};

	const joinRoomAndListenMessages = async (workspaceId: string, channelId: string) => {
		try {
			currentRoom.messages = await getWorkspaceChannelMessages(workspaceId, channelId, {
				limit: LIMIT_LOAD,
				aroundMessageId
			});
			currentRoom.messages = currentRoom.messages.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
			);
			currentRoom.id = await ws.asyncChannelJoinRoom(channelId, RoomKind.CHANNEL);

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

			unsubscribeSendMessage = ws.subscribe('send-channel-message', async (msg) => {
				currentRoom.messages.push({
					id: msg.messageId,
					content: msg.content,
					author: {
						userId: msg.sender.userId,
						pseudo: msg.sender.pseudo,
						workspaceMemberId: msg.sender.workspaceMemberId
					},
					createdAt: new Date(msg.createdAt),
					reactions: [],
					attachments: []
				});

				await tick();
				await scrollToBottomSafe(elementsList);
			});

			// Added is triggered when a user adds a reaction to a message,
			// If the reaction already exists, just update the usernames array with the new user, else add the reaction to the message
			unsubscribeMessageReactionAdded = ws.subscribe('channel-message-reaction-added', (msg) => {
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
			unsubscribeMessageReactionRemoved = ws.subscribe(
				'channel-message-reaction-removed',
				(msg) => {
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
				}
			);

			unsubscribeGroupMessageContentEdited = ws.subscribe(
				'channel-message-content-edited',
				(msg) => {
					const message = currentRoom.messages.find((m) => m.id === msg.messageId);
					if (message) {
						message.content = msg.newContent;
					}
				}
			);

			unsubscribeGroupMessageDeleted = ws.subscribe('channel-message-deleted', (msg) => {
				currentRoom.messages = currentRoom.messages.filter((m) => m.id !== msg.messageId);
				if (deleteMessageDialog.open && deleteMessageDialog.message?.id === msg.messageId) {
					deleteMessageDialog.open = false;
					deleteMessageDialog.message = null;
				}
			});

			unsubscribeChannelMessageAttachmentCreated = ws.subscribe(
				'channel-message-attachment-created',
				async ({ message }) => {
					currentRoom.messages.push({
						id: message.id,
						content: '',
						author: {
							userId: message.senderUserId,
							pseudo: message.senderPseudo,
							workspaceMemberId: message.senderWorkspaceMemberId
						},
						createdAt: new Date(message.createdAt),
						reactions: [],
						attachments: [
							{
								id: message.attachmentFileId,
								name: message.attachmentFileName
							}
						]
					});

					await tick();
					await scrollToBottomSafe(elementsList);
				}
			);
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
			const newMessages = await getWorkspaceChannelMessages(currentWorkspaceId, currentChannelId, {
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
			const newMessages = await getWorkspaceChannelMessages(currentWorkspaceId, currentChannelId, {
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
		ws.toggleChannelMessageReaction(currentRoom.id!, messageId, reaction);
	};

	const sendMessageToWs = async () => {
		if (currentMessage.trim() === '') return;

		const now = new Date();
		const lastMessage = currentRoom.messages[currentRoom.messages.length - 1];
		const timeDiff = lastMessage
			? (now.getTime() - lastMessage.createdAt.getTime()) / 1000 / 60
			: 0; // Différence en minutes

		ws.sendChannelMessage(currentRoom.id!, currentMessage);
		currentMessage = '';

		// Si l'utilisateur est "loin" dans l'historique (ex. dernier message > 5 min), recharge les messages récents
		if (timeDiff > 5 || !lastMessage) {
			currentRoom.messages = await getWorkspaceChannelMessages(
				currentWorkspaceId,
				currentChannelId,
				{
					limit: LIMIT_LOAD
				}
			);
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

	$effect(() => {
		if (!workspace?.id || !currentChannelId) return;

		const fetchChannel = async () => {
			try {
				currentChannel = await getWorkspaceChannel(workspace.id, currentChannelId);
			} catch (e) {
				console.error('Erreur lors de la récupération des salons du workspace:', e);
				error('Erreur', 'Impossible de récupérer les salons du workspace');
			}
		};

		fetchChannel();
	});

	const handleMessageEdit = async (message: CustomChannelMessage) => {
		// Toggle edit mode
		message.editMode = !message.editMode;
		if (message.editMode) {
			await tick(); // Wait for the DOM to update
			// Focus the input element if entering edit mode
			message.editInputElement?.focus();
		} else {
			// Send the edited message
			ws.editChannelMessage(currentChannelId, message.id, message.content);
		}
	};

	const handleMessageDelete = async (message: CustomChannelMessage) => {
		if (!message) return;

		try {
			await ws.deleteChannelMessage(currentChannelId, message.id);
		} catch (e) {
			console.error('Failed to delete message:', e);
			error(
				'Erreur lors de la suppression du message.',
				'Impossible de supprimer le message, veuillez réessayer plus tard.'
			);
		}
	};

	function handleFilesSelected(event: File[]) {
		selectedFiles = event;
	}

	function handleError(event: string) {
		error('Erreur', event);
	}

	async function uploadFiles() {
		if (selectedFiles.length === 0) return;

		try {
			// Replace with your upload endpoint
			await uploadChannelFile(
				currentWorkspaceId,
				currentChannelId,
				selectedFiles[0] // Assuming single file upload for simplicity
			);

			sendFileDialogOpen = false;
			success('Fichiers envoyés', 'Fichiers envoyés avec succès!');
			selectedFiles = [];
		} catch (e) {
			error('Erreur', "Echec de l'envoi des fichiers.");
		}
	}
</script>

{#if currentChannel && workspace}
	<div class="flex justify-between gap-y-4 bg-gray-100 p-4 dark:bg-gray-800">
		<div class="flex items-center gap-x-4">
			<a href="/workspaces?workspaceId={workspace.id}" class="flex">
				<ChevronLeft size={30} />
			</a>
			<div class="flex items-center gap-x-2">
				<span class="text-2xl font-semibold">#{currentChannel.name}</span>
				<span class="text-muted-foreground text-md translate-y-[1px]">{currentChannel.topic}</span>
			</div>
		</div>
		<div class="mt-2 flex items-center gap-2">
			<Drawer.Root
				shouldScaleBackground={true}
				onOpenChange={(open) => {
					if (open) {
						loadMembers();
					}
				}}
			>
				<Drawer.Trigger>
					<Button variant="outline" size="sm" class="flex items-center gap-1">
						<UserIcon size={18} class="text-primary" />
						Membres
					</Button>
				</Drawer.Trigger>
				<Drawer.Portal>
					<Drawer.Overlay class="fixed inset-0 bg-black/40">
						<Drawer.Content class="bg-background flex h-screen flex-col p-4">
							<Drawer.Header>
								<div class="flex items-center gap-2">
									<Drawer.Title>Membres</Drawer.Title>
									<Drawer.Description class="text-muted-foreground flex flex-col gap-1">
										Liste des membres du canal
									</Drawer.Description>
								</div>
							</Drawer.Header>

							<div class="flex-grow overflow-auto">
								{#if channelMembers.length > 0}
									<ul class="space-y-2">
										{#each channelMembers as member (member.id)}
											<li
												class="flex cursor-default items-center gap-2 rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
											>
												<UserIcon class="text-primary h-5 w-5" />
												<HoveredUserProfile userId={member.id} self={false}>
													<span>{member.name}</span>
												</HoveredUserProfile>
											</li>
										{/each}
									</ul>
								{:else}
									<p class="text-muted-foreground text-sm">Aucun membre trouvé.</p>
								{/if}
							</div>
						</Drawer.Content>
					</Drawer.Overlay>
				</Drawer.Portal>
			</Drawer.Root>
		</div>
	</div>

	<div class="flex flex-1 flex-col space-y-4 overflow-y-auto px-4" bind:this={elementsList}>
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

								{#if message.author !== null && message.author.userId !== authenticatedUser.id}
									<div class="flex flex-col">
										<div class="flex items-center gap-2">
											<HoveredUserProfile userId={message.author.userId} self={false}>
												<span class="font-semibold">{message.author.pseudo}</span>
											</HoveredUserProfile>
											<Tooltip>
												<TooltipTrigger>
													<span class="text-sm text-gray-500">
														{formatDate(message.createdAt)}
													</span>
												</TooltipTrigger>
												<TooltipContent>
													{format(new Date(message.createdAt), 'EEEE d MMMM yyyy à HH:mm', {
														locale: fr
													})}
												</TooltipContent>
											</Tooltip>
										</div>
										<div class="flex flex-col gap-y-2">
											<div class="flex items-center gap-2">
												{#each message.attachments as attachment}
													<div class="mt-2 flex flex-col items-start">
														<Button
															variant="ghost"
															href={getS3ObjectUrl(S3Bucket.CHANNELS_ATTACHMENTS, attachment.id)}
															target="_blank"
															rel="noopener noreferrer"
															class="h-[50px] w-[50px]"
														>
															<FileIcon />
														</Button>
														<span class="text-sm text-gray-500">
															{attachment.name}
														</span>
													</div>
												{/each}
												{#if message.content.trim() !== ''}
													<span class="bg-primary rounded-xl p-2 break-all text-white shadow-lg">
														{message.content}
													</span>
												{/if}
											</div>
											{@render messageReaction()}
										</div>
									</div>
								{/if}

								{#if message.author.userId === authenticatedUser.id}
									<div class="flex flex-col">
										<div class="flex flex-col gap-y-2">
											<div class="flex items-end justify-end gap-2">
												<div class="flex flex-col items-end gap-y-2">
													<Tooltip>
														<TooltipTrigger class="text-left">
															<span class="text-sm text-gray-500">
																{formatDate(message.createdAt)}
															</span>
														</TooltipTrigger>
														<TooltipContent>
															{format(new Date(message.createdAt), 'EEEE d MMMM yyyy à HH:mm', {
																locale: fr
															})}
														</TooltipContent>
													</Tooltip>
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
														{#each message.attachments as attachment}
															<div class="mt-2 flex flex-col items-end">
																<Button
																	variant="ghost"
																	href={getS3ObjectUrl(
																		S3Bucket.CHANNELS_ATTACHMENTS,
																		attachment.id
																	)}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="h-[50px] w-[50px]"
																>
																	<FileIcon />
																</Button>
																<span class="text-sm text-gray-500">
																	{attachment.name}
																</span>
															</div>
														{/each}
														{#if message.content.trim() !== ''}
															<span
																class="bg-primary w-full rounded-xl p-2 break-all text-white shadow-lg"
															>
																{message.content}
															</span>
														{/if}
													{/if}
												</div>
											</div>

											{@render messageReaction()}
										</div>
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

	{#if currentChannel}
		<div
			class="sticky bottom-0 z-20 flex items-center gap-2 border-t border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<div
				class="max-h-32 min-h-[40px] flex-1 cursor-text overflow-y-auto rounded-lg bg-white p-2 break-all dark:bg-gray-700"
				contenteditable
				placeholder="Écrivez un message dans #{currentChannel.name}"
				bind:this={inputElement}
				bind:innerText={currentMessage}
				onkeydown={handleInputKeyDown}
				autofocus
			></div>

			<!--      button langage -->
			<Button
				variant="ghost"
				class="rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
				href="/workspaces/channels/translate?channelId={currentChannelId}"
			>
				<Languages size={20} class="text-primary" />
			</Button>

			<!-- Send file button -->
			<Dialog.Root bind:open={sendFileDialogOpen}>
				<Dialog.Trigger
					class="rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
					aria-label="Envoyer un fichier"
				>
					<FileIcon size={20} class="text-primary" />
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>Envoyer un fichier</Dialog.Title>
						<Dialog.Description>
							Sélectionnez un fichier à envoyer dans le canal #{currentChannel.name}
						</Dialog.Description>
					</Dialog.Header>

					<div class="container mx-auto max-w-2xl p-6">
						<FileDropZone
							accept="image/*,.pdf,.doc,.docx"
							multiple={false}
							maxSize={5 * 1024 * 1024}
							filesSelected={handleFilesSelected}
							error={handleError}
							class="mb-6"
						/>

						{#if selectedFiles.length > 0}
							<div class="flex gap-2">
								<button
									class="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
									onclick={uploadFiles}
								>
									Envoyer {selectedFiles.length} fichier(s)
								</button>
							</div>
						{/if}
					</div>
				</Dialog.Content>
			</Dialog.Root>

			<button
				class="rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
				onclick={sendMessageToWs}
			>
				<Send size={20} class="text-primary" />
			</button>
		</div>
	{/if}
{/if}

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
