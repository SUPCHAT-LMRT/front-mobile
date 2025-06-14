import { baseClient } from "../client";

export type GroupMessage = {
  id: string;
  content: string;
  author: GroupMessageAuthor;
  createdAt: Date;
  reactions: GroupMessageReaction[];
};

type GroupMessageAuthor = {
  userId: string;
  firstName: string;
  lastName: string;
};

type GroupMessageReaction = {
  users: { id: string; name: string }[];
  reaction: string;
};

export const listGroupMessages = async (
  groupId: string,
  params: {
    limit?: number;
    before?: Date;
    after?: Date;
    aroundMessageId?: string;
  } = {}
): Promise<GroupMessage[]> => {
  try {
    let { data } = await baseClient.get(`/api/groups/${groupId}/messages?limit=${params.limit}${params.before ? `&before=${params.before.toISOString()}` : ""}${params.after ? `&after=${params.after.toISOString()}` : ""}${params.aroundMessageId ? `&aroundMessageId=${params.aroundMessageId}` : ""}`);
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
