/**
 * "Add to bag" micro-interaction: a two-tone swatch pebble arcs from where the customer clicked
 * into the header bag, which answers with a springy wobble and a little burst of bubbles.
 *
 * Plain Web Animations API (no dependencies). Browser-only: call it from event handlers.
 * Everything is decorative, so it's aria-hidden. Callers skip it under reduced motion.
 */
import { boing, bubbles, centre, layer, settled, type Point } from './effects.ts';

/** The element the pebble flies into. Header.svelte puts this on the bag link. */
const TARGET = '[data-bag-target]';
/** The part of the target that wobbles on landing (so the count badge stays put). */
const WOBBLE = '[data-bag-wobble]';

function inViewport(el: Element) {
	const r = el.getBoundingClientRect();
	return r.width > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
}

/**
 * Fly a pebble in the given colours from `origin` (the click point) into the bag.
 * Resolves when it lands — add the item to the cart then, so the count ticks up on impact.
 */
export async function flyToBag({
	origin,
	colours: [top, bottom]
}: {
	origin: Point;
	colours: [string, string];
}) {
	const target = document.querySelector(TARGET);
	if (!target || !inViewport(target)) return;

	const end = centre(target);
	const dx = end.x - origin.x;
	const dy = end.y - origin.y;
	const distance = Math.hypot(dx, dy);
	const duration = Math.min(900, Math.max(550, distance * 0.9));
	const size = 28;

	// Three nested layers so X, Y and scale/spin can each have their own easing. Different easings on
	// X and Y are what turn a straight line into a natural, thrown-looking arc.
	const xLayer = layer({ left: `${origin.x - size / 2}px`, top: `${origin.y - size / 2}px` });
	const yLayer = document.createElement('span');
	const pebble = document.createElement('span');
	yLayer.style.display = 'block';
	Object.assign(pebble.style, {
		display: 'block',
		width: `${size}px`,
		height: `${size}px`,
		borderRadius: '50%',
		background: `linear-gradient(135deg, ${top} 50%, ${bottom} 50%)`,
		boxShadow: '0 0 0 2px var(--color-cream), 0 6px 14px rgb(46 38 36 / 0.25)'
	});
	yLayer.appendChild(pebble);
	xLayer.appendChild(yLayer);
	document.body.appendChild(xLayer);

	try {
		const flight = [
			// X: slow to start, then hurries over: the pebble rises first, then swoops across.
			xLayer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
				duration,
				easing: 'cubic-bezier(0.55, 0, 0.75, 0.6)',
				fill: 'forwards'
			}),
			// Y: a tiny dip first (anticipation), then a quick lift that eases into the bag.
			yLayer.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }], {
				duration,
				easing: 'cubic-bezier(0.3, -0.35, 0.3, 1)',
				fill: 'forwards'
			}),
			// Pop in, then shrink and spin as it travels.
			pebble.animate(
				[
					{ transform: 'scale(0.4) rotate(0deg)', opacity: 0 },
					{ transform: 'scale(1.2) rotate(30deg)', opacity: 1, offset: 0.15 },
					{ transform: 'scale(0.35) rotate(220deg)', opacity: 1 }
				],
				{ duration, easing: 'ease-in', fill: 'forwards' }
			)
		];
		await Promise.all(flight.map(settled));
	} finally {
		xLayer.remove();
	}

	boing(target.querySelector(WOBBLE) ?? target);
	// The bag sits in the header near the top of the screen, so keep the bubbles low and wide.
	bubbles(end, { spread: 34, rise: [22, 46] });
}
