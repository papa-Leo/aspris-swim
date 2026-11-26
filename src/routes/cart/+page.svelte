<script lang="ts">
	import { resolve } from '$app/paths';
	import { cart } from '#lib/cart.svelte.ts';
	import { formatPrice, getColour } from '#lib/data/catalogue.ts';
	import ProductImage from '#lib/components/ProductImage.svelte';
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
				{#each cart.items as item (item.key)}
					<li class="flex gap-5 py-6">
						<ProductImage
							alt="Custom {item.style} bikini"
							tint={getColour(item.topColour)?.hex}
							class="aspect-[3/4] w-24 shrink-0 rounded-2xl"
						/>
						<div class="flex flex-1 flex-col">
							<div class="flex justify-between gap-4">
								<h2 class="text-xl">
									Custom {item.style} bikini
								</h2>
								<p>{formatPrice(item.price * item.quantity)}</p>
							</div>
							<p class="mt-1 text-sm text-ink/60">
								Top: {getColour(item.topColour)?.name}, {item.topSize} · Bottom: {getColour(
									item.bottomColour
								)?.name}, {item.bottomSize}
							</p>
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
					<span>{formatPrice(cart.subtotal)}</span>
				</div>
				<p class="mt-2 text-xs text-ink/60">Shipping calculated at checkout.</p>
				<!-- TODO: checkout (e.g. Stripe Checkout via a +server.ts endpoint) -->
				<button class="mt-8 btn w-full btn-primary py-4" disabled>Checkout — coming soon</button>
			</aside>
		</div>
	{/if}
</section>
