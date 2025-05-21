<script lang="ts">
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import * as Avatar from '$lib/components/ui/avatar';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { fallbackAvatarLetters } from '$lib/utils/fallbackAvatarLetters';
	import { ChevronsUpDown } from '@lucide/svelte';

	const { children } = $props();
	let drawerOpen = $state(false);
</script>

<div class="flex items-center justify-start gap-x-4">
	<Drawer.Root bind:open={drawerOpen}>
		<Drawer.Trigger class="flex items-center gap-x-4">
			<Avatar.Root class="h-12 w-12 rounded-3xl transition-all hover:scale-105 hover:rounded-2xl">
				<!-- {#key workspace} -->
				<Avatar.Image
					src="{getS3ObjectUrl(S3Bucket.WORKSPACES_ICONS, 'workspace.id')}?v={Date.now()}"
					alt="workspace.name"
					class="h-full w-full object-cover"
				/>
				<!-- {/key} -->

				<Avatar.Fallback class="rounded-3xl transition-all hover:scale-105 hover:rounded-2xl">
					{fallbackAvatarLetters('workspace.name')}
				</Avatar.Fallback>
			</Avatar.Root>
			<div class="flex flex-col">
				<div class="flex items-center gap-x-3">
					<span>workspace.name</span>
					<ChevronsUpDown strokeWidth={2.5} size={16} />
				</div>
				<span class="text-muted-foreground">monadressemail@mail.com</span>
			</div>
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Espaces de travail</Drawer.Title>
				<Drawer.Description>monadressemail@mail.com</Drawer.Description>
			</Drawer.Header>

			<a
				href="/workspaces/?workspaceId=workspace.id"
				class="avatar-link flex h-full w-full items-center gap-x-4 px-4 pb-4"
				onclick={() => (drawerOpen = false)}
			>
				<Avatar.Root class="h-12 w-12 rounded-3xl transition-all hover:scale-105 hover:rounded-2xl">
					<!-- {#key workspace} -->
					<Avatar.Image
						src="{getS3ObjectUrl(S3Bucket.WORKSPACES_ICONS, 'workspace.id')}?v={Date.now()}"
						alt="workspace.name"
						class="h-full w-full object-cover"
					/>
					<!-- {/key} -->

					<Avatar.Fallback class="rounded-3xl transition-all hover:scale-105 hover:rounded-2xl">
						{fallbackAvatarLetters('workspace.name')}
					</Avatar.Fallback>
				</Avatar.Root>

				<div class="flex flex-col">
					<span>workspace.name</span>
					<span class="text-muted-foreground">jsp un texte</span>
				</div>
			</a>

			<Drawer.Footer class="flex w-full flex-1 flex-row gap-x-2">
				<Button class="w-full shrink">Créer</Button>
				<Button variant="outline" class="w-full shrink" href="/discover">Décrouvrir</Button>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
</div>

{@render children()}
