import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import type { LayoutLoad } from './$types';
import "../app.css";


export const ssr = false;
export const prerender = false;

export const load: LayoutLoad = async () => {
	await FirebaseMessaging.requestPermissions();
};