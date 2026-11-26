<script lang="ts">
	import { cart } from '#lib/cart.svelte.ts';
	import {
		CUSTOM_BIKINI_PRICE,
		colours,
		formatPrice,
		getColour,
		sizes,
		styles,
		type Size,
		type Style
	} from '#lib/data/catalogue.ts';
	import ColourPicker from '#lib/components/ColourPicker.svelte';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import SizePicker from '#lib/components/SizePicker.svelte';
	import WaveMark from '#lib/components/WaveMark.svelte';

	let style = $state<Style>('Triangle');
	let topColour = $state<string>();
	let bottomColour = $state<string>();
	let topSize = $state<Size>();
	let bottomSize = $state<Size>();
	let notes = $state('');
	let added = $state(false);

	const ready = $derived(!!topColour && !!bottomColour && !!topSize && !!bottomSize);

	function addToBag() {
		if (!ready || !topColour || !bottomColour || !topSize || !bottomSize) return;
		cart.add({
			style,
			topColour,
			bottomColour,
			topSize,
			bottomSize,
			notes: notes.trim(),
			price: CUSTOM_BIKINI_PRICE
		});
		added = true;
		setTimeout(() => (added = false), 2000);
	}
</script>

<svelte:head>
	<title>Make it yours · Aspris Swim</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-5 pt-12 md:px-8 md:pt-20">
	<div class="text-center">
		<WaveMark class="mx-auto h-8 w-auto text-rose" />
		<h1 class="mt-6 text-5xl md:text-7xl">Make it yours.</h1>
		<p class="mt-4 text-lg text-ink/70">Your bikini. Your colours. Your style.</p>
	</div>

	<div class="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
		<!-- Preview: two-tone placeholder until there are real renders / photos per style -->
		<div class="grid gap-3 md:sticky md:top-28 md:self-start">
			<ProductImage alt="Top preview" tint={getColour(topColour ?? '')?.hex} class="aspect-[4/3]" />
			<ProductImage
				alt="Bottom preview"
				tint={getColour(bottomColour ?? '')?.hex}
				class="aspect-[4/3]"
			/>
		</div>

		<div class="space-y-10 rounded-[2rem] bg-sand p-6 md:p-10">
			<fieldset>
				<legend class="text-sm">Style</legend>
				<div class="mt-3 grid grid-cols-3 gap-2">
					{#each styles as s (s)}
						<label class="cursor-pointer">
							<input type="radio" class="peer sr-only" bind:group={style} value={s} />
							<span
								class="block rounded-xl border border-rose/30 py-3 text-center text-sm transition peer-checked:border-rose peer-checked:bg-rose peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-rose"
							>
								{s}
							</span>
						</label>
					{/each}
				</div>
			</fieldset>

			<ColourPicker {colours} bind:value={topColour} label="Top colour" />
			<ColourPicker {colours} bind:value={bottomColour} label="Bottom colour" />
			<SizePicker {sizes} bind:value={topSize} label="Top size" />
			<SizePicker {sizes} bind:value={bottomSize} label="Bottom size" />

			<label class="block">
				<span class="text-sm">Anything else? <span class="text-ink/50">(optional)</span></span>
				<textarea
					bind:value={notes}
					rows="3"
					class="mt-3 w-full rounded-xl border-rose/30 bg-cream text-sm focus:border-rose focus:ring-rose"
					placeholder="Fit preferences, coverage, a special occasion…"></textarea>
			</label>

			<div class="border-t border-rose/20 pt-8">
				<div class="flex items-baseline justify-between">
					<span class="text-sm">Total</span>
					<span class="text-xl">{formatPrice(CUSTOM_BIKINI_PRICE)}</span>
				</div>
				<button class="mt-6 btn w-full btn-primary py-4" disabled={!ready} onclick={addToBag}>
					{added ? 'Added to bag ✓' : 'Book your custom bikini'}
				</button>
			</div>
		</div>
	</div>
</section>
