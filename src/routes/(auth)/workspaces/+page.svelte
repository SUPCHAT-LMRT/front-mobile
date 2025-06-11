<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { type Channel, type Workspace } from '$lib/api/workspace/workspace';
	import ws from '$lib/api/ws';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { error } from '$lib/toast/toast';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { Hash, Lock, Plus, User } from '@lucide/svelte';
	import { AxiosError } from 'axios';
	import { Settings, UserPlus } from 'lucide-svelte';
	import { currentWorkspaceState } from './currentWorkspace.svelte';
	import InviteMemberDialog from '$lib/components/app/workspace/InviteMemberDialog.svelte';
	import {
		createWorkspaceChannel,
		listWorkspaceChannels,
		listWorkspacePrivateChannels
	} from '$lib/api/workspace/channels';
	import CreateChannelDialog from '$lib/components/app/workspace/CreateChannelDialog.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import General from '$lib/components/app/workspace/workspaceSettings/general/General.svelte';
	import Poll from '$lib/components/app/workspace/Poll.svelte';


	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);
	let publicChannels: Channel[] = $state([]);
	let privateChannels: Channel[] = $state([]);
	let forceRenderBanner = $state(Date.now());
	let forceRenderIcon = $state(Date.now());
	let createChannelData = $state({
		dialogOpen: false,
		name: '',
		topic: '',
		isPrivate: false,
		members: [] as string[]
	});

	$effect(() => {
		const fetchWorkspaceChannels = async () => {
			if (!workspace?.id) return;
			try {
				publicChannels = await listWorkspaceChannels(workspace.id);
			} catch (e) {
				if (e instanceof AxiosError) {
					if (e.response?.status === 404) {
						return;
					}
				}
				console.error('Erreur lors de la récupération des salons du workspace:', e);
				error('Erreur', 'Impossible de récupérer les salons du workspace');
				publicChannels = [];
			}
		};

		$effect(() => {
			return ws.subscribe("workspace-updated", (msg) => {
				if (msg.workspaceId === workspace?.id) {
					workspace = {
						...workspace!,
						name: msg.name,
						topic: msg.topic,
						type: msg.type
					};
					forceRenderBanner = Date.now();
					forceRenderIcon = Date.now();
				}
			});
		});

		const fetchWorkspacePrivateChannels = async () => {
			if (!workspace?.id) return;
			try {
				privateChannels = await listWorkspacePrivateChannels(workspace.id);
			} catch (e) {
				if (e instanceof AxiosError) {
					if (e.response?.status === 404) {
						return;
					}
				}
				console.error('Erreur lors de la récupération des salons du workspace:', e);
				error('Erreur', 'Impossible de récupérer les salons du workspace');
				privateChannels = [];
			}
		};

		fetchWorkspaceChannels();
		fetchWorkspacePrivateChannels();
	});

	const createChannel = async () => {
		if (!workspace?.id) {
			error('Erreur', 'Aucun workspace sélectionné');
			return;
		}

		try {
			await createWorkspaceChannel(
				workspace.id,
				createChannelData.name,
				createChannelData.topic,
				createChannelData.isPrivate,
				createChannelData.members
			);
			createChannelData = {
				dialogOpen: false,
				name: '',
				topic: '',
				isPrivate: false,
				members: []
			};
		} catch (e) {
			if (e instanceof AxiosError) {
				error('Erreur', e.response?.data?.displayError);
			}
		}
	};

	// $effect to send the selectWorkspace message to the server when the workspace changes
	$effect(() => {
		if (!workspace) return;
		ws.selectWorkspace(workspace.id);

		return () => {
			ws.unselectWorkspace();
		};
	});

	$effect(() => {
		if (!workspace) return;
		// Subscribe to channel updates
		const unsubscribeChannelCreated = ws.subscribe('channel-created', (msg) => {
			const channelCreated = msg.channel as Channel;
			if (channelCreated.workspaceId !== workspace.id) return; // This is not supposed to happen but just in case (because it's handled by the server)
			if (channelCreated.isPrivate) {
				privateChannels.push(channelCreated);
			} else {
				publicChannels.push(channelCreated);
			}
		});

		return () => {
			unsubscribeChannelCreated();
		};
	});
</script>

{#if workspace}
	<div class="bg-background w-full h-full overflow-y-auto">
		<div class="bg-muted relative h-40 w-full">
			<img
				src="{getS3ObjectUrl(
              S3Bucket.WORKSPACES_BANNERS,
              workspace.id,
            )}?{forceRenderBanner}"
				alt=""
				class="w-full h-full mb-6 object-cover"
			/>

			<div class="absolute -bottom-12 flex w-full items-center justify-between px-6">
				<div class="flex items-center gap-4">
					{#key workspace}
						<Avatar.Root class="border-background size-24 border-4 bg-gray-200 shadow-sm">
							<Avatar.Image
								src="{getS3ObjectUrl(
                    S3Bucket.WORKSPACES_ICONS,
                    workspace.id,
                  )}?{forceRenderIcon}"
								alt={`Workspace ${workspace.id}`}
								class="rounded-full"
							/>
							<Avatar.Fallback class="bg-primary rounded-full text-white">
								{fallbackAvatarLetters(workspace.name)}
							</Avatar.Fallback>
						</Avatar.Root>
					{/key}
				</div>
			</div>

			<div class="mt-12 flex flex-col gap-y-4 px-10">
				<div class="mb-3 flex items-center justify-between">
					<h1 class="text-2xl font-bold">{workspace.name}</h1>
					<div class="flex gap-2">
						<Button variant="outline" class="flex items-center gap-2">
							<UserPlus size={18} />
							<span class="inline sm:hidden"><InviteMemberDialog workspaceId={workspace.id} /></span
							>
						</Button>
						<Button
							href="/workspaces/settings?workspaceId={workspace.id}"
							variant="outline"
							class="flex items-center gap-2"
						>
							<Settings size={18} />
							<span class="hidden sm:inline">Paramètres</span>
						</Button>
					</div>
				</div>

				<div class="mx-auto w-full max-w-4xl flex-1">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<h2 class="flex items-center gap-x-2 text-xl font-semibold">
								<User size={14} class="text-muted-foreground ml-1" />
								Salons publics
							</h2>
						</div>

						<Button
							variant="outline"
							size="sm"
							class="flex items-center gap-1"
							onclick={() => {
								createChannelData.dialogOpen = true;
								createChannelData.isPrivate = false;
								createChannelData.members = [];
							}}
						>
							<Plus size={16} class="text-primary" />
							<span>Créer un salon</span>
						</Button>
					</div>

					<Separator class="mb-2" />

					<div class="space-y-1">
						{#each publicChannels as channel}
							<a
								href="/workspaces/channels?workspaceId={workspace.id}&channelId={channel.id}"
								class="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left transition-colors"
							>
								<Hash size={18} class="text-primary translate-y-0.5" />
								<span>{channel.name}</span>
							</a>
						{:else}
							<p class="text-muted-foreground">Aucun salon public disponible</p>
						{/each}
					</div>
				</div>

				<div class="mx-auto w-full max-w-4xl flex-1">
					<div class="mb-4 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<h2 class="flex items-center gap-x-2 text-xl font-semibold">
								<Lock size={14} class="text-muted-foreground ml-1" />
								Salons privé
							</h2>
						</div>

						<Button
							variant="outline"
							size="sm"
							class="flex items-center gap-1"
							onclick={() => {
								createChannelData.dialogOpen = true;
								createChannelData.isPrivate = true;
							}}
						>
							<Plus size={18} class="text-primary" />
							<span>Créer un salon</span>
						</Button>
					</div>

					<Separator class="mb-2" />

					<div class="space-y-1">
						{#each privateChannels as channel}
							<button
								class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors"
							>
								<Hash size={18} class="text-primary" />
								<span>{channel.name}</span>
							</button>
						{:else}
							<p class="text-muted-foreground">Aucun salon disponible</p>
						{/each}
					</div>
				</div>
			</div>
			<div class="flex items-center justify-center">
				<Drawer.Root shouldScaleBackground={true}>
					<Drawer.Trigger>
						<Button
							class="bg-primary/90 hover:bg-primary mb-20 flex w-full items-center justify-center gap-4 rounded-lg py-4 text-base font-medium text-white shadow-sm transition-all duration-300 hover:shadow-md"
						>
							Sondages
						</Button>
					</Drawer.Trigger>
					<Drawer.Portal>
						<Drawer.Overlay class="fixed inset-0 bg-black/40">
							<Drawer.Content class="min-h-[96%]">
								<Drawer.Header>
									<div class="flex items-center gap-2">
										<Drawer.Title>Sondages</Drawer.Title>
										<Drawer.Description class="flex flex-col gap-1">
											<Drawer.NestedRoot setBackgroundColorOnScale={false}>
												<Drawer.Trigger>
													<div class="text-lg font-semibold"></div>
												</Drawer.Trigger>
												<Drawer.Portal>
													<Drawer.Overlay class="fixed inset-0 bg-black/40" />
												</Drawer.Portal>
											</Drawer.NestedRoot>
											- Sondages disponibles pour ce workspace
										</Drawer.Description>
									</div>
								</Drawer.Header>
								<div class="px-5 overflow-y-auto mb-2">
									<Poll />
								</div>
							</Drawer.Content>
						</Drawer.Overlay>
					</Drawer.Portal>
				</Drawer.Root>
			</div>
		</div>
	</div>

	<CreateChannelDialog {createChannelData} {createChannel} workspaceId={workspace.id} />
{/if}
