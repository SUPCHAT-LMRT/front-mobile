import type { TransitionConfig } from 'svelte/transition';
import { fly } from 'svelte/transition';

interface VisibleFlyOptions {
	y?: number;
	duration?: number;
	delay?: number;
	easing?: (t: number) => number;
	threshold?: number;
}

/**
 * Enhanced version that uses message position and timing to determine animation
 */
export function smartFly(
	node: Element,
	options: VisibleFlyOptions & {
		isNewMessage?: boolean;
		messageContainer?: Element;
		messageIndex?: number;
		totalMessages?: number;
		staggerDelay?: number;
	} = {}
): TransitionConfig {
	const {
		y = -20,
		duration = 300,
		delay = 0,
		easing = (t) => t,
		isNewMessage = false,
		messageContainer,
		messageIndex = 0,
		totalMessages = 0,
		staggerDelay = 50
	} = options;

	// Calculate stagger delay for new messages
	let calculatedDelay = delay;

	if (isNewMessage && typeof messageIndex === 'number' && totalMessages > 0) {
		// Calculate the relative position within the new messages
		const newMessageStartIndex = Math.max(0, totalMessages - 10);
		const relativeIndex = messageIndex - newMessageStartIndex;

		// Only apply stagger to new messages (relative index >= 0)
		if (relativeIndex >= 0) {
			calculatedDelay = delay + (relativeIndex * staggerDelay);
		}
	}

	// Always animate if explicitly marked as new message
	if (isNewMessage) {
		return fly(node, { y, duration, delay: calculatedDelay, easing });
	}

	// Check visibility
	const rect = node.getBoundingClientRect();
	const windowHeight = window.innerHeight || document.documentElement.clientHeight;
	const isVisible = rect.top < windowHeight && rect.bottom > 0;

	// For container-based checking
	if (messageContainer) {
		const containerRect = messageContainer.getBoundingClientRect();
		const isInContainer = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;

		if (!isInContainer && !isVisible) {
			return {
				duration: 0,
				css: () => ''
			};
		}
	}

	// Animate if visible with calculated delay
	if (isVisible) {
		return fly(node, { y, duration, delay: calculatedDelay, easing });
	}

	return {
		duration: 0,
		css: () => ''
	};
}

