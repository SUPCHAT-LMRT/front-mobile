import {baseClient} from "$lib/api/client";

export type WorkspaceRole = {
	id: string;
	name: string;
	permissions: number;
	color: string;
	isAssigned: boolean;
};


export class RolePermission {
	public static MANAGE_CHANNELS = new RolePermission(1 << 0, "Gérer les canaux", "Permet de gérer les canaux du serveur.");
	public static MANAGE_ROLES = new RolePermission(1 << 1, "Gérer les rôles", "Permet de gérer les rôles du serveur.");
	public static MANAGE_MESSAGES = new RolePermission(1 << 2, "Gérer les messages", "Permet de gérer les messages du serveur.");
	public static MANAGE_INVITES = new RolePermission(1 << 3, "Gérer les invitations", "Permet de gérer les invitations du serveur.");
	public static SEND_MESSAGES = new RolePermission(1 << 4, "Envoyer un message", "Permet d'envoyer des messages dans le serveur.");
	public static ATTACH_FILES = new RolePermission(1 << 5, "Joindre des fichiers", "Permet de joindre des fichiers dans le serveur.");
	public static PIN_MESSAGES = new RolePermission(1 << 6, "Épingler des messages", "Permet d'épingler des messages dans le serveur.");
	public static KICK_MEMBERS = new RolePermission(1 << 7, "Expulser des membres", "Permet d'expulser des membres du serveur.");
	public static MENTION_EVERYONE = new RolePermission(1 << 8, "Mentionner @everyone", "Permet de mentionner @everyone dans le serveur.");
	public static INVITE_MEMBERS = new RolePermission(1 << 9, "Inviter des membres", "Permet d'inviter des membres dans le serveur.");
	public static MANAGE_WORKSPACE_SETTINGS = new RolePermission(1 << 10, "Gérer les paramètres du serveur", "Permet de gérer les paramètres du serveur.");


	public constructor(private readonly bit: number, private readonly name: string, private readonly description: string) {
	}

	public get permissionBit(): number {
		return this.bit;
	}


	public get permissionName(): string {
		return this.name;
	}

	public get permissionDescription(): string {
		return this.description;
	}
}

export const createWorkspaceRole = async (
	workspaceId: string,
	name: string,
	color: string
): Promise<WorkspaceRole> => {
	try {
		const {data} = await baseClient.post(`/api/workspaces/${workspaceId}/roles`, {
			name,
			color,
		});
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
};

export const getListWorkspaceRoles = async (
	workspaceId: string
): Promise<WorkspaceRole[]> => {
	try {
		const {data} = await baseClient.get(
			`/api/workspaces/${workspaceId}/roles`,
		);
		return data;
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const updateWorkspaceRole = async (
	workspaceId: string,
	roleId: string,
	name: string,
	permissions: number,
	color: string
): Promise<void> => {
	try {
		await baseClient.put(
			`/api/workspaces/${workspaceId}/roles/${roleId}`,
			{
				name,
				permissions,
				color,
			});
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const deleteWorkspaceRole = async (
	workspaceId: string,
	roleId: string
): Promise<void> => {
	try {
		await baseClient.delete(
			`/api/workspaces/${workspaceId}/roles/${roleId}`,
		);
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export const assignRoleToMember = async (
	workspaceId: string,
	userId: string,
	roleId: string
): Promise<void> => {
	try {
		await baseClient.post(
			`/api/workspaces/${workspaceId}/roles/assign`,
			{
				user_id: userId,
				role_id: roleId,
				workspace_id: workspaceId,
			}
		);
		console.log(`Role ${roleId} assigné à ${userId} dans le workspace ${workspaceId}`);
	} catch (e) {
		console.error("Erreur lors de l'assignation du rôle :", e);
		throw e;
	}
};

export const dessasignRoleToMember = async (
	workspaceId: string,
	userId: string,
	roleId: string
): Promise<void> => {
	try {
		await baseClient.post(
			`/api/workspaces/${workspaceId}/roles/dessassign`,
			{
				user_id: userId,
				role_id: roleId,
				workspace_id: workspaceId,
			}
		);
		console.log(`Rôle ${roleId} retiré de ${userId} dans le workspace ${workspaceId}`);
	} catch (e) {
		console.error("Erreur lors du retrait du rôle :", e);
		throw e;
	}
}

export const getRolesForMember = async (
	workspaceId: string,
	userId: string
): Promise<(WorkspaceRole & { isAssigned: boolean })[]> => {
	try {
		const {data} = await baseClient.get(
			`/api/workspaces/${workspaceId}/roles/members/${userId}`
		);

		const rolesArray = Array.isArray(data) ? data : data.roles;

		if (!Array.isArray(rolesArray)) {
			throw new Error("Le format des rôles est invalide : pas un tableau");
		}

		return rolesArray.map(role => ({
			id: role.Id ?? role.id,
			name: role.Name ?? role.name,
			permissions: role.Permissions ?? role.permissions,
			color: role.Color ?? role.color,
			isAssigned: role.IsAssigned ?? role.isAssigned
		}));
	} catch (e) {
		console.error("Erreur lors du chargement des rôles du membre :", e);
		throw e;
	}
};

export const checkRolePermission = (
	workspaceId: string,
	permissions: number
): Promise<{ hasPermission: boolean }> => {
	return baseClient.post(
		`/api/workspaces/${workspaceId}/permissions/check`,
		{
			permissions,
		}
	).then(({data}) => data);
}
