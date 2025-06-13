import { App as CapacitorApp } from '@capacitor/app';
import { redirect } from '@sveltejs/kit';
import '../app.css';
import type { LayoutLoad } from './$types';

export const ssr = false;
export const prerender = true;

export const load: LayoutLoad = async () => {
	const userAgent = navigator.userAgent || '';

	// Simple mobile detection
	const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
	const isDesktop = !isMobile;

	if (isDesktop) {
		redirect(302, 'https://supchat-lmrt.fr');
	}

	CapacitorApp.addListener('backButton', ({ canGoBack }) => {
		if (!canGoBack) {
			CapacitorApp.exitApp();
		} else {
			window.history.back();
		}
	});
};
