<script lang="ts">
    import {Button} from "$lib/components/ui/button";
    import {Input} from "$lib/components/ui/input";
    import {Label} from "$lib/components/ui/label";
    import HexColorPicker from '$lib/components/app/workspace/HexColorPicker.svelte';


    export let onRoleCreated: (role: { name: string; permissions: number; color: string }) => void;

    let roleName = "";
    let roleColor = "#6366f1";

    const handleCreateRole = () => {
        onRoleCreated({name: roleName, permissions: 0, color: roleColor});
        roleName = "";
        roleColor = "#6366f1";
    };
</script>

<div class="space-y-6">
    <div class="space-y-2">
        <Label for="role-name">Nom du rôle</Label>
        <Input
                id="role-name"
                bind:value={roleName}
                placeholder="Ex: Modérateur"
        />
    </div>

    <div class="space-y-2">
        <Label>Couleur du rôle</Label>
        <div class="flex items-center gap-2">
            <HexColorPicker bind:color={roleColor} onChange={(color) => (roleColor = color)}/>
            <Input bind:value={roleColor} class="font-mono"/>
        </div>
    </div>

    <div class="pt-4">
        <Button class="text-white" onclick={handleCreateRole} disabled={!roleName.trim()}>
            Créer le rôle
        </Button>
    </div>
</div>