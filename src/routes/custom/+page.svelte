<script lang="ts">
	import { cart } from '#lib/cart.svelte.ts';
	import { stockKey, type Piece, type Size } from '#lib/catalogue.ts';
	import { formatPrice } from '#lib/format.ts';
	import ColourPicker from '#lib/components/ColourPicker.svelte';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import SizePicker from '#lib/components/SizePicker.svelte';
	import WaveMark from '#lib/components/WaveMark.svelte';
	import { prefersReducedMotion } from '#lib/motion/effects.ts';
	import { flyToBag } from '#lib/motion/fly-to-bag.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Styles, prices, colours, sizes and stock all come from the database (+page.server.ts).
	const styles = $derived(data.catalogue.styles);
	const colours = $derived(data.catalogue.colours);
	const sizes = $derived(data.catalogue.sizes);
	const colourHex = (id: string | undefined) => colours.find((c) => c.id === id)?.hex;

	// Writable $derived: defaults to the first style, but the picker can change it.
	let styleId = $derived<string | undefined>(styles[0]?.id);
	const style = $derived(styles.find((s) => s.id === styleId));

	let topColour = $state<string>();
	let bottomColour = $state<string>();
	let topSize = $state<Size>();
	let bottomSize = $state<Size>();
	let added = $state(false);
	/** True while the pebble is in flight, so a double-click can't add two bikinis. */
	let adding = false;

	const ready = $derived(!!style && !!topColour && !!bottomColour && !!topSize && !!bottomSize);

	// ── Stock ─────────────────────────────────────────────────────────────────────────
	const inStock = (colour: string, piece: Piece, size: Size) =>
		(data.catalogue.stock[stockKey(colour, piece, size)] ?? 0) > 0;

	/** A colour is sold out for a piece when none of its sizes are left. */
	const colourSoldOut = (piece: Piece) => (colour: string) =>
		!sizes.some((size) => inStock(colour, piece, size));

	/** With a colour chosen, check that colour; otherwise, whether any colour has the size. */
	const sizeSoldOut = (piece: Piece, colour: string | undefined) => (size: Size) =>
		colour ? !inStock(colour, piece, size) : !colours.some((c) => inStock(c.id, piece, size));

	// Clear a selection that's no longer available (e.g. after switching colour).
	$effect(() => {
		if (topColour && colourSoldOut('top')(topColour)) topColour = undefined;
		if (topSize && sizeSoldOut('top', topColour)(topSize)) topSize = undefined;
	});
	$effect(() => {
		if (bottomColour && colourSoldOut('bottom')(bottomColour)) bottomColour = undefined;
		if (bottomSize && sizeSoldOut('bottom', bottomColour)(bottomSize)) bottomSize = undefined;
	});

	async function addToBag(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
		if (adding || !style || !topColour || !bottomColour || !topSize || !bottomSize) return;
		const item = {
			styleId: style.id,
			topColour,
			bottomColour,
			topSize,
			bottomSize
		};

		adding = true;
		try {
			if (!prefersReducedMotion()) {
				// Fly from the click point (keyboard "clicks" report 0,0 — use the button's centre).
				const rect = event.currentTarget.getBoundingClientRect();
				const fromPointer = event.clientX !== 0 || event.clientY !== 0;
				await flyToBag({
					origin: fromPointer
						? { x: event.clientX, y: event.clientY }
						: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
					colours: [colourHex(topColour) ?? '#000', colourHex(bottomColour) ?? '#000']
				});
			}
		} finally {
			// Always add, even if the animation was interrupted — and only now, so the
			// bag count ticks up the moment the pebble lands.
			cart.add(item);
			adding = false;
			added = true;
			setTimeout(() => (added = false), 2000);
		}
	}
</script>

<svelte:head>
	<title>Make it yours · Aspris Swim</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-5 pt-12 md:px-8 md:pt-20">
	<div class="text-center">
		<WaveMark class="mx-auto h-8 w-auto text-rose" />
		<h1 class="mt-6 text-5xl md:text-7xl">Make it yours.</h1>
		<p class="mt-4 text-lg text-ink/70">
			Customise your bikini to suit you, in every meaning of the word.
		</p>
	</div>

	{#if styles.length === 0 || colours.length === 0 || sizes.length === 0}
		<p class="mt-14 rounded-2xl bg-sand p-8 text-center text-ink/70">
			Custom bikinis aren't available right now — please check back soon.
		</p>
	{:else}
		<div class="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
			<!-- Preview: two-tone placeholder until there are real renders / photos per style -->
			<div class="grid gap-3 md:sticky md:top-28 md:self-start">
				<ProductImage alt="Top preview" tint={colourHex(topColour)} class="aspect-[4/3]" />
				<ProductImage alt="Bottom preview" tint={colourHex(bottomColour)} class="aspect-[4/3]" />
			</div>

			<div class="space-y-10 rounded-[2rem] bg-sand p-6 md:p-10">
				<!--
					Style picker — hidden while there's only one style. The first active style in the
					database is selected automatically (see `styleId` above). Uncomment when you add more.

				<fieldset>
					<legend class="text-sm">Style</legend>
					<div class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(7rem,1fr))] gap-2">
						{#each styles as s (s.id)}
							<label class="cursor-pointer">
								<input type="radio" class="peer sr-only" bind:group={styleId} value={s.id} />
								<span
									class="block rounded-xl border border-rose/30 py-3 text-center text-sm transition peer-checked:border-rose peer-checked:bg-rose peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-rose"
								>
									{s.name}
									<span class="block text-xs opacity-70">{formatPrice(s.price)}</span>
								</span>
							</label>
						{/each}
					</div>
				</fieldset>
				-->

				<ColourPicker
					{colours}
					bind:value={topColour}
					label="Top colour"
					isDisabled={colourSoldOut('top')}
				/>
				<ColourPicker
					{colours}
					bind:value={bottomColour}
					label="Bottom colour"
					isDisabled={colourSoldOut('bottom')}
				/>
				<SizePicker
					{sizes}
					bind:value={topSize}
					label="Top size"
					isDisabled={sizeSoldOut('top', topColour)}
				/>
				<SizePicker
					{sizes}
					bind:value={bottomSize}
					label="Bottom size"
					isDisabled={sizeSoldOut('bottom', bottomColour)}
				/>

				<div class="border-t border-rose/20 pt-8">
					<div class="flex items-baseline justify-between">
						<span class="text-sm">Total</span>
						<span class="text-xl">{style ? formatPrice(style.price) : '—'}</span>
					</div>
					<button class="mt-6 btn w-full btn-primary py-4" disabled={!ready} onclick={addToBag}>
						<!-- Both labels share one grid cell and slide past each other -->
						<span class="grid overflow-hidden" aria-live="polite">
							<span
								class={[
									'transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [grid-area:1/1] motion-reduce:translate-y-0',
									added ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
								]}
								aria-hidden={added}
							>
								Book your custom bikini
							</span>
							<span
								class={[
									'transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] [grid-area:1/1] motion-reduce:translate-y-0',
									added ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
								]}
								aria-hidden={!added}
							>
								Added to bag ✓
							</span>
						</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</section>
