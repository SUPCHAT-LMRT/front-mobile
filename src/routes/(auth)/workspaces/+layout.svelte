<script lang="ts">
	import { page } from '$app/state';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import type { User } from '$lib/api/user';
	import {
		createWorkspace,
		getWorkspace,
		listUserWorkspaces,
		updateWorkspaceIcon,
		WorkspaceType,
		type Workspace
	} from '$lib/api/workspace/workspace';
	import * as Avatar from '$lib/components/ui/avatar';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { error } from '$lib/toast/toast';
	import { cn } from '$lib/utils';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { ChevronsUpDown, Globe } from '@lucide/svelte';
	import { AxiosError } from 'axios';
	import type { AuthenticatedUserState } from '../authenticatedUser.svelte';
	import { currentWorkspaceState } from './currentWorkspace.svelte';
	import ws from '$lib/api/ws';

	const { children } = $props();
	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};
	const authenticatedUser: User = $derived(authenticatedUserState.user);

	const workspaceId: string = $derived(
		page.url.searchParams.get('workspaceId') || localStorage.getItem('workspaceId') || ''
	);
	let workspace: Workspace | null = $derived(currentWorkspaceState.workspace);

	let drawerOpen = $state(false);
	let workspaces: Workspace[] = $state([]);
	let showInput = $state(false);
	let workspaceName = $state('');
	let workspaceIconImage: File | undefined = $state(undefined);
	let type: WorkspaceType = $state(WorkspaceType.PRIVATE);
	let dialogOpen = $state(false);
	let forceRenderIcon = $state(Date.now());

	$effect(() => {
		const fetchWorkspaces = async () => {
			try {
				workspaces = await listUserWorkspaces();
			} catch (e) {
				console.error('Error fetching workspaces:', e);
				error('Erreur', 'Impossible de récupérer les espaces de travail');
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
					forceRenderIcon = Date.now();
				}
			});
		});

		const fetchCurrentWorkspace = async () => {
			if (!workspaceId) return;
			try {
				currentWorkspaceState.workspace = await getWorkspace(workspaceId);
				localStorage.setItem('workspaceId', workspaceId);
			} catch (e) {
				if (e instanceof AxiosError) {
					if (e.response?.status === 404) {
						workspace = null;
						return;
					}
				}
				console.error('Erreur lors de la récupération du workspace:', e);
				error('Erreur', 'Impossible de récupérer les informations du workspace');
				workspace = null;
			}
		};

		fetchWorkspaces();
		fetchCurrentWorkspace();
	});

	$effect(() => {
		if (!dialogOpen) {
			showInput = false;
			workspaceName = '';
			workspaceIconImage = undefined;
			type = WorkspaceType.PRIVATE;
		}
	});

	async function createNewWorkspace() {
		try {
			const workspace = await createWorkspace(workspaceName, type);
			if (workspaceIconImage) {
				await updateWorkspaceIcon(workspace.id, workspaceIconImage);
			}
			workspaces.push(workspace);
			workspaceIconImage = undefined;
			workspaceName = '';
			type = WorkspaceType.PRIVATE;
			showInput = false;
			dialogOpen = false;
		} catch (error) {
			console.error('Erreur lors de la création du workspace :', error);
		}
	}
</script>

<div class="flex h-screen flex-col gap-y-4">
	{#if page.route.id === '/(auth)/workspaces'}
		{@render workspaceSelector()}
	{/if}

	{@render children()}
</div>

{#snippet workspaceSelector()}
	<div class="pt-safe px-4">
		<div class="flex items-center justify-start gap-x-4">
			<Drawer.Root bind:open={drawerOpen}>
				<Drawer.Trigger class="flex items-center gap-x-4">
					{#if workspace}
						{#key workspace}
							<Avatar.Root class="size-12 rounded-3xl bg-gray-200">
								<Avatar.Image
									src="{getS3ObjectUrl(
                    S3Bucket.WORKSPACES_ICONS,
                    workspace.id,
                  )}?{forceRenderIcon}"
									alt={workspace.name}
									class="h-full w-full object-cover"
								/>
								<Avatar.Fallback
									class="rounded-3xl transition-all hover:scale-105 hover:rounded-2xl"
								>
									{fallbackAvatarLetters(workspace.name)}
								</Avatar.Fallback>
							</Avatar.Root>
						{/key}
						<div class="flex flex-col">
							<div class="flex items-center">
								<span>{workspace.name}</span>
								<ChevronsUpDown strokeWidth={2.5} size={16} />
							</div>
							<span class="text-muted-foreground">{workspace.topic}</span>
						</div>
					{:else}
						<Globe strokeWidth={2.5} size={16} />
						<div class="flex items-center gap-x-3">
							<span>Choisir un espace de travail</span>
							<ChevronsUpDown strokeWidth={2.5} size={16} />
						</div>
					{/if}
				</Drawer.Trigger>
				<Drawer.Content class="min-h-[96%]">
					<Drawer.Header>
						<Drawer.Title>Espaces de travail</Drawer.Title>
						<Drawer.Description>{authenticatedUser.email}</Drawer.Description>
					</Drawer.Header>

					<div class="overflow-auto">
						{#each workspaces as iteratedWorkspace (iteratedWorkspace.id)}
							<div class="flex w-full justify-between">
								<a
									href="/workspaces/?workspaceId={iteratedWorkspace.id}"
									class="avatar-link flex h-full w-full items-center gap-x-4 px-4 pb-4"
									onclick={() => (drawerOpen = false)}
								>
									<Avatar.Root
										class="h-12 w-12 rounded-3xl transition-all hover:scale-105 hover:rounded-2xl"
									>
										{#key iteratedWorkspace}
											<Avatar.Image
												src="{getS3ObjectUrl(
													S3Bucket.WORKSPACES_ICONS,
													iteratedWorkspace.id
												)}?v={Date.now()}"
												alt={iteratedWorkspace.name}
												class="h-full w-full object-cover"
											/>
										{/key}

										<Avatar.Fallback
											class="rounded-3xl transition-all hover:scale-105 hover:rounded-2xl"
										>
											{fallbackAvatarLetters(iteratedWorkspace.name)}
										</Avatar.Fallback>
									</Avatar.Root>

									<div class="flex flex-col">
										<span>{iteratedWorkspace.name}</span>
										<span class="text-muted-foreground">{iteratedWorkspace.topic}</span>
									</div>
								</a>

								{#if workspace?.id === iteratedWorkspace.id}
									<div class="flex -translate-y-2 items-center justify-center px-4">
										<div class="bg-primary size-2 rounded-full"></div>
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<Drawer.Footer class="flex w-full flex-row gap-x-2">
						<Dialog.Root bind:open={dialogOpen}>
							<Dialog.Trigger class={cn(buttonVariants(), 'w-full max-w-full shrink')}>
								Créer
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header
									class="relative flex h-full flex-col items-center justify-center text-center"
								>
									<div class="text-center">
										<Dialog.Title class="text-2xl font-bold"
											>Crée ton espace de travail</Dialog.Title
										>
										<p class="mt-2 text-sm text-gray-700">
											Ton espace de travail est l&apos;endroit où tu retrouves tes amis. Crée le
											tien et lance une discussion.
										</p>
									</div>
								</Dialog.Header>

								<div class="mt-4 space-y-4">
									{#if !showInput}
										<Button
											variant="outline"
											class="h-16 w-full justify-between border hover:bg-gray-200"
											onclick={() => (showInput = true)}
										>
											<div class="flex items-center gap-3">
												<div class="rounded-full p-2">
													<Globe class="h-6 w-6" />
												</div>
												<span class="font-medium">Créer le mien</span>
											</div>
											<div class="text-gray-400">→</div>
										</Button>
									{:else}
										<div class="w-full">
											<Input
												class="mb-4 w-full rounded-md border p-2"
												placeholder="Nom de l'espace de travail"
												bind:value={workspaceName}
											/>
											<div class="grid w-full max-w-sm items-center gap-1.5">
												<Input
													onchange={({ currentTarget }) => {
														workspaceIconImage = currentTarget.files?.[0];
													}}
													id="picture"
													type="file"
													accept="image/png, image/jpeg, image/webp"
												/>
											</div>
											<RadioGroup.Root bind:value={type} class="pt-4">
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="PRIVATE" id="r1" />
													<Label for="r1">Privé</Label>
												</div>
												<div class="flex items-center space-x-2">
													<RadioGroup.Item value="PUBLIC" id="r2" />
													<Label for="r2">Public</Label>
												</div>
											</RadioGroup.Root>
										</div>
									{/if}

									<div class="flex justify-between gap-x-4 pt-4">
										{#if showInput}
											<Button
												variant="ghost"
												class="h-10 w-max justify-start"
												onclick={() => (showInput = false)}
											>
												<div class="text-gray-400">&larr;</div>
												Retour
											</Button>

											<div class="float-end">
												<Button
													onclick={createNewWorkspace}
													class="bg-primary h-10 w-full justify-center px-6 text-white"
												>
													Créer un espace de travail
												</Button>
											</div>
										{:else}
											<div class="w-full">
												<p class="mb-2 text-sm text-gray-500">Tu as déjà une invitation ?</p>
												<Button class="h-10 w-full justify-center">
													Rejoindre un espace de travail
												</Button>
											</div>
										{/if}
									</div>
								</div>
							</Dialog.Content>
						</Dialog.Root>
						<Button variant="outline" class="w-full shrink" href="/discover">Décrouvrir</Button>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer.Root>
		</div>
	</div>
{/snippet}
