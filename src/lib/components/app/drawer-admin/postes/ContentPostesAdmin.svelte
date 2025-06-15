<script lang="ts">
    import {Button} from "$lib/components/ui/button";
    import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "$lib/components/ui/card";
    import JobCreator from "./JobCreator.svelte";
    import {Dialog, DialogContent, DialogHeader, DialogTitle} from "$lib/components/ui/dialog";
    import {AxiosError} from "axios";
    import {writable} from "svelte/store";
    import AppMembers from "./AppMembers.svelte";
    import {jobList} from "./state.svelte";
    import {createJob, type Job} from "$lib/api/admin";
    import JobList from "./JobList.svelte";

    let selectedJob: Job | null = $state(null);
    let showModal = $state(false);
    let error = writable("");

    const handleJobCreated = async (jobData: { name: string; permissions: number }) => {
        try {
            const createdJob = await createJob(jobData.name);
            jobList.jobs = [...jobList.jobs, createdJob];
            selectedJob = createdJob;
            showModal = false;
        } catch (e) {
            console.error(e);
            error.set("Erreur lors de la création du poste.");
            if (e instanceof AxiosError) {
                if (e.response?.status === 403) {
                    error.set("Vous n'avez pas la permission de créer un poste.");
                } else if (e.response?.status === 404) {
                    error.set("Espace de travail introuvable.");
                } else {
                    error.set("Erreur inconnue lors de la création du poste.");
                }
            } else {
                error.set("Erreur inconnue lors de la création du poste.");
            }
        }
    };
</script>

<div class="space-y-6 px-2">
    <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">Gestion des Postes</h2>
    </div>

    <div class="space-y-4">
        <Card class="h-full flex flex-col">
            <CardHeader class="bg-muted/50 rounded-t-xl px-6 py-4">
                <div class="flex items-center gap-3">
            <span class="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5-6l3 3-3 3"/>
                </svg>
            </span>
                    <CardTitle class="text-lg font-bold tracking-tight">Rôles et Permissions</CardTitle>
                </div>
                <CardDescription class="mt-4 text-sm text-muted-foreground space-y-3">
                    <div class="flex items-start gap-3">
                <span class="inline-block shrink-0 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5">
                    Admin
                </span>
                        <p class="leading-snug">
                            Accès complet incluant la création/suppression d'invitations, la gestion des postes,
                            l'attribution des rôles, et l'accès au panneau d'administration.
                        </p>
                    </div>
                    <div class="flex items-start gap-3">
                <span class="inline-block shrink-0 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5">
                    Manager
                </span>
                        <p class="leading-snug">
                            Accès limité au panneau d'administration et à la création d'invitations.
                        </p>
                    </div>
                    <div class="flex items-start gap-3">
                <span class="inline-block shrink-0 bg-primary text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5">
                    Utilisateur
                </span>
                        <p class="leading-snug">
                            Rôle organisationnel de base permettant d'identifier la fonction de la personne.
                        </p>
                    </div>
                </CardDescription>
            </CardHeader>
        </Card>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="md:col-span-1">
                <Card class="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Postes</CardTitle>
                        <CardDescription>
                            Gérer les postes de l'application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent class="flex-grow">
                        <JobList bind:selectedJob={selectedJob}/>
                    </CardContent>
                    <div class="p-4 flex justify-center items-center flex-grow-0">
                        <Button class="text-white w-full" onclick={() => (showModal = true)}>Créer un poste</Button>
                    </div>
                </Card>
            </div>

            <div class="md:col-span-1">
                <Card class="h-full flex flex-col">
                    <CardContent class="flex-grow">
                        <AppMembers/>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</div>

<Dialog open={showModal} onOpenChange={(open) => (showModal = open)}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Créer un nouveau poste</DialogTitle>
        </DialogHeader>
        <JobCreator onJobCreated={handleJobCreated}/>
    </DialogContent>
</Dialog>