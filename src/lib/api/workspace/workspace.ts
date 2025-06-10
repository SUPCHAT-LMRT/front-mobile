import { baseClient } from "../client";
import type { WorkspaceRole } from '$lib/api/workspace/roles';

export enum WorkspaceType {
	PUBLIC = "PUBLIC",
	PRIVATE = "PRIVATE",
}

export type Workspace = {
	id: string;
	name: string;
	topic: string;
	type: WorkspaceType;
};

export type Channel = {
	id: string;
	name: string;
	topic: string;
	isPrivate: boolean;
	members: string[];
	workspaceId: string;
	order: number;
};

export type WorkspaceMember = {
	id: string;
	userId: string;
	pseudo: string;
	roles: WorkspaceRole[];
};

export const listUserWorkspaces = async (): Promise<Workspace[]> => {
	try {
		const { data } = await baseClient.get("/api/workspaces");
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const getWorkspace = async (workspaceId: string): Promise<Workspace> => {
	try {
		const { data } = await baseClient.get(`/api/workspaces/${workspaceId}`);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const updateTypeWorkspace = async (
	workspaceId: string,
	type: WorkspaceType,
): Promise<Workspace> => {
	try {
		const { data } = await baseClient.put(
			`/api/workspaces/${workspaceId}/type`,
			{ type },
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const createWorkspace = async (
	name: string,
	type: WorkspaceType,
): Promise<Workspace> => {
	try {
		const { data } = await baseClient.post("/api/workspaces", { name, type });
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const updateWorkspaceIcon = async (
	workspaceId: string,
	image: File,
): Promise<Workspace> => {
	try {
		const formData = new FormData();
		formData.append(
			"image",
			new Blob([image], { type: image.type }),
			image.name,
		);
		const { data } = await baseClient.put(
			`/api/workspaces/${workspaceId}/icon`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const updateWorkspace = async (
	workspaceId: string,
	name: string,
	topic: string,
): Promise<Workspace> => {
	try {
		const { data } = await baseClient.put(`/api/workspaces/${workspaceId}`, {
			name,
			topic,
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
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

export const kickWorkspaceMember = async (
	workspaceId: string,
	userId: string,
): Promise<void> => {
	try {
		await baseClient.delete(
			`/api/workspaces/${workspaceId}/members/${userId}`,
		);
	} catch (e) {
		console.error(e);
		throw e;
	}
};


export const createWorkspaceInviteLink = async (
	workspaceId: string,
): Promise<string> => {
	try {
		const { data } = await baseClient.post(`/api/workspace-invite-link/create/${workspaceId}`, {
			workspaceId,
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};