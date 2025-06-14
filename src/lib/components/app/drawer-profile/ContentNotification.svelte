<script lang="ts">
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Mail, Smartphone } from "lucide-svelte";

	let emailNotifications = $state(true);
	let pushNotifications = $state(false);


</script>

<section class="px-4 py-2 pt-8 w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl lg:max-w-2xl">
	<h2 class="text-gray-700 text-lg font-semibold mb-6 dark:text-gray-200">Notifications</h2>

	<div class="space-y-6">
		<!-- Notifications par email -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
			<div class="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
				<Mail class="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-0 flex-shrink-0" />
				<div class="min-w-0 flex-1">
					<Label for="email-notifications" class="text-sm font-medium text-gray-700 dark:text-gray-200 block">
						Notifications par email
					</Label>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
						Recevoir les notifications importantes par email
					</p>
				</div>
			</div>
			<div class="flex justify-end sm:justify-start flex-shrink-0">
				<Switch
					id="email-notifications"
					bind:checked={emailNotifications}
				/>
			</div>
		</div>

		<!-- Notifications push -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
			<div class="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
				<Smartphone class="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-0 flex-shrink-0" />
				<div class="min-w-0 flex-1">
					<Label for="push-notifications" class="text-sm font-medium text-gray-700 dark:text-gray-200 block">
						Notifications push
					</Label>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">
						Recevoir les notifications directement sur votre appareil
					</p>
				</div>
			</div>
			<div class="flex justify-end sm:justify-start flex-shrink-0">
				<Switch
					id="push-notifications"
					bind:checked={pushNotifications}
				/>
			</div>
		</div>
	</div>

	<div class="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
		<p class="text-xs text-gray-600 dark:text-gray-400">
			💡 Les modifications sont sauvegardées automatiquement. Vous pouvez modifier ces préférences à tout moment.
		</p>
	</div>
</section>