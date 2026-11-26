/**
 * Small, reusable motion effects (Web Animations API, no dependencies). Browser-only.
 * All of them are decorative: check prefersReducedMotion() before calling.
 */

export type Point = { x: number; y: number };

export function prefersReducedMotion() {
	return (
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
}

export const random = (min: number, max: number) => min + Math.random() * (max - min);

/** Resolve when an animation ends, whether it finished or was cancelled. */
export const settled = (animation: Animation) =>
	animation.finished.then(
		() => undefined,
		() => undefined
	);

export function centre(el: Element): Point {
	const r = el.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** A fixed, non-interactive, aria-hidden layer for <body>. Remove it when done. */
export function layer(styles: Partial<CSSStyleDeclaration>) {
	const el = document.createElement('span');
	el.setAttribute('aria-hidden', 'true');
	Object.assign(el.style, {
		position: 'fixed',
		left: '0',
		top: '0',
		pointerEvents: 'none',
		zIndex: '60',
		...styles
	});
	return el;
}

/** A squash-and-stretch wobble with a little tilt, settling like a spring. */
export function boing(el: Element) {
	el.animate(
		[
			{ transform: 'scale(1, 1) rotate(0deg)' },
			{ transform: 'scale(1.25, 0.8) rotate(0deg)', offset: 0.15 },
			{ transform: 'scale(0.85, 1.2) rotate(-8deg)', offset: 0.35 },
			{ transform: 'scale(1.08, 0.95) rotate(5deg)', offset: 0.55 },
			{ transform: 'scale(0.98, 1.02) rotate(-2deg)', offset: 0.75 },
			{ transform: 'scale(1, 1) rotate(0deg)' }
		],
		{ duration: 650, easing: 'ease-out' }
	);
}

/** A quick "nope" head-shake, e.g. when the server rejects a form. */
export function shake(el: Element) {
	el.animate(
		[
			{ transform: 'translateX(0)' },
			{ transform: 'translateX(-7px)', offset: 0.15 },
			{ transform: 'translateX(6px)', offset: 0.35 },
			{ transform: 'translateX(-4px)', offset: 0.55 },
			{ transform: 'translateX(2px)', offset: 0.75 },
			{ transform: 'translateX(0)' }
		],
		{ duration: 450, easing: 'ease-out' }
	);
}

type BubbleOptions = {
	count?: number;
	/** Max horizontal drift either side, in px. */
	spread?: number;
	/** How far they float up, [min, max] in px (capped to the space above `from`). */
	rise?: [number, number];
	/** Bubble diameter, [min, max] in px. */
	size?: [number, number];
	/** Stagger: each bubble starts after a random delay up to this, in ms. */
	stagger?: number;
};

/** Outlined bubbles drifting up from `from` with a little sway, then popping (fading) away. */
export function bubbles(
	from: Point,
	{ count = 7, spread = 26, rise = [34, 64], size = [4, 9], stagger = 120 }: BubbleOptions = {}
) {
	for (let i = 0; i < count; i++) {
		const d = random(...size);
		const bubble = layer({
			left: `${from.x - d / 2}px`,
			top: `${from.y - d / 2}px`,
			width: `${d}px`,
			height: `${d}px`,
			borderRadius: '50%',
			border: '1.5px solid var(--color-rose)'
		});
		document.body.appendChild(bubble);

		const drift = random(-spread, spread);
		// Never float off the top of the screen.
		const up = Math.min(random(...rise), from.y - d - 4);
		const sway = random(6, 12) * (Math.random() < 0.5 ? -1 : 1);
		const animation = bubble.animate(
			[
				{ transform: 'translate(0, 0) scale(0.3)', opacity: 0 },
				{
					transform: `translate(${drift * 0.4 + sway}px, ${-up * 0.45}px) scale(1)`,
					opacity: 1,
					offset: 0.35
				},
				{
					transform: `translate(${drift - sway * 0.5}px, ${-up * 0.8}px) scale(1.05)`,
					opacity: 0.8,
					offset: 0.75
				},
				{ transform: `translate(${drift}px, ${-up}px) scale(1.3)`, opacity: 0 }
			],
			{
				duration: random(650, 1000) * Math.max(1, up / 60),
				delay: random(0, stagger),
				easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)',
				// Hold the first (invisible) frame during the delay.
				fill: 'backwards'
			}
		);
		void settled(animation).then(() => bubble.remove());
	}
}
