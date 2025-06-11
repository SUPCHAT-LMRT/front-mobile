import { App as CapacitorApp } from '@capacitor/app';
import '../app.css';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = async () => {
	CapacitorApp.addListener('backButton', ({ canGoBack }) => {
		if (!canGoBack) {
			CapacitorApp.exitApp();
		} else {
			window.history.back();
		}
	});
};
