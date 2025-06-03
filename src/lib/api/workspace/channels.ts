import { baseClient } from "../client";

export type Channel = {
	id: string;
	name: string;
	topic: string;
	isPrivate: boolean;
	members: string[];
	workspaceId: string;
	order: number;
};

export const createWorkspaceChannel = async (
	workspaceId: string,
	name: string,
	topic: string,
	isPrivate: boolean,
	members: string[],
): Promise<Channel> => {
	try {
		const { data } = await baseClient.post(
			`/api/workspaces/${workspaceId}/channels`,
			{
				name,
				topic,
				isPrivate,
				members,
			},
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const listWorkspaceChannels = async (
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

export const listWorkspacePrivateChannels = async (
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

export const getWorkspaceChannel = async (
	workspaceId: string,
	channelId: string,
): Promise<Channel> => {
	try {
		const { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/channels/${channelId}`,
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};