<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FirebaseMessaging, type GetTokenResult } from '@capacitor-firebase/messaging';

	let token: GetTokenResult | null = $state(null);

	const getToken = async () => {
		token = await FirebaseMessaging.getToken();
		console.log(token.token);
	};
</script>

<Button onclick={getToken}>get token</Button>

{token?.token}
