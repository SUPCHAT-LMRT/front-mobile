import { PUBLIC_S3_ORIGIN } from "$env/static/public";

export enum S3Bucket {
	MESSAGES_FILES = "messages-files",
	USERS_AVATARS = "users-avatars",
	WORKSPACES_ICONS = "workspaces-icons",
	WORKSPACES_BANNERS = "workspaces-banners",
}

export const getS3ObjectUrl = (bucket: S3Bucket, key: string): string => {
	return `${PUBLIC_S3_ORIGIN}/${bucket}/${key}`;
};