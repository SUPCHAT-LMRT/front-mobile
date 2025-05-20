<script lang="ts">
	import { page } from '$app/state';

	const { workspaceId } = page.params;
</script>

<div class="flex h-full w-full items-center justify-center">
	<p class="text-2xl font-bold">Workspace {workspaceId}</p>
</div>
