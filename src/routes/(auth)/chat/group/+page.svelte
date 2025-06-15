<script lang="ts">
	import { page } from '$app/state';
	import { smartFly } from '$lib/animation/visibleFly';
	import {
		addGroupMember,
		getGroupInfo,
		leaveGroup as leaveGroupApi,
		type GroupInfo
	} from '$lib/api/group/member';
	import {
		listGroupMessages,
		uploadGroupMessageFile,
		type GroupMessage
	} from '$lib/api/group/message';
	import { RoomKind } from '$lib/api/room';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { listAllUsers, PublicStatus, type ListAllUsersResponse } from '$lib/api/user';
	import ws from '$lib/api/ws';
	import '$lib/assets/styles/chats.scss';
	import FileDropZone from '$lib/components/app/FileDropZone.svelte';
	import HoveredUserProfile from '$lib/components/app/HoveredUserProfile.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Sheet from '$lib/components/ui/sheet';
	import { error, success } from '$lib/toast/toast';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { formatDate } from '$lib/utils/formatDate';
	import { goto } from '$lib/utils/goto';
	import { scrollToBottom } from '$lib/utils/scrollToBottom';
	import { Crown, FileIcon, LogOut, MoreVertical, UserPlus, Users } from '@lucide/svelte';
	import NumberFlow from '@number-flow/svelte';
	import { ChevronLeft, Languages, Pen, Send, Trash2 } from 'lucide-svelte';
	import { onDestroy, tick } from 'svelte';
	import type { AuthenticatedUserState } from '../../authenticatedUser.svelte';

	type CustomGroupMessage = GroupMessage & {
		editMode?: boolean;
		editInputElement?: HTMLInputElement;
	};

	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	const authenticatedUser = $derived(authenticatedUserState.user);

	const aroundMessageId = $derived(page.url.searchParams.get('aroundMessageId') ?? undefined);

	// the chatId is the userId of the other user
	let currentGroupId: string = $derived(page.url.searchParams.get('groupId') || '');
	let groupInfo: GroupInfo | null = $state(null);
	let currentMessage = $state('');
	let currentRoom: { id: string | null; messages: CustomGroupMessage[] } = $state({
		id: null,
		messages: []
	});

	let showMembersSheet = $state(false);
	let showInviteDialog = $state(false);
	let deleteMessageDialog: {
		open: boolean;
		message: CustomGroupMessage | null;
	} = $state({
		open: false,
		message: null
	});

	let selectedFiles: File[] = $state([]);
	let sendFileDialogOpen = $state(false);

	// Invite members states
	let allUsers: ListAllUsersResponse[] = $state([]);
	let selectedUserIds = $state(new Set<string>());
	let isLoadingUsers = $state(false);
	let isInviting = $state(false);

	let unsubscribeSendMessage: (() => void) | null = null;
	let unsubscribeMessageReactionAdded: (() => void) | null = null;
	let unsubscribeMessageReactionRemoved: (() => void) | null = null;
	let unsubscribeGroupMemberAdded: (() => void) | null = null;
	let unsubscribeGroupMemberRemoved: (() => void) | null = null;
	let unsubscribeGroupMessageContentEdited: (() => void) | null = null;
	let unsubscribeGroupMessageDeleted: (() => void) | null = null;
	let unsubscribeGroupMessageAttachmentCreated: (() => void) | null = null;
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
		joinRoomAndListenMessages(currentGroupId);
		getGroupInfo(currentGroupId).then((info) => {
			groupInfo = info;
		});

		return () => {
			unsubscribeSendMessage?.();
			unsubscribeMessageReactionAdded?.();
			unsubscribeMessageReactionRemoved?.();
			unsubscribeGroupMemberAdded?.();
			unsubscribeGroupMemberRemoved?.();
			unsubscribeGroupMessageContentEdited?.();
			unsubscribeGroupMessageDeleted?.();
			unsubscribeGroupMessageAttachmentCreated?.();
			ws.leaveRoom(currentRoom.id!);
			currentRoom.id = null;
			currentRoom.messages = [];
		};
	});

	// Load all users when invite dialog opens
	$effect(() => {
		if (showInviteDialog) {
			loadAllUsers();
		}
	});
	const loadAllUsers = async () => {
		try {
			isLoadingUsers = true;
			allUsers = await listAllUsers();

			// Filter out users who are already members
			const userIds = new Set(groupInfo?.members.map((m) => m.userId));
			allUsers = allUsers.filter((user) => !userIds.has(user.id));

			selectedUserIds = new Set();
		} catch (error) {
			console.error('Failed to load users:', error);
		} finally {
			isLoadingUsers = false;
		}
	};

	const toggleUserSelection = (userId: string) => {
		if (selectedUserIds.has(userId)) {
			selectedUserIds.delete(userId);
		} else {
			selectedUserIds.add(userId);
		}
		selectedUserIds = new Set(selectedUserIds); // Trigger reactivity
	};

	const inviteMembers = async () => {
		if (selectedUserIds.size === 0) {
			error(
				'Aucun utilisateur sélectionné',
				'Veuillez sélectionner au moins un utilisateur à inviter.'
			);
			return;
		}

		try {
			isInviting = true;

			for (const userId of selectedUserIds) {
				await addGroupMember(currentGroupId, userId);
			}

			showInviteDialog = false;
			selectedUserIds = new Set();

			// Refresh group info
			groupInfo = await getGroupInfo(currentGroupId);
		} catch (e) {
			console.error('Failed to invite members:', e);
			error(
				"Erreur lors de l'invitation des membres.",
				"Impossible d'inviter les membres, veuillez réessayer plus tard."
			);
		} finally {
			isInviting = false;
		}
	};

	const leaveGroup = async () => {
		try {
			await leaveGroupApi(currentGroupId);
			await goto('/');
		} catch (e) {
			console.error('Failed to leave group:', error);
			error(
				'Erreur lors de la sortie du groupe.',
				'Impossible de quitter le groupe, veuillez réessayer plus tard.'
			);
		}
	};

	const joinRoomAndListenMessages = async (groupId: string) => {
		try {
			currentRoom.messages = await listGroupMessages(groupId, {
				limit: LIMIT_LOAD,
				aroundMessageId
			});
			currentRoom.messages = currentRoom.messages.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
			);
			const joinedRoom = await ws.asyncGroupJoinRoom(groupId, RoomKind.GROUP);
			currentRoom.id = joinedRoom;

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

			unsubscribeSendMessage = ws.subscribe('send-group-message', async (msg) => {
				currentRoom.messages.push({
					id: msg.messageId,
					content: msg.content,
					author: {
						userId: msg.sender.userId,
						firstName: msg.sender.firstName,
						lastName: msg.sender.lastName
					},
					createdAt: new Date(msg.createdAt),
					reactions: [],
					attachments: []
				});

				await tick();
				await scrollToBottomSafe(elementsList);
			});

			unsubscribeMessageReactionAdded = ws.subscribe('group-message-reaction-added', (msg) => {
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

			unsubscribeMessageReactionRemoved = ws.subscribe('group-message-reaction-removed', (msg) => {
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

			unsubscribeGroupMemberAdded = ws.subscribe('group-member-added', async (msg) => {
				if (msg.groupId === currentGroupId) {
					// Refresh group info
					groupInfo = await getGroupInfo(currentGroupId);
				}
			});

			unsubscribeGroupMemberRemoved = ws.subscribe('group-member-removed', async (msg) => {
				if (msg.groupId === currentGroupId) {
					// Refresh group info
					groupInfo = await getGroupInfo(currentGroupId);
				}
			});

			unsubscribeGroupMessageContentEdited = ws.subscribe('group-message-content-edited', (msg) => {
				const message = currentRoom.messages.find((m) => m.id === msg.messageId);
				if (message) {
					message.content = msg.newContent;
				}
			});

			unsubscribeGroupMessageDeleted = ws.subscribe('group-message-deleted', (msg) => {
				currentRoom.messages = currentRoom.messages.filter((m) => m.id !== msg.messageId);
				if (deleteMessageDialog.open && deleteMessageDialog.message?.id === msg.messageId) {
					deleteMessageDialog.open = false;
					deleteMessageDialog.message = null;
				}
			});

			unsubscribeGroupMessageAttachmentCreated = ws.subscribe(
				'group-attachment-created',
				async ({ message }) => {
					currentRoom.messages.push({
						id: message.id,
						content: '',
						author: {
							userId: message.authorUserId,
							firstName: message.authorFirstName,
							lastName: message.authorLastName
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
			const newMessages = await listGroupMessages(currentGroupId, {
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
			const newMessages = await listGroupMessages(currentGroupId, {
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
		ws.toggleGroupMessageReaction(currentGroupId, messageId, reaction);
	};

	const sendMessageToWs = async () => {
		if (currentMessage.trim() === '') return;

		const now = new Date();
		const lastMessage = currentRoom.messages[currentRoom.messages.length - 1];
		const timeDiff = lastMessage
			? (now.getTime() - lastMessage.createdAt.getTime()) / 1000 / 60
			: 0; // Différence en minutes

		ws.sendGroupMessage(currentGroupId, currentMessage);
		currentMessage = '';

		// Si l'utilisateur est "loin" dans l'historique (ex. dernier message > 5 min), recharge les messages récents
		if (timeDiff > 5 || !lastMessage) {
			currentRoom.messages = await listGroupMessages(currentGroupId, {
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

	$effect(() => {
		return ws.subscribe('user-status-updated', (msg) => {
			if (groupInfo?.members) {
				const member = groupInfo.members.find((m) => m.userId === msg.userId);
				if (member) {
					member.status = msg.status;
				}
			}

			// Change allUsers status
			const user = allUsers.find((u) => u.id === msg.userId);
			if (user) {
				user.status = msg.status;
			}
		});
	});

	$effect(() => {
		return ws.subscribe('group-member-added', (msg) => {
			// Add the user to the group info members
			if (msg.groupId === currentGroupId) {
				getGroupInfo(currentGroupId).then((info) => {
					groupInfo = info;
				});
			}

			// Remove the user from allUsers if they were there
			allUsers = allUsers.filter((u) => u.id !== msg.member.userId);
		});
	});

	$effect(() => {
		return ws.subscribe('group-member-removed', async (msg) => {
			// Remove the user to the group info members
			if (msg.groupId === currentGroupId) {
				getGroupInfo(currentGroupId).then((info) => {
					groupInfo = info;
				});
			}

			// Add the user from allUsers if they were there
			allUsers = await listAllUsers();
			allUsers = allUsers.filter((u) => u.id !== msg.userId);
		});
	});

	$effect(() => {
		return ws.subscribe('group-ownership-transferred', (msg) => {
			// Refresh group info to reflect ownership change
			if (msg.groupId === currentGroupId) {
				getGroupInfo(currentGroupId).then((info) => {
					groupInfo = info;
				});
			}
		});
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

	const handleMessageEdit = async (message: CustomGroupMessage) => {
		// Toggle edit mode
		message.editMode = !message.editMode;
		if (message.editMode) {
			await tick(); // Wait for the DOM to update
			// Focus the input element if entering edit mode
			message.editInputElement?.focus();
		} else {
			// Send the edited message
			ws.editGroupMessage(currentGroupId, message.id, message.content);
		}
	};

	const handleMessageDelete = async (message: CustomGroupMessage) => {
		if (!message) return;

		try {
			await ws.deleteGroupMessage(currentGroupId, message.id);
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
			await uploadGroupMessageFile(
				currentGroupId,
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

<div class="relative flex h-screen w-full flex-1 flex-col gap-y-4 overflow-auto">
	{#if groupInfo}
		<div class="flex items-center justify-between gap-x-2 bg-gray-100 p-4 dark:bg-gray-800">
			<div class="flex items-center gap-x-4 bg-gray-100 p-4 dark:bg-gray-800">
				<a href="/chat" class="text-muted-foreground hover:text-primary">
					<ChevronLeft size={30} />
				</a>
			</div>
			<div class="flex items-center gap-x-2">
				<div class="relative size-12">
					<Avatar.Root>
						{fallbackAvatarLetters(groupInfo.name)}
					</Avatar.Root>
				</div>

				<div class="flex flex-col">
					<span class="text-xl font-semibold">{groupInfo.name}</span>
					<span class="text-sm text-gray-500">
						{groupInfo.members.length} membre{groupInfo.members.length > 1 ? 's' : ''}
					</span>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						<Button variant="outline" size="sm">
							<MoreVertical size={16} />
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item onclick={() => (showMembersSheet = true)}>
							<Users size={16} class="mr-2" />
							Membres
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => (showInviteDialog = true)}>
							<UserPlus size={16} class="mr-2" />
							Inviter
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={leaveGroup} class="text-red-600 focus:text-red-600">
							<LogOut size={16} class="mr-2" />
							Quitter le groupe
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
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
										{#each message.attachments as attachment}
											<div class="mt-2 flex flex-col items-start">
												<Button
													variant="ghost"
													href={getS3ObjectUrl(S3Bucket.GROUPS_ATTACHMENTS, attachment.id)}
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
											<div class="bg-muted mt-1 rounded-xl px-3 py-2 text-sm shadow">
												{message.content}
											</div>
										{/if}
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
											{#each message.attachments as attachment}
												<div class="mt-2 flex flex-col items-end">
													<Button
														variant="ghost"
														href={getS3ObjectUrl(S3Bucket.GROUPS_ATTACHMENTS, attachment.id)}
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
												<div
													class="bg-primary inline-block rounded-2xl px-4 py-2 text-sm text-white shadow"
												>
													{message.content}
												</div>
											{/if}
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

	{#if groupInfo}
		<div
			class="sticky bottom-0 z-20 flex items-center gap-2 border-t border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
		>
			<div
				class="max-h-32 min-h-[40px] flex-1 overflow-y-auto rounded-lg bg-white px-3 py-2 text-sm focus:outline-none dark:bg-gray-700"
				contenteditable
				placeholder="Écrivez un message au groupe"
				bind:this={inputElement}
				bind:innerText={currentMessage}
				onkeydown={handleInputKeyDown}
			></div>
			<Button
				variant="ghost"
				class="rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
				href="/chat/group/translate?groupId={currentGroupId}{aroundMessageId
					? `&aroundMessageId=${aroundMessageId}`
					: ''}"
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
							Sélectionnez un fichier à envoyer dans le groupe ({groupInfo.name}).
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
				class="rounded-md p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
				onclick={sendMessageToWs}
			>
				<Send size={20} class="text-primary" />
			</button>
		</div>
	{/if}
</div>

<!-- Members Sheet -->
<Sheet.Root bind:open={showMembersSheet}>
	<Sheet.Content side="right" class="w-80">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<Users size={20} />
				Membres du groupe ({groupInfo?.members?.length || 0})
			</Sheet.Title>
		</Sheet.Header>

		<div class="mt-6 space-y-3">
			{#if groupInfo?.members}
				{#each groupInfo.members as member (member.id)}
					<HoveredUserProfile userId={member.userId} self={member.userId === authenticatedUser.id}>
						<div class="bg-card flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center space-x-3">
								<div class="relative">
									<Avatar.Root class="size-10">
										<Avatar.Image src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, member.userId)} />
										<Avatar.Fallback>
											{fallbackAvatarLetters(member.userName)}
										</Avatar.Fallback>
									</Avatar.Root>

									<span
										class={cn(
											'absolute right-0 bottom-0 size-3 rounded-full border-2 border-white dark:border-gray-800',
											{
												'bg-green-500': member.status === PublicStatus.ONLINE,
												'bg-yellow-500': member.status === PublicStatus.AWAY,
												'bg-red-500': member.status === PublicStatus.DO_NOT_DISTURB,
												'bg-gray-500': member.status === PublicStatus.OFFLINE
											}
										)}
									/>
								</div>

								<div class="flex-1">
									<div class="flex items-center gap-2 font-medium">
										{member.userName}
										{#if member.isGroupOwner}
											<Crown size={14} class="text-yellow-500" />
										{/if}
										{#if member.id === authenticatedUser.id}
											<span class="text-muted-foreground text-xs">(Vous)</span>
										{/if}
									</div>
									<div class="text-muted-foreground text-sm">
										{member.email}
									</div>
								</div>
							</div>
						</div>
					</HoveredUserProfile>
				{/each}
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Invite Members Dialog -->
<Dialog.Root bind:open={showInviteDialog}>
	<Dialog.Content class="max-h-[80vh] max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<UserPlus size={20} />
				Inviter des membres
			</Dialog.Title>
			<Dialog.Description>
				Sélectionnez les utilisateurs que vous souhaitez inviter au groupe.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- Selected Users Count -->
			<div class="text-muted-foreground text-sm">
				{selectedUserIds.size} utilisateur{selectedUserIds.size > 1 ? 's' : ''} sélectionné{selectedUserIds.size >
				1
					? 's'
					: ''}
			</div>

			<!-- Users List -->
			<div class="max-h-96 space-y-3 overflow-y-auto pr-2">
				{#if isLoadingUsers}
					<div class="flex items-center justify-center py-8">
						<div class="text-muted-foreground text-sm">Chargement des utilisateurs...</div>
					</div>
				{:else}
					{#each allUsers as user (user.id)}
						<div
							class="bg-card hover:bg-accent/50 flex items-center space-x-3 rounded-lg border p-3 transition-colors"
							onclick={() => toggleUserSelection(user.id)}
						>
							<Checkbox checked={selectedUserIds.has(user.id)} />

							<div class="relative">
								<Avatar.Root class="size-10">
									<Avatar.Image src={getS3ObjectUrl(S3Bucket.USERS_AVATARS, user.id)} />
									<Avatar.Fallback>
										{fallbackAvatarLetters(user.firstName + ' ' + user.lastName)}
									</Avatar.Fallback>
								</Avatar.Root>

								<span
									class={cn(
										'absolute right-0 bottom-0 size-3 rounded-full border-2 border-white dark:border-gray-800',
										{
											'bg-green-500': user.status === PublicStatus.ONLINE,
											'bg-yellow-500': user.status === PublicStatus.AWAY,
											'bg-red-500': user.status === PublicStatus.DO_NOT_DISTURB,
											'bg-gray-500': user.status === PublicStatus.OFFLINE
										}
									)}
								/>
							</div>

							<div class="flex-1">
								<div class="font-medium">
									{user.firstName}
									{user.lastName}
								</div>
								<div class="text-muted-foreground text-sm">{user.email}</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (showInviteDialog = false)} disabled={isInviting}>
				Annuler
			</Button>
			<Button
				onclick={inviteMembers}
				disabled={selectedUserIds.size === 0 || isInviting}
				class="flex items-center gap-2"
			>
				{#if isInviting}
					<div
						class="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					/>
				{:else}
					<UserPlus size={16} />
				{/if}
				Inviter ({selectedUserIds.size})
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
