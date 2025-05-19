import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import type { LayoutLoad } from './$types';

export const prerender = true;

export const load: LayoutLoad = async () => {
	await FirebaseMessaging.requestPermissions();
};