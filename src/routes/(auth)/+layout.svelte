<script lang="ts">
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner';
	import { cn } from '$lib/utils';
	import { Briefcase, House, MessageSquareMore, User, type IconProps } from '@lucide/svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { Component } from 'svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Toaster position="top-center" />

<div data-vaul-drawer-wrapper>
	{@render children()}
</div>

<div
	class="pb-safe fixed bottom-0 left-0 w-full border-t border-slate-200 bg-white px-8 py-2 dark:border-slate-700 dark:bg-slate-900"
>
	<div class="mx-auto flex items-center justify-between">
		{@render navigationIcon(House, '/')}
		{@render navigationIcon(MessageSquareMore, '/chat')}
		{@render navigationIcon(Briefcase, '/workspaces')}
		{@render navigationIcon(User, '/user')}
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
