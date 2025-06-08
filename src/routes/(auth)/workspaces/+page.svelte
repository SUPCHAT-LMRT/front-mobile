<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import {
		createWorkspaceChannel,
		listWorkspaceChannels,
		listWorkspacePrivateChannels
	} from '$lib/api/workspace/channels';
	import { type Channel, type Workspace } from '$lib/api/workspace/workspace';
	import CreateChannelDialog from '$lib/components/app/workspace/CreateChannelDialog.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { error } from '$lib/toast/toast';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { Hash, Lock, Plus, User } from '@lucide/svelte';
	import { AxiosError } from 'axios';
	import { Settings, UserPlus } from 'lucide-svelte';
	import { currentWorkspaceState } from './currentWorkspace.svelte';

	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);
	let publicChannels: Channel[] = $state([]);
	let privateChannels: Channel[] = $state([]);
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
</script>

{#if workspace}
	<div class="bg-background flex h-full w-full flex-col">
		<div class="bg-muted relative h-40 w-full">
			<img
				src={getS3ObjectUrl(S3Bucket.WORKSPACES_BANNERS, workspace.id)}
				alt="{workspace.name} banner"
				class="h-full w-full object-cover"
			/>

			<div class="absolute -bottom-12 flex w-full items-center justify-between px-6">
				<div class="flex items-center gap-4">
					{#key workspace}
						<Avatar.Root class="border-background size-24 border-4 bg-gray-200 shadow-sm">
							<Avatar.Image src={getS3ObjectUrl(S3Bucket.WORKSPACES_ICONS, workspace.id)} />
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
							<span class="hidden sm:inline">Inviter un membre</span>
							<span class="inline sm:hidden">Inviter</span>
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
							<span class="text-muted-foreground ml-2 text-sm">{publicChannels.length}</span>
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
								href="/channels?workspaceId={workspace.id}&channelId={channel.id}"
								class="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left transition-colors"
							>
								<Hash size={18} class="text-primary translate-y-0.5" />
								<span>{channel.name}</span>
							</a>
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
							<span class="text-muted-foreground ml-2 text-sm">{privateChannels.length}</span>
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
							<p class="text-muted-foreground">Aucun salon privé disponible</p>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<CreateChannelDialog {createChannelData} {createChannel} workspaceId={workspace.id} />
{/if}
