<script lang="ts">
	import ModeButton from '$lib/components/buttons/ModeButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import { FirebaseMessaging } from '@capacitor-firebase/messaging';
	import Chart1 from './Chart1.svelte';

	let token: string | null = $state(null);

	const getToken = async () => {
		const resultToken = await FirebaseMessaging.getToken();
		token = resultToken.token;
		console.log(token);
	};
</script>

<div class="pt-safe px-4">
	<div class="mb-2 flex w-full justify-center gap-x-4">
		<Button onclick={getToken}>get token</Button>
		<ModeButton />
	</div>

	{#if token}
		<p class="text-center text-sm text-slate-500 dark:text-slate-400">
			Token: {token}
		</p>
	{/if}

	<div class="mt-4">
		<Chart1 />
	</div>
</div>
