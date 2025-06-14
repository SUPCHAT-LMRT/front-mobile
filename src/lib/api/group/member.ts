import { baseClient } from "../client";
import type { PublicStatus } from "../user";

export const addGroupMember = async (
	groupId: string,
	userId: string,
): Promise<void> => {
	try {
		await baseClient.post(`/api/groups/${groupId}/members`, { inviteeUserId: userId });
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export interface GroupMember {
	id: string;
	userName: string;
	userId: string;
	email: string;
	isGroupOwner: boolean;
	status: PublicStatus;
}

export interface GroupInfo {
	id: string;
	name: string;
	members: GroupMember[];
	createdAt: Date;
	updatedAt: Date;
}

export const getGroupInfo = async (groupId: string): Promise<GroupInfo> => {
	try {
		const { data } = await baseClient.get(`/api/groups/${groupId}`);
		data.createdAt = new Date(data.createdAt);
		data.updatedAt = new Date(data.updatedAt);
		return data as GroupInfo;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const removeGroupMember = async (
	groupId: string,
	memberId: string,
): Promise<void> => {
	try {
		await baseClient.delete(`/api/groups/${groupId}/members`, {
			data: {
				memberId
			}
		});
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const leaveGroup = async (groupId: string): Promise<void> => {
	try {
		await baseClient.delete(`/api/groups/${groupId}`);
	} catch (e) {
		console.error(e);
		throw e;
	}
}