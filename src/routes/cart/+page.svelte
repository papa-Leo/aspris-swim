<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { cart } from '#lib/cart.svelte.ts';
	import { formatEventDate, formatPrice } from '#lib/format.ts';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let checkingOut = $state(false);
	let submitting = $state(false);
	// Re-open the form (with the customer's values) if the server rejected it.
	$effect(() => {
		if (form && !form.success) checkingOut = true;
	});

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
	const values = $derived(form && 'values' in form ? form.values : undefined);
</script>

<svelte:head>
	<title>Bag · Aspris Swim</title>
</svelte:head>

<section class="mx-auto max-w-5xl px-5 pt-12 md:px-8 md:pt-20">
	{#if form?.success && form.popup}
		<!-- Order placed -->
		<div class="mx-auto max-w-xl py-12 text-center">
			<p class="eyebrow">Order placed</p>
			<h1 class="mt-4 text-5xl md:text-6xl">Thank you.</h1>
			<p class="mt-6 text-ink/70">Your order number is</p>
			<p class="mt-2 font-serif text-3xl tracking-wider">{form.reference}</p>
			<div class="mt-10 rounded-[2rem] bg-sand p-8">
				<p class="eyebrow">Collect it at</p>
				<p class="mt-3 font-serif text-2xl">{form.popup.eventName}</p>
				<p class="mt-1 text-ink/70">{formatEventDate(form.popup.eventDate)}</p>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
				<a href={form.popup.mapsUrl} class="mt-6 btn btn-outline" target="_blank" rel="noopener">
					Directions
				</a>
			</div>
			<p class="mt-8 text-sm text-ink/60">
				{#if form.emailSent}
					We've sent a confirmation to <strong class="text-ink">{form.email}</strong>.
				{:else}
					We couldn't send your confirmation email, but your order is safely placed. Please keep
					your order number.
				{/if}
			</p>
			<a href={resolve('/custom')} class="mt-10 btn btn-primary">Design another</a>
		</div>
	{:else}
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
					<p class="mt-2 text-xs text-ink/60">Collected at a pop-up — no shipping.</p>

					{#if hasUnavailable}
						<p class="mt-8 text-sm text-rose-dark">
							Please remove unavailable items before checking out.
						</p>
					{:else if data.popups.length === 0}
						<p class="mt-8 text-sm text-ink/70">
							There are no upcoming pop-ups taking orders right now. Please check back soon.
						</p>
					{:else if !checkingOut}
						<button class="mt-8 btn w-full btn-primary py-4" onclick={() => (checkingOut = true)}>
							Checkout
						</button>
					{:else}
						<form
							method="POST"
							action="?/checkout"
							class="mt-8 space-y-6 border-t border-rose/20 pt-8"
							use:enhance={() => {
								submitting = true;
								return async ({ result, update }) => {
									if (result.type === 'success') cart.clear();
									await update({ reset: false });
									submitting = false;
								};
							}}
						>
							<input type="hidden" name="items" value={JSON.stringify(cart.items)} />

							<label class="block">
								<span class="text-sm">Email</span>
								<input
									name="email"
									type="email"
									required
									autocomplete="email"
									value={values?.email ?? ''}
									class="mt-2 w-full rounded-xl border-rose/30 bg-cream text-sm focus:border-rose focus:ring-rose"
								/>
								<span class="mt-1 block text-xs text-ink/60">
									We'll send your confirmation here.
								</span>
							</label>

							<label class="block">
								<span class="text-sm">Name <span class="text-ink/50">(optional)</span></span>
								<input
									name="name"
									autocomplete="name"
									value={values?.name ?? ''}
									class="mt-2 w-full rounded-xl border-rose/30 bg-cream text-sm focus:border-rose focus:ring-rose"
								/>
							</label>

							<fieldset>
								<legend class="text-sm">Collect at</legend>
								<div class="mt-2 space-y-2">
									{#each data.popups as popup (popup.id)}
										<label class="block cursor-pointer">
											<input
												type="radio"
												name="popupId"
												value={popup.id}
												required
												checked={values?.popupId === popup.id}
												class="peer sr-only"
											/>
											<span
												class="block rounded-xl border border-rose/30 bg-cream px-4 py-3 transition peer-checked:border-rose peer-checked:ring-1 peer-checked:ring-rose peer-focus-visible:ring-2 peer-focus-visible:ring-rose hover:border-rose"
											>
												<span class="block font-serif text-lg">{popup.eventName}</span>
												<span class="block text-xs text-ink/60">
													{formatEventDate(popup.eventDate)}
													{#if popup.spotsLeft !== null && popup.spotsLeft <= 5}
														· {popup.spotsLeft} spot{popup.spotsLeft === 1 ? '' : 's'} left
													{/if}
												</span>
											</span>
										</label>
										<!-- eslint-disable svelte/no-navigation-without-resolve -- external link -->
										<a
											href={popup.eventUrl ?? popup.mapsUrl}
											target="_blank"
											rel="noopener"
											class="-mt-1 mb-2 block pl-4 text-xs text-rose hover:underline"
										>
											{popup.eventUrl ? 'Event details' : 'Map'} ↗
										</a>
										<!-- eslint-enable svelte/no-navigation-without-resolve -->
									{/each}
								</div>
							</fieldset>

							{#if form && 'error' in form}
								<p class="rounded-xl bg-cream p-3 text-sm text-rose-dark" role="alert">
									{form.error}
								</p>
							{/if}

							<button class="btn w-full btn-primary py-4" disabled={submitting}>
								{submitting ? 'Placing order…' : `Place order · ${formatPrice(subtotal)}`}
							</button>
						</form>
					{/if}
				</aside>
			</div>
		{/if}
	{/if}
</section>
