import { baseClient } from "../client";

export const createGroupChat = async (
	groupName: string,
	usersIds: string[],
): Promise<string> => {
	try {
		let { data } = await baseClient.post('/api/groups', {
			name: groupName,
			usersIds: usersIds,
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

// TODO impl backend
export const updateGroupName = async (
	groupId: string,
	groupName: string,
): Promise<void> => {
	try {
		await baseClient.put(`/api/groups/${groupId}`, { name: groupName });
	} catch (e) {
		console.error(e);
		throw e;
	}
}