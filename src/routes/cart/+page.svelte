<script lang="ts">
	import { resolve } from '$app/paths';
	import { cart } from '#lib/cart.svelte.ts';
	import { formatPrice } from '#lib/catalogue.ts';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The bag stores ids only; look up names and current prices from the database catalogue.
	const lines = $derived(
		cart.items.map((item) => {
			const { styles, colours, sizes } = data.catalogue;
			const style = styles.find((s) => s.id === item.styleId);
			const top = colours.find((c) => c.id === item.topColour);
			const bottom = colours.find((c) => c.id === item.bottomColour);
			const available =
				!!style &&
				!!top &&
				!!bottom &&
				sizes.includes(item.topSize) &&
				sizes.includes(item.bottomSize);
			return { item, style, top, bottom, available };
		})
	);
	const subtotal = $derived(
		lines.reduce(
			(sum, l) => sum + (l.available && l.style ? l.style.price * l.item.quantity : 0),
			0
		)
	);
	const hasUnavailable = $derived(lines.some((l) => !l.available));
</script>

<svelte:head>
	<title>Bag · Aspris Swim</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-5 pt-12 md:px-8 md:pt-20">
	<h1 class="text-5xl md:text-6xl">Your bag</h1>

	{#if cart.items.length === 0}
		<div class="py-24 text-center">
			<p class="text-ink/60">Your bag is empty.</p>
			<a href={resolve('/custom')} class="mt-8 btn btn-primary">Design your bikini</a>
		</div>
	{:else}
		<div class="mt-10 grid gap-12 md:grid-cols-3">
			<ul class="divide-y divide-rose/20 border-y border-rose/20 md:col-span-2">
				{#each lines as { item, style, top, bottom, available } (item.key)}
					<li class={['flex gap-5 py-6', !available && 'opacity-60']}>
						<ProductImage
							alt="Custom {style?.name ?? ''} bikini"
							tint={top?.hex}
							class="aspect-[3/4] w-24 shrink-0 rounded-2xl"
						/>
						<div class="flex flex-1 flex-col">
							<div class="flex justify-between gap-4">
								<h2 class="text-xl">
									Custom {style?.name ?? ''} bikini
								</h2>
								{#if available && style}
									<p>{formatPrice(style.price * item.quantity)}</p>
								{/if}
							</div>
							<p class="mt-1 text-sm text-ink/60">
								Top: {top?.name ?? item.topColour}, {item.topSize} · Bottom: {bottom?.name ??
									item.bottomColour}, {item.bottomSize}
							</p>
							{#if !available}
								<p class="mt-1 text-sm text-rose-dark">
									No longer available — please remove it and choose another option.
								</p>
							{/if}
							{#if item.notes}
								<p class="mt-1 text-sm text-ink/60 italic">“{item.notes}”</p>
							{/if}
							<div class="mt-auto flex items-center justify-between pt-4">
								<div class="flex items-center rounded-full border border-rose/30">
									<button
										class="px-3 py-1"
										aria-label="Decrease quantity"
										onclick={() => cart.setQuantity(item.key, item.quantity - 1)}
									>
										−
									</button>
									<span class="w-6 text-center text-sm">{item.quantity}</span>
									<button
										class="px-3 py-1"
										aria-label="Increase quantity"
										onclick={() => cart.setQuantity(item.key, item.quantity + 1)}
									>
										+
									</button>
								</div>
								<button
									class="text-xs tracking-[0.2em] text-ink/60 uppercase hover:text-rose"
									onclick={() => cart.remove(item.key)}
								>
									Remove
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			<aside class="h-fit rounded-[2rem] bg-sand p-8">
				<div class="flex justify-between">
					<span>Subtotal</span>
					<span>{formatPrice(subtotal)}</span>
				</div>
				{#if hasUnavailable}
					<p class="mt-2 text-xs text-rose-dark">Unavailable items aren't included.</p>
				{/if}
				<p class="mt-2 text-xs text-ink/60">Shipping calculated at checkout.</p>
				<!-- TODO: checkout (e.g. Stripe Checkout via a +server.ts endpoint) -->
				<button class="mt-8 btn w-full btn-primary py-4" disabled>Checkout — coming soon</button>
			</aside>
		</div>
	{/if}
</section>
