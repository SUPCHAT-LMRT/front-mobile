<script lang="ts" module>
	import { type ButtonProps } from '$lib/components/ui/button';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	export type LoadingButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> &
		ButtonProps & {
			loading?: boolean;
			spinnerClass?: string;
		};
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { cn, type WithElementRef } from '$lib/utils';

	let { loading = false, children, spinnerClass, ...restProps }: LoadingButtonProps = $props();

	// Disable button when loading
	const disabled = $derived(restProps.disabled || loading);
</script>

<Button {...restProps} {disabled}>
	{@render children?.()}
	{#if loading}
		<Spinner class={cn('text-white', spinnerClass)} />
	{/if}
</Button>
