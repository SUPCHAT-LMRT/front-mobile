<script lang="ts">
	import { page } from '$app/state';
	import Content from '$lib/components/app/drawer-profile/Content.svelte';
	import ContentUser from '$lib/components/app/drawer-profile/ContentUser.svelte';
	import Header from '$lib/components/app/drawer-profile/Header.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import { cn } from '$lib/utils';
	import { Briefcase, House, MessageSquareMore, User, type IconProps } from '@lucide/svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { Component } from 'svelte';
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import { exportUserData, statusMap } from '$lib/api/user';
	import type { AuthenticatedUserState } from './authenticatedUser.svelte';
	import { Download } from 'lucide-svelte';
	import { error, success } from '$lib/toast/toast';

	const { authenticatedUserState } = page.data as {
		authenticatedUserState: AuthenticatedUserState;
	};

	let firstName = $derived(authenticatedUserState.user.firstName);
	let lastName = $derived(authenticatedUserState.user.lastName);
	let { children } = $props();

	const handleExportData = async () => {
		try {
			await exportUserData(authenticatedUserState.user.id);
			success("Export réussi", "Vos données ont été exportées avec succès.");
		} catch (e) {
			console.error(e);
			error("Erreur", "Une erreur est survenue lors de l'exportation de vos données.");
		}
	};
</script>

<ModeWatcher />
<Toaster position="top-center" />

<div data-vaul-drawer-wrapper>
	<Tooltip.Provider delayDuration={0}>
		{@render children()}
	</Tooltip.Provider>
</div>

<div
	class="pb-safe fixed bottom-0 left-0 w-full border-t border-slate-200 bg-white px-8 py-2 dark:border-slate-700 dark:bg-slate-900"
>
	<div class="mx-auto flex items-center justify-between">
		{@render navigationIcon(MessageSquareMore, '/chat')}
		{@render navigationIcon(Briefcase, '/workspaces')}
		{@render drawer()}
	</div>
</div>

{#snippet navigationIcon(Icon: Component<IconProps>, path: string)}
	<a href={path} class="flex items-center text-slate-800 dark:text-slate-200">
		<Icon
			class="mr-2 size-6 {cn({
     'text-primary': page.url.pathname === path
    })}"
			strokeWidth={page.url.pathname === path ? 2.8 : 2}
		/>
	</a>
{/snippet}

{#snippet drawer()}
	<Drawer.Root shouldScaleBackground={true}>
		<Drawer.Trigger><User /></Drawer.Trigger>
		<Drawer.Portal>
			<Drawer.Overlay class="fixed inset-0 bg-black/40">
				<Drawer.Content class="min-h-[96%]">
					<Drawer.Header>
						<div class="flex items-center gap-2">
							<Drawer.Title><Header authenticatedUser={authenticatedUserState.user} /></Drawer.Title
							>
							<Drawer.Description class="flex flex-col gap-1">
								<Drawer.NestedRoot setBackgroundColorOnScale={false}>
									<Drawer.Trigger>
										<div class="text-lg font-semibold">{firstName} {lastName}</div>
									</Drawer.Trigger>
									<Drawer.Portal>
										<Drawer.Overlay class="fixed inset-0 bg-black/40" />
										<Drawer.Content
											class="fixed right-0 bottom-0 left-0 mt-24 flex h-full max-h-[96%] flex-col rounded-t-[10px]"
										>
											<ContentUser authenticatedUser={authenticatedUserState.user} />
										</Drawer.Content>
									</Drawer.Portal>
								</Drawer.NestedRoot>

								<div class="text-sm text-slate-500 dark:text-slate-400">
									{statusMap[authenticatedUserState.user.status]}
								</div>
							</Drawer.Description>
						</div>
					</Drawer.Header>
					<Content />
					<Drawer.Footer>
						<Button variant="outline" size="sm" class="w-full mb-2" onclick={handleExportData}>
							<Download />
							Exporter mes données
						</Button>
						<a href="/logout" class="w-full">
							<Button variant="outline" class="w-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors">Déconnexion</Button>
						</a>
					</Drawer.Footer>
				</Drawer.Content>
			</Drawer.Overlay>
		</Drawer.Portal>
	</Drawer.Root>
{/snippet}