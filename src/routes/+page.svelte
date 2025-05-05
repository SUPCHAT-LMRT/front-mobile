<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let counter = $state(0);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div class="mx-auto h-screen w-full bg-red-400">
	<span class="text-white">coucu</span>
	<Button onclick={() => (counter += 1)}>Shadcn Click me {counter}</Button>
</div>
