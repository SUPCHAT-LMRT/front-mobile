<script>
import { Button } from '$lib/components/ui/button/index.js';
import General from '$lib/components/app/workspace/workspaceSettings/general/General.svelte';
import * as Drawer from '$lib/components/ui/drawer/index.js';
</script>

<Drawer.Root shouldScaleBackground={true}>
	<Drawer.Trigger>
		<Button
			class="w-full py-4 mb-4 bg-primary/90 text-white hover:bg-primary transition-all duration-300 text-base font-medium rounded-lg shadow-sm hover:shadow-md flex items-center justify-center gap-2"
		>
			Général
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
							Général
						</Drawer.Description>
					</div>
				</Drawer.Header>
				<div class="px-5">
					<General />
				</div>
			</Drawer.Content>
		</Drawer.Overlay>
	</Drawer.Portal>
</Drawer.Root>