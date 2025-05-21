import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import '../app.css';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = async () => {
	await FirebaseMessaging.requestPermissions();
};