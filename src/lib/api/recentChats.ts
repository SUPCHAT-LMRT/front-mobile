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
};

export const getRecentChats = async (): Promise<RecentChats[]> => {
	try {
		let { data } = await baseClient.get('/api/chats/recents');
		data = data.map((chat: Record<string, never>) => {
			if (chat.kind === 0) {
				chat.kind = RecentChatKind.GROUP;
			} else if (chat.kind === 1) {
				chat.kind = RecentChatKind.DIRECT;
			}
			return chat;
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};
