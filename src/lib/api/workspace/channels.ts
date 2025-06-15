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

export const getPrivateChannels = async (
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

export type ChannelMessage = {
	id: string;
	content: string;
	author: ChannelMessageAuthor;
	createdAt: Date;
	reactions: ChannelMessageReaction[];
	attachments: ChannelMessageAttachment[];
};

type ChannelMessageAuthor = {
	userId: string;
	pseudo: string;
	workspaceMemberId: string;
};

type ChannelMessageReaction = {
	users: { id: string; name: string }[];
	reaction: string;
};

type ChannelMessageAttachment = {
	id: string;
	name: string;
};

export const getWorkspaceChannelMessages = async (
	workspaceId: string,
	channelId: string,
	params: {
		limit?: number;
		before?: Date;
		after?: Date;
		aroundMessageId?: string;
	} = {},
): Promise<ChannelMessage[]> => {
	try {
		let { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/channels/${channelId}/messages?limit=${params.limit}${params.before ? `&before=${params.before.toISOString()}` : ""}${params.after ? `&after=${params.after.toISOString()}` : ""}${params.aroundMessageId ? `&aroundMessageId=${params.aroundMessageId}` : ""}`,
		);
		data = data.map((message: Record<string, never>) => ({
			...message,
			createdAt: new Date(message.createdAt),
		}));
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const reorderWorkspaceChannel = async (
	workspaceId: string,
	channels: { id: string; newIndex: number }[],
): Promise<void> => {
	try {
		await baseClient.post(
			`/api/workspaces/${workspaceId}/channels/reorder`, channels,
		);
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const deleteWorkspaceChannel = async (
	workspaceId: string,
	channelId: string,
): Promise<void> => {
	try {
		await baseClient.delete(
			`/api/workspaces/${workspaceId}/channels/${channelId}`,
		);
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const getPrivateChannelMembers = async (
	workspaceId: string,
	channelId: string,
): Promise<{ id: string; name: string }[]> => {
	try {
		const { data } = await baseClient.get(
			`/api/workspaces/${workspaceId}/channels/${channelId}/members`,
		);
		return data.map((member: { userId: string; username: string }) => ({
			id: member.userId,
			name: member.username,
		}));
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const uploadChannelFile = async (
	workspaceId: string,
	channelId: string,
	file: File,
): Promise<{ id: string; name: string; url: string }> => {
	try {
		const formData = new FormData();
		formData.append("file", file);
		const { data } = await baseClient.post(
			`/api/workspaces/${workspaceId}/channels/${channelId}/files`,
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
}