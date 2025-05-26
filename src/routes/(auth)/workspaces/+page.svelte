<script lang="ts">
	import { page } from '$app/state';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import { getWorkspace, type Workspace } from '$lib/api/workspace/workspace';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { error } from '$lib/toast/toast';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { Hash, Lock, Plus, Volume2 } from '@lucide/svelte';
	import { Settings, UserPlus } from 'lucide-svelte';

	const workspaceId: string = $derived(page.url.searchParams.get('workspaceId') || '');
	let workspace: Workspace | null = $state(null);

	$effect(() => {
		const fetchWorkspace = async () => {
			if (workspaceId) {
				try {
					workspace = await getWorkspace(workspaceId);
				} catch (e) {
					console.error('Erreur lors de la récupération du workspace:', e);
					error('Erreur', 'Impossible de récupérer les informations du workspace');
					workspace = null;
				}
			}
		};

		fetchWorkspace();
	});

	// Simulons des salons
	const channels = $state([
		{ id: '1', name: 'général', type: 'text' },
		{ id: '2', name: 'annonces', type: 'text', private: true },
		{ id: '3', name: 'salon-vocal', type: 'voice' },
		{ id: '4', name: 'off-topic', type: 'text' }
	]);
</script>

{#if workspace}
	<div class="bg-background flex h-full w-full flex-col">
		<div class="bg-muted relative h-40 w-full">
			<img
				src={getS3ObjectUrl(S3Bucket.WORKSPACES_BANNERS, workspace.id)}
				alt={`${workspace.name} banner`}
				class="h-full w-full object-cover"
			/>

			<div class="absolute -bottom-12 flex w-full items-center justify-between px-6">
				<div class="flex items-center gap-4">
					<Avatar.Root class="border-background h-24 w-24 border-4 shadow-sm">
						<Avatar.Image src={getS3ObjectUrl(S3Bucket.WORKSPACES_ICONS, workspace.id)} />
						<Avatar.Fallback class="bg-primary rounded-full text-white">
							{fallbackAvatarLetters(workspace.name)}
						</Avatar.Fallback>
					</Avatar.Root>
				</div>
			</div>

			<div class="h-16"></div>

			<div class="px-10">
				<div class="mb-3 flex justify-between">
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
			</div>
		</div>

		<div class="mx-auto mt-24 w-full max-w-4xl flex-1 p-6 px-10">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<h2 class="text-xl font-semibold">Salons</h2>
					<span class="text-muted-foreground text-sm">{channels.length}</span>
				</div>

				<Button variant="outline" size="sm" class="flex items-center gap-1">
					<Plus size={16} />
					<span>Créer un salon</span>
				</Button>
			</div>

			<Separator class="mb-4" />

			<div class="mt-2 space-y-1">
				{#each channels as channel}
					<button
						class="hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors"
					>
						{#if channel.type === 'text'}
							<Hash size={18} class="text-primary" />
						{:else}
							<Volume2 size={18} class="text-primary" />
						{/if}
						<span>{channel.name}</span>
						{#if channel.private}
							<Lock size={14} class="text-muted-foreground ml-1" />
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
