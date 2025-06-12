<script lang="ts">
    import {Button} from "$lib/components/ui/button";
    import {Input} from "$lib/components/ui/input";
    import {Label} from "$lib/components/ui/label";

    export let onJobCreated: (role: { name: string; permissions: number;}) => void;

    let jobName = "";

    const handleCreateJob = () => {
        onJobCreated({name: jobName, permissions: 0});
        jobName = "";
    };

</script>

<div class="space-y-6">
    <div class="space-y-2">
        <Label for="role-name">Nom du poste</Label>
        <Input
                id="role-name"
                bind:value={jobName}
                placeholder="Ex: Développeur"
        />
    </div>

    <div class="pt-4">
        <Button class="text-white" onclick={handleCreateJob} disabled={!jobName.trim()}>
            Créer le poste
        </Button>
    </div>
</div>