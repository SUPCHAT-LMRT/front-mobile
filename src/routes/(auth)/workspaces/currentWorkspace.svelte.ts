import type { Workspace } from "$lib/api/workspace/workspace";

export const currentWorkspaceState: { workspace: Workspace | null } = $state({ workspace: null });