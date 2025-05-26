import { baseClient } from "../client";

export type WorkspaceDiscover = {
	id: string;
	name: string;
	topic: string;
	ownerName: string;
	membersCount: number;
	onlineMembersCount: number;
}

export const listWorkspaceDiscover = async (): Promise<WorkspaceDiscover[]> => {
	try {
		const { data } = await baseClient.get("/api/workspaces/discover");
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const joinWorkspace = async (workspaceId: string): Promise<void> => {
	await baseClient.get(`/api/workspaces/discover/${workspaceId}/join`);
}