import { baseClient } from "../client";

export enum WorkspaceType {
	PUBLIC = "public",
	PRIVATE = "private",
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

export const getWorkspaceChannels = async (
	workspaceId: string,
): Promise<Channel[]> => {
	try {
		const { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/channels`,
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const getWorkspacePrivateChannels = async (
	workspaceId: string,
): Promise<Channel[]> => {
	try {
		const { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/channels/private`,
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};