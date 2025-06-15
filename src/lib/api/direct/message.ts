import { baseClient } from "../client";

export type DirectMessage = {
  id: string;
  content: string;
  author: DirectMessageAuthor;
  createdAt: Date;
  reactions: DirectMessageReaction[];
  attachments: DirectMessageAttachment[];
};

type DirectMessageAuthor = {
  userId: string;
  firstName: string;
  lastName: string;
};

type DirectMessageReaction = {
  users: { id: string; name: string }[];
  reaction: string;
};

type DirectMessageAttachment = {
  id: string;
  name: string;
};

export const getDirectMessages = async (
  otherUserId: string,
  params: {
    limit?: number;
    before?: Date;
    after?: Date;
    aroundMessageId?: string;
  } = {},
): Promise<DirectMessage[]> => {
  try {
    let { data } = await baseClient.get(`/api/chats/direct/${otherUserId}/messages?limit=${params.limit}${params.before ? `&before=${params.before.toISOString()}` : ""}${params.after ? `&after=${params.after.toISOString()}` : ""}${params.aroundMessageId ? `&aroundMessageId=${params.aroundMessageId}` : ""}`);
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

export const uploadDirectMessageFile = async (
  otherUserId: string,
  file: File,
): Promise<{ id: string; name: string; url: string }> => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await baseClient.post(
      `/api/chats/direct/${otherUserId}/files`,
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
