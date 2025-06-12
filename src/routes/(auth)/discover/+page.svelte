<script lang="ts">
	import { goto } from '$app/navigation';
	import { getS3ObjectUrl, S3Bucket } from '$lib/api/s3';
	import {
		joinWorkspace,
		listWorkspaceDiscover,
		type WorkspaceDiscover
	} from '$lib/api/workspace/discover';
	import { LoadingButton } from '$lib/components/ui/loading-button';
	import { error, success } from '$lib/toast/toast';
	import { AxiosError } from 'axios';

	let workspaces: WorkspaceDiscover[] = $state([]);
	let joinLoadingWorkspaces: string[] = $state([]);

	$effect(() => {
		const fetchWorkspaces = async () => {
			try {
				workspaces = await listWorkspaceDiscover();
			} catch (err) {
				console.error('Error fetching workspaces:', err);
				if (err instanceof AxiosError) {
					error(
						'Erreur',
						err.response?.data.displayError ??
							err.response?.data.message ??
							err.response?.data.error
					);
					return;
				}
			}
		};

		fetchWorkspaces();
	});

	const handleJoinWorkspace = async (workspaceId: string) => {
		joinLoadingWorkspaces.push(workspaceId);
		try {
			await joinWorkspace(workspaceId);
			success('Succès', "Vous avez rejoint l'espace de travail avec succès.");
			goto(`/workspaces/${workspaceId}`);
		} catch (e) {
			if (e instanceof AxiosError) {
				error('Erreur', e.response?.data.displayError ?? e.response?.data.error);
				return;
			}

			error(
				'Erreur',
				"Une erreur s'est produite lors de la tentative de rejoindre l'espace de travail."
			);
		} finally {
			joinLoadingWorkspaces = joinLoadingWorkspaces.filter((id) => id !== workspaceId);
		}
	};
</script>

<div class="flex h-full w-full flex-col dark:bg-gray-800 overflow-y-auto pb-12">
	<div class="from-primary bg-gradient-to-r from-50% to-[#94bfc9] px-8 py-16 text-white">
		<div class="mx-auto max-w-6xl">
			<h1 class="mb-6 text-5xl font-extrabold tracking-wide uppercase">
				Espace de travail
				<br />
				publics
				<br />
				DE SUPCHAT-LMRT
			</h1>
			<p class="max-w-2xl text-lg text-gray-300">
				Découvrez des serveurs publics de la communauté SUPCHAT-LMRT. Rejoignez des serveurs qui
				vous intéressent et connectez-vous avec d'autres membres de la communauté.
			</p>
		</div>
	</div>

	<div class="flex flex-col gap-y-4 px-8 py-8">
		{#each workspaces as workspace}
			<div class="overflow-hidden rounded-lg bg-slate-100 shadow-md dark:bg-[#2a2a2a]">
				<div class="relative h-40 overflow-hidden">
					<img
						src="{getS3ObjectUrl(S3Bucket.WORKSPACES_BANNERS, workspace.id)}?{Date.now()}"
						onerror={function () {
							this.style.display = 'none';
						}}
						alt="Workspace banner {workspace.name}"
						class="h-full w-full object-cover"
					/>
				</div>
				<div class="flex flex-col justify-between p-4">
					<div>
						<div class="mb-3 flex items-center">
							<div
								class="relative mr-3 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-50 dark:bg-gray-700"
							>
								<img
									src="{getS3ObjectUrl(S3Bucket.WORKSPACES_ICONS, workspace.id)}?{Date.now()}"
									alt="Workspace icon {workspace.name}"
									class="h-full rounded object-cover"
								/>
							</div>
							<h3 class="text-lg font-semibold dark:text-white">
								{workspace.name}
							</h3>
						</div>

						<p class="mb-4 min-h-[80px] text-sm text-gray-600 dark:text-gray-400">
							{workspace.topic || 'Pas de description fournie.'}
						</p>
					</div>

					<div class="flex flex-col gap-y-4">
						<div class="flex items-center text-xs text-gray-600 dark:text-gray-400">
							<div class="mr-4 flex items-center">
								<div class="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
								<span>{workspace.onlineMembersCount} en ligne</span>
							</div>
							<div class="flex items-center">
								<span>{workspace.membersCount} membres</span>
							</div>
						</div>
						<LoadingButton
							class="w-full"
							onclick={() => handleJoinWorkspace(workspace.id)}
							loading={joinLoadingWorkspaces.includes(workspace.id)}
						>
							Rejoindre
						</LoadingButton>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
