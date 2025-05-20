<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FirebaseMessaging, type GetTokenResult } from '@capacitor-firebase/messaging';
	import Chart1 from './Chart1.svelte';

	let token: GetTokenResult | null = $state(null);

	const getToken = async () => {
		token = await FirebaseMessaging.getToken();
		console.log(token.token);
	};
</script>

<Button onclick={getToken}>get token</Button>

{token?.token}

<Chart1 />
