/**
 * Svelte transitions for little moments of delight. All are reduced-motion aware: pass durations
 * through `md()` so they become instant for people who've asked for less motion.
 */
import { backOut, cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { prefersReducedMotion } from './effects.ts';

/** Motion duration: `ms`, or 0 under reduced motion. */
export const md = (ms: number) => (prefersReducedMotion() ? 0 : ms);

/** Reveal left-to-right, like a wave washing in. */
export function wash(_node: Element, { delay = 0, duration = 900 } = {}): TransitionConfig {
	return {
		delay,
		duration: md(duration),
		easing: cubicOut,
		css: (t) => `clip-path: inset(0 ${(1 - t) * 100}% 0 0); opacity: ${Math.min(1, t * 2)};`
	};
}

/** Lands with a playful "stamp": drops in big and tilted, then settles with an overshoot. */
export function stamp(_node: Element, { delay = 0, duration = 550 } = {}): TransitionConfig {
	return {
		delay,
		duration: md(duration),
		easing: backOut,
		css: (t, u) =>
			`transform: scale(${1 + u * 0.8}) rotate(${-u * 8}deg); opacity: ${Math.min(1, t * 3)};`
	};
}
