<script lang="ts">
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Label } from "$lib/components/ui/label";
    import { Separator } from "$lib/components/ui/separator";
    import { ScrollArea } from "$lib/components/ui/scroll-area";
    import {RolePermission, type WorkspaceRole} from "$lib/api/workspace/roles";
    import HexColorPicker from "$lib/components/app/workspace/HexColorPicker.svelte";

    const { role = $bindable() }: { role: WorkspaceRole | null } = $props();

    const permissionCategories = [
        {
            id: "general",
            name: "Général",
            permissions: [
                RolePermission.MANAGE_WORKSPACE_SETTINGS,
                RolePermission.MANAGE_ROLES,
                RolePermission.MANAGE_CHANNELS,
                RolePermission.MANAGE_INVITES
            ]
        },
        {
            id: "messages",
            name: "Messages",
            permissions: [
                RolePermission.SEND_MESSAGES,
                RolePermission.ATTACH_FILES,
                RolePermission.MANAGE_MESSAGES,
                RolePermission.PIN_MESSAGES
            ]
        },
        {
            id: "members",
            name: "Membres",
            permissions: [
                RolePermission.KICK_MEMBERS,
                RolePermission.INVITE_MEMBERS,
                RolePermission.MENTION_EVERYONE,
            ]
        },
    ];
</script>

<div class="space-y-4 mb-6">
    <div class="flex items-end gap-4">
        <div class="flex-grow flex flex-col justify-end">
            <Label class="block text-sm font-medium">Nom du rôle</Label>
            <input
                    type="text"
                    bind:value={role.name}
                    class="w-full px-3 py-2 border rounded-md bg-background text-foreground mt-2"
                    placeholder="Nom du rôle"
            />
        </div>
        <div class="flex-shrink-0">
            <HexColorPicker bind:color={role.color} />
        </div>
    </div>
</div>

<!-- Section permissions -->
<ScrollArea class="h-[400px] pr-4">
    <div class="space-y-6">
        {#each permissionCategories as category, index}
            <div class="space-y-4">
                <h3 class="font-medium text-lg">{category.name}</h3>
                <div class="space-y-3">
                    {#each category.permissions as permission}
                        <div class="flex items-start space-x-2">
                            <Checkbox
                                    id={`${role.id}-${permission.permissionBit}`}
                                    checked={(role.permissions & permission.permissionBit) !== 0}
                                    onCheckedChange={() => {
                                        role.permissions ^= permission.permissionBit;
                                    }}
                            />
                            <div class="grid gap-1.5 leading-none">
                                <Label
                                        for={`${role.id}-${permission.permissionBit}`}
                                        class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {permission.permissionName}
                                </Label>
                                <p class="text-sm text-muted-foreground">{permission.permissionDescription}</p>
                            </div>
                        </div>
                    {/each}
                </div>
                {#if index < permissionCategories.length - 1}
                    <Separator class="my-4" />
                {/if}
            </div>
        {/each}
    </div>
</ScrollArea>
