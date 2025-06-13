<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator";

	let selectedDuration: string | null = null;

	function selectDuration(duration: string) {
		selectedDuration = duration;
	}

	function resumeNotifications() {
		selectedDuration = null;
	}

	$: buttonText = selectedDuration
		? `Reprendre les notifications (suspendu ${selectedDuration})`
		: "Reprendre les notifications";

	$: isNotificationsSuspended = selectedDuration !== null;
</script>

<div class="space-y-6 px-2">
	<div class="flex justify-between items-center">
		<h2 class="text-xl font-semibold text-gray-700">Gestion des invitations</h2>
	</div>

	<Button
		variant="option"
		size="sm"
		class="text-gray-800 justify-start w-full focus:outline-none focus:ring-0"
		onclick={resumeNotifications}
		disabled={!isNotificationsSuspended}
	>
		{buttonText}
	</Button>

	<Separator class="my-2" />

	<div class="space-y-2">
		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start w-full focus:outline-none focus:ring-0"
			onclick={() => selectDuration("30 minutes")}
		>
			30 minutes
		</Button>
		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start w-full focus:outline-none focus:ring-0"
			onclick={() => selectDuration("1 heure")}
		>
			1 heure
		</Button>
		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start w-full focus:outline-none focus:ring-0"
			onclick={() => selectDuration("2 heures")}
		>
			2 heures
		</Button>
		<Button
			variant="option"
			size="sm"
			class="text-gray-800 justify-start w-full focus:outline-none focus:ring-0"
			onclick={() => selectDuration("Jusqu'à demain")}
		>
			Jusqu'à demain
		</Button>
	</div>
</div>