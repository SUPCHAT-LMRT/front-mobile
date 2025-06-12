<script lang="ts">
    import { onMount } from "svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import { listAllUsers, type User } from "$lib/api/user";
    import { getJobForUser, type Job } from "$lib/api/admin";
    import { assignJob, unassignJob } from "$lib/api/admin";
    import { ScrollArea } from "$lib/components/ui/scroll-area";


    let users: User[] = [];
    let loading = true;

    let isOpen = false;
    let selectedUser: (User & { jobs?: Job[] }) | null = null;

    onMount(async () => {
        try {
            const data = await listAllUsers();
            users = data;
        } catch (error) {
            console.error("Erreur lors de la récupération des utilisateurs :", error);
        } finally {
            loading = false;
        }
    });

    async function handleUserClick(user: User) {
        selectedUser = user;
        isOpen = true;

        try {
            const jobsData = await getJobForUser(user.id);
            console.log("Jobs pour l'utilisateur :", user.firstName, user.lastName, jobsData);
            selectedUser = {
                ...user,
                jobs: jobsData.jobs.map(job => ({
                    ...job,
                    isAssigned: job.is_assigned
                }))
            };
        } catch (error) {
            console.error("Erreur lors de la récupération des jobs :", error);
        }
    }

    async function handleAssignJob(jobId: string) {
        if (!selectedUser) return;

        try {
            await assignJob(selectedUser.id, jobId);
            selectedUser = {
                ...selectedUser,
                jobs: selectedUser.jobs?.map(job =>
                    job.id === jobId ? { ...job, isAssigned: true } : job
                )
            };
        } catch (error) {
            console.error("Erreur lors de l'assignation du job :", error);
        }
    }

    async function handleUnassignJob(jobId: string) {
        if (!selectedUser) return;

        try {
            await unassignJob(selectedUser.id, jobId);
            selectedUser = {
                ...selectedUser,
                jobs: selectedUser.jobs?.map(job =>
                    job.id === jobId ? { ...job, isAssigned: false } : job
                )
            };
        } catch (error) {
            console.error("Erreur lors du retrait du job :", error);
        }
    }

    function handleOpenChange(open: boolean) {
        isOpen = open;
        console.log(selectedUser, "selectedUser");
        if (!open) selectedUser = null;
    }
</script>

<div class="space-y-4">
    <h2 class="text-xl font-semibold">Liste des utilisateurs</h2>

    {#if loading}
        <p>Chargement en cours...</p>
    {:else if users.length === 0}
        <p>Aucun utilisateur trouvé.</p>
    {:else}
        <ul>
            {#each users as user}
                <li class="border-b">
                    <button
                            class="w-full flex items-center p-2 m-1 justify-between hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            on:click={() => handleUserClick(user)}
                    >
                        <span>{user.firstName} {user.lastName}</span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<Dialog.Root bind:open={isOpen} onOpenChange={handleOpenChange}>
    <Dialog.Overlay class="fixed inset-0 bg-black/30" />
    <Dialog.Content class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-[90vw] max-w-lg">
        <Dialog.Title class="text-xl font-semibold">Détails de l'utilisateur</Dialog.Title>
        {#if selectedUser}
            <div class="mt-4 space-y-2">
                <p><strong>Prénom :</strong> {selectedUser.firstName}</p>
                <p><strong>Nom :</strong> {selectedUser.lastName}</p>
                <p><strong>Email :</strong> {selectedUser.email}</p>
            </div>

            {#if selectedUser.jobs && selectedUser.jobs.length > 0}
                <div class="mt-4 space-y-2">
                    <h3 class="font-medium text-lg">Postes disponibles</h3>
                    <ScrollArea class="h-[300px] pr-4">
                        <ul class="space-y-2">
                            {#each selectedUser.jobs as job}
                                <li class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
                                    <span>{job.name}</span>
                                    <button
                                            on:click={() =>
                                        job.isAssigned
                                            ? handleUnassignJob(job.id)
                                            : handleAssignJob(job.id)
                                    }
                                            class="px-3 py-1 text-sm rounded-md
                                        {job.isAssigned
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-primary text-white hover:bg-[#4B7986]'}"
                                    >
                                        {job.isAssigned ? 'Désassigner' : 'Assigner'}
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    </ScrollArea>
                </div>
            {/if}
        {/if}
    </Dialog.Content>
</Dialog.Root>
