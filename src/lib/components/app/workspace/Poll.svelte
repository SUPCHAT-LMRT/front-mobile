<script lang="ts">
	import { page } from '$app/state';
	import {
		createPoll,
		deletePoll,
		getPolls,
		unvotePoll,
		votePoll,
		type Poll
	} from '$lib/api/workspace/polls';
	import { Button } from '$lib/components/ui/button';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { notifyByLevel, success } from '$lib/toast/toast';
	import { PieChart, Text } from 'layerchart';
	import { MoreHorizontal } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	let currentWorkspaceId: string = $derived(page.url.searchParams.get('workspaceId') || '');
	let polls: Poll[] = $state([]);
	let showUnvoteConfirmation = $state(false);
	let selectedPollOption = $state({ pollId: '', optionId: '' });
	let showCreatePoll = $state(false);

	const COLORS = [
		'hsl(200, 70%, 50%)',
		'hsl(150, 70%, 50%)',
		'hsl(350, 70%, 50%)',
		'hsl(50, 70%, 50%)',
		'hsl(280, 70%, 50%)',
		'hsl(25, 70%, 50%)',
		'hsl(180, 70%, 50%)',
		'hsl(320, 70%, 50%)',
		'hsl(100, 70%, 50%)',
		'hsl(240, 70%, 50%)'
	];

	const getColor = (index: number) => COLORS[index % COLORS.length];

	// Formulaire de création de sondage
	let newQuestion = $state('');
	let newOptions: string[] = $state(['', '']);
	let newExpiresAt = $state('');

	function addOption() {
		newOptions = [...newOptions, ''];
	}

	async function submitNewPoll() {
		if (
			!currentWorkspaceId ||
			!newQuestion.trim() ||
			newOptions.length < 2 ||
			newOptions.some((opt) => !opt.trim())
		) {
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: 'Veuillez remplir tous les champs.'
			});
			return;
		}

		try {
			const isoDate = newExpiresAt ? new Date(newExpiresAt).toISOString() : undefined;
			await createPoll(currentWorkspaceId, newQuestion, newOptions, isoDate);
			polls = await getPolls(currentWorkspaceId);
			success('Sondage créé', 'Votre sondage a été créé avec succès.');
			newQuestion = '';
			newOptions = [''];
			newExpiresAt = '';
		} catch (error) {
			console.error('Erreur lors de la création du sondage :', error);
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: 'Impossible de créer le sondage.'
			});
		}
	}

	async function handle(pollId: string, optionId: string) {
		if (currentWorkspaceId) {
			try {
				await votePoll(currentWorkspaceId, pollId, optionId);
				const response = await getPolls(currentWorkspaceId);
				polls = response.map((poll) => ({
					...poll,
					options: poll.options.map((opt) => ({
						...opt
					}))
				}));
			} catch (error: any) {
				console.error('Erreur lors du vote :', error);

				if (error.response?.data?.code === 'ALREADY_VOTED') {
					notifyByLevel({
						title: 'Vote non autorisé',
						level: 'warning',
						message: 'Vous avez déjà voté pour ce sondage'
					});
				} else {
					notifyByLevel({
						title: 'Erreur',
						level: 'error',
						message: 'Une erreur est survenue lors du vote.'
					});
				}
			}
		}
	}

	async function handleVoteAction(pollId: string, optionId: string, isVoted: boolean) {
		if (!currentWorkspaceId) return;

		if (isVoted) {
			selectedPollOption = { pollId, optionId };
			showUnvoteConfirmation = true;
		} else {
			await handle(pollId, optionId);
		}
	}

	async function confirmUnvote() {
		try {
			await unvotePoll(currentWorkspaceId, selectedPollOption.pollId, selectedPollOption.optionId);
			const response = await getPolls(currentWorkspaceId);
			polls = response.map((poll) => ({
				...poll,
				options: poll.options.map((opt) => ({
					...opt
				}))
			}));
			success('Vote annulé', 'Votre vote a été annulé avec succès.');
		} catch (error) {
			console.error("Erreur lors de l'annulation du vote :", error);
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: "Une erreur est survenue lors de l'annulation du vote."
			});
		} finally {
			showUnvoteConfirmation = false;
		}
	}

	async function handleDeletePoll(pollId: string) {
		if (!currentWorkspaceId) return;

		try {
			await deletePoll(currentWorkspaceId, pollId);
			polls = await getPolls(currentWorkspaceId);
			success('Sondage supprimé', 'Le sondage a bien été supprimé.');
		} catch (error) {
			console.error('Erreur lors de la suppression :', error);
			notifyByLevel({
				title: 'Erreur',
				level: 'error',
				message: 'Une erreur est survenue lors de la suppression.'
			});
		}
	}

	function cancelUnvote() {
		showUnvoteConfirmation = false;
	}

	onMount(async () => {
		if (currentWorkspaceId) {
			polls = await getPolls(currentWorkspaceId);
		}
	});

	let showDeleteDialog = $state(false);
	let pollToDelete: Poll | null = $state(null);

	function openDeleteDialog(poll: Poll) {
		pollToDelete = poll;
		showDeleteDialog = true;
	}

	function closeDeleteDialog() {
		pollToDelete = null;
		showDeleteDialog = false;
	}
</script>

<Dialog.Root open={showUnvoteConfirmation} onOpenChange={(open) => (showUnvoteConfirmation = open)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Confirmer l'annulation du vote</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir annuler votre vote ? Cette action est définitive.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end space-x-2 pt-4">
			<Button variant="outline" onclick={cancelUnvote}>Annuler</Button>
			<Button variant="destructive" onclick={confirmUnvote}>Confirmer</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<div
	class="flex h-full w-full flex-col space-y-4 overflow-y-auto p-4 text-gray-900 dark:text-white"
>
	<div class="mb-2">
		<Button variant="outline" onclick={() => (showCreatePoll = !showCreatePoll)}>
			{showCreatePoll ? 'Réduire le formulaire' : 'Créer un sondage'}
		</Button>
	</div>

	{#if showCreatePoll}
		<div
			class="space-y-4 rounded-xl bg-white p-4 shadow-md dark:bg-gray-900"
			transition:slide={{ duration: 300, easing: cubicOut }}
		>
			<h4 class="text-xl font-semibold">Créer un sondage</h4>
			<Label for="question">Question du sondage</Label>
			<Input
				id="question"
				bind:value={newQuestion}
				placeholder="Ex : Quel est votre langage préféré ?"
				class="py-2 text-sm"
			/>

			<div class="space-y-2">
				<Label class="text-sm">Question</Label>
				<Input class="py-2 text-sm" bind:value={newQuestion} placeholder="Ex : Langage préféré ?" />

				{#each newOptions as option, index}
					<div class="flex items-center gap-2">
						<Input
							class="flex-1 py-2 text-sm"
							bind:value={newOptions[index]}
							placeholder={`Option ${index + 1}`}
						/>
						{#if index > 1}
							<Button
								size="icon"
								variant="ghost"
								tabindex={-1}
								onclick={() => (newOptions = newOptions.filter((_, i) => i !== index))}
							>
								❌
							</Button>
						{/if}
					</div>
				{/each}

				<Button variant="ghost" class="w-full" onclick={addOption}>+ Ajouter une option</Button>
			</div>

			<Label for="expires">Expire le (facultatif)</Label>
			<Input id="expires" type="datetime-local" bind:value={newExpiresAt} />

			<Button onclick={submitNewPoll}>Créer le sondage</Button>
		</div>
	{/if}

	{#if polls.length === 0}
		<p>Aucun sondage pour le moment.</p>
	{:else}
		<div class="flex flex-col space-y-4">
			{#each polls as poll}
				<div
					class="space-y-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="mb-2 flex items-start justify-between">
						<h2 class="flex-1 pr-2 text-base font-semibold">{poll.question}</h2>
						<div class="flex items-center space-x-2">
							<button
								class="rounded-full p-1 transition hover:bg-gray-200 dark:hover:bg-gray-700"
								onclick={() => openDeleteDialog(poll)}
								aria-label="Options"
							>
								<MoreHorizontal class="text-muted-foreground h-4 w-4" />
							</button>
						</div>
					</div>
					<div class="flex flex-col space-y-2">
						{#each poll.options as option}
							<button
								class={`relative flex items-center justify-between overflow-hidden rounded
                                px-3 py-2
                                ${
																	option.is_voted
																		? 'bg-transparent'
																		: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
																}
                                w-full transition-colors`}
								onclick={() => handleVoteAction(poll.id, option.id, option.is_voted)}
							>
								<div
									class={`absolute inset-0 transition-transform duration-500 ease-out
                                ${option.is_voted ? 'translate-x-0' : '-translate-x-full'}
                                bg-primary`}
								></div>
								<span class="relative z-10 text-sm">{option.text}</span>
								<span
									class={`relative z-10 text-xs font-medium ${
										option.is_voted ? 'text-primary-foreground' : 'text-gray-600 dark:text-gray-300'
									}`}
								>
									{option.votes} vote{option.votes > 1 ? 's' : ''}
								</span>
							</button>
						{/each}
					</div>

					{#if poll.options.some((opt) => opt.is_voted)}
						<!-- VERSION MOBILE COMPACTE -->
						<div class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
							<h3 class="mb-3 text-center text-sm font-medium">Résultats</h3>

							<!-- Graphique compact avec légende séparée -->
							<div class="flex flex-col items-center gap-4 sm:flex-row">
								<!-- Graphique circulaire plus petit -->
								<div class="flex-shrink-0">
									<Chart.Container config={{}} class="h-20 w-20">
										<PieChart
											data={poll.options.map((opt, index) => ({
												option: opt.text,
												votes: opt.votes,
												color: getColor(index)
											}))}
											key="option"
											value="votes"
											cRange={poll.options.map((_, index) => getColor(index))}
											c="color"
											innerRadius={30}
											props={{
												pie: { motion: 'tween' }
											}}
										>
											{#snippet aboveMarks()}
												<Text
													value={String(poll.options.reduce((acc, opt) => acc + opt.votes, 0))}
													textAnchor="middle"
													verticalAnchor="middle"
													class="fill-foreground text-sm font-bold"
													dy={-2}
												/>
												<Text
													value="total"
													textAnchor="middle"
													verticalAnchor="middle"
													class="fill-muted-foreground text-xs"
													dy={10}
												/>
											{/snippet}
											{#snippet tooltip()}
												<Chart.Tooltip hideLabel indicator="line" />
											{/snippet}
										</PieChart>
									</Chart.Container>
								</div>

								<!-- Légende compacte à côté -->
								<div class="min-w-0 flex-1">
									<div class="space-y-1">
										{#each poll.options as option, index}
											{#if option.votes > 0}
												<div class="flex items-center gap-2 text-xs">
													<div
														class="h-3 w-3 flex-shrink-0 rounded-full"
														style="background-color: {getColor(index)}"
													></div>
													<span class="flex-1 truncate font-medium">
														{option.text}
													</span>
													<span class="font-semibold text-gray-600 dark:text-gray-300">
														{option.votes}
													</span>
												</div>
											{/if}
										{/each}
									</div>

									<!-- Pourcentages en dessous -->
									<div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-600">
										{#each poll.options as option, index}
											{#if option.votes > 0}
												{@const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes, 0)}
												{@const percentage =
													totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}
												<div
													class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
												>
													<span class="truncate pr-2"
														>{option.text.slice(0, 15)}{option.text.length > 15 ? '...' : ''}</span
													>
													<span class="font-medium">{percentage}%</span>
												</div>
											{/if}
										{/each}
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root open={showDeleteDialog} onOpenChange={(open) => (showDeleteDialog = open)}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Supprimer le sondage</Dialog.Title>
			<Dialog.Description>
				Êtes-vous sûr de vouloir supprimer ce sondage ? Cette action est irréversible.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex justify-end space-x-2 pt-4">
			<Button variant="outline" onclick={closeDeleteDialog}>Annuler</Button>
			<Button
				variant="destructive"
				onclick={async () => {
					if (pollToDelete) {
						await handleDeletePoll(pollToDelete.id);
						closeDeleteDialog();
					}
				}}
			>
				Supprimer
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
