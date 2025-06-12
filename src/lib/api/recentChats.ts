import { baseClient } from "$lib/api/client";

export enum RecentChatKind {
	GROUP = "GROUP",
	DIRECT = "DIRECT",
}

export type RecentChats = {
	id: string;
	kind: RecentChatKind;
	avatarUrl: string;
	name: string;
	lastMessage: {
		id: string;
		content: string;
		senderId: string;
		senderName: string;
		createdAt: Date;
	}
};

export const getRecentChats = async (): Promise<RecentChats[]> => {
	try {
		let { data } = await baseClient.get('/api/chats/recents');
		data = data.map((chat: any) => {
			if (chat.kind === 0) {
				chat.kind = RecentChatKind.GROUP;
			} else if (chat.kind === 1) {
				chat.kind = RecentChatKind.DIRECT;
			}
			chat.lastMessage.createdAt = new Date(chat.lastMessage.createdAt);
			return chat;
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};
