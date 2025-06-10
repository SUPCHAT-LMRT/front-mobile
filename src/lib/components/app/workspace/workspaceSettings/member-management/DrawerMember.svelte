<script lang="ts">
	import type { Workspace } from '$lib/api/workspace/workspace';
	import MemberManagement from '$lib/components/app/workspace/workspaceSettings/member-management/MemberManagement.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';

	const { workspace }: { workspace: Workspace } = $props();
</script>

<Drawer.Root shouldScaleBackground={true}>
	<Drawer.Trigger>
		<Button
			class="bg-primary/90 hover:bg-primary mb-4 flex w-full items-center justify-center gap-2 rounded-lg py-4 text-base font-medium text-white shadow-sm transition-all duration-300 hover:shadow-md"
		>
			Gestion des Membres
		</Button>
	</Drawer.Trigger>
	<Drawer.Portal>
		<Drawer.Overlay class="fixed inset-0 bg-black/40">
			<Drawer.Content class="min-h-[96%]">
				<Drawer.Header>
					<div class="flex items-center gap-2">
						<Drawer.Title>Paramètres</Drawer.Title>
						<Drawer.Description class="flex flex-col gap-1">
							<Drawer.NestedRoot setBackgroundColorOnScale={false}>
								<Drawer.Trigger>
									<div class="text-lg font-semibold"></div>
								</Drawer.Trigger>
								<Drawer.Portal>
									<Drawer.Overlay class="fixed inset-0 bg-black/40" />
								</Drawer.Portal>
							</Drawer.NestedRoot>
							Gestion des Membres
						</Drawer.Description>
					</div>
				</Drawer.Header>
				<div class="px-5">
					<MemberManagement {workspace} />
				</div>
			</Drawer.Content>
		</Drawer.Overlay>
	</Drawer.Portal>
</Drawer.Root>
