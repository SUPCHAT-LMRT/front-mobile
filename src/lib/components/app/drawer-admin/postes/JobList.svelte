<script lang="ts">
    import {Badge} from "$lib/components/ui/badge";
    import {ScrollArea} from "$lib/components/ui/scroll-area";
    import {Trash2} from "lucide-svelte";
    import {Button} from "$lib/components/ui/button";
    import {onMount} from "svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import {jobList} from "./state.svelte";
    import {writable} from "svelte/store";
    import {AxiosError} from "axios";
    import {deleteJob, type Job, listJobs} from "$lib/api/admin";

    let loading = $state(true);
    let showDeleteConfirmation = $state(false);
    let jobToDelete = $state<string | null>(null);

    let {selectedJob = $bindable()}: { selectedJob: Job | null } = $props();
    let error = writable("");

    $effect(() => {
        console.log('Liste des postes mise à jour:', jobList.jobs);
    });


    const handleJobSelect = (job: Job) => {
        selectedJob = job;
    };

    onMount(async () => {
        try {
            jobList.jobs = await listJobs();
            if (jobList.jobs.length > 0) {
                selectedJob = jobList.jobs[0];
            }
        } catch (e) {
            console.error(e);
            error.set("Erreur lors du chargement des postes.");
            if (e instanceof AxiosError) {
                if (e.response?.status === 403) {
                    error.set("Vous n'avez pas la permission de voir les postes.");
                } else if (e.response?.status === 404) {
                    error.set("Espace de travail introuvable.");
                } else {
                    error.set("Erreur inconnue lors du chargement des postes.");
                }
            } else {
                error.set("Erreur inconnue lors du chargement des postes.");
            }
        } finally {
            loading = false;
        }
    });

    const handleDeleteJob = (jobId: string, event: Event) => {
        event.stopPropagation();
        jobToDelete = jobId;
        showDeleteConfirmation = true;
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;

        try {
            await deleteJob(jobToDelete);
            jobList.jobs = jobList.jobs.filter(job => job.id !== jobToDelete);

            if (selectedJob && selectedJob.id === jobToDelete) {
                selectedJob = jobList.jobs.length > 0 ? jobList.jobs[0] : null;
            }
        } catch (error) {
            console.error("Erreur lors de la suppression du poste :", error);
        } finally {
            showDeleteConfirmation = false;
            jobToDelete = null;
        }
    };

    const cancelDeleteJob = () => {
        showDeleteConfirmation = false;
        jobToDelete = null;
    };
</script>

<ScrollArea class="h-[400px] pr-4">
    <div class="space-y-2">
        {#if loading}
            <p>Chargement des postes...</p>
        {:else if jobList.jobs.length === 0}
            <p>Aucun poste disponible.</p>
        {:else}
            {#each jobList.jobs as job}
                <button
                        type="button"
                        class="w-full flex items-center justify-between rounded-md p-2 text-left cursor-pointer transition
                           {selectedJob?.id === job.id ? 'bg-accent' : 'hover:bg-accent/50'}"
                        onclick={() => handleJobSelect(job)}
                >
                    <div class="flex items-center gap-2">
                        <Badge
                                class="text-white bg-primary max-w-[180px] truncate"
                                title={job.name}
                        >
                            {job.name}
                        </Badge>
                    </div>
                    <div class="flex gap-1">
                        <Button variant="ghost" size="icon" class="h-7 w-7"
                                onclick={(event) => handleDeleteJob(job.id, event)}>
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </div>
                </button>
            {/each}
        {/if}
    </div>
</ScrollArea>

<!-- Dialog de confirmation de suppression -->
<Dialog.Root open={showDeleteConfirmation} onOpenChange={(open) => showDeleteConfirmation = open}>
    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>Confirmer la suppression</Dialog.Title>
            <Dialog.Description>
                Êtes-vous sûr de vouloir supprimer ce poste ? Cette action est irréversible.
            </Dialog.Description>
        </Dialog.Header>
        <div class="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onclick={cancelDeleteJob}>Annuler</Button>
            <Button variant="destructive" onclick={confirmDeleteJob}>Supprimer</Button>
        </div>
    </Dialog.Content>
</Dialog.Root>
