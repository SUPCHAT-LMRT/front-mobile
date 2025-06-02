import { baseClient } from "../client";
import type { WorkspaceRole } from "./roles";

export type WorkspaceMember = {
	id: string;
	userId: string;
	pseudo: string;
	roles: WorkspaceRole[];
};

export const getWorkspaceMembers = async (
	workspaceId: string,
	page: number,
	limit: number,
): Promise<{ members: WorkspaceMember[]; total: number }> => {
	try {
		const { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/members`,
			{
				params: { page, limit },
			},
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};