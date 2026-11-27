<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { cart } from '#lib/cart.svelte.ts';
	import { formatEventDate, formatPrice } from '#lib/format.ts';
	import { backOut, cubicOut } from 'svelte/easing';
	import { fade, fly, slide } from 'svelte/transition';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import WaveMark from '#lib/components/WaveMark.svelte';
	import { bubbles, centre, prefersReducedMotion, shake } from '#lib/motion/effects.ts';
	import { md, stamp, wash } from '#lib/motion/transitions.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let checkingOut = $state(false);
	let submitting = $state(false);
	let submitButton = $state<HTMLButtonElement>();

	/** Checkout fields cascade in one after another (index → entrance params). */
	const cascade = (i: number) => ({
		y: 14,
		duration: md(500),
		delay: md(120 + i * 70),
		easing: backOut
	});

	/** Focus the email field once the cascade has arrived. */
	function focusWhenOpen(input: HTMLInputElement) {
		const timer = setTimeout(() => input.focus({ preventScroll: true }), md(380));
		return () => clearTimeout(timer);
	}

	/** Order placed: a burst of bubbles from the heading, once the page has glided to the top. */
	function celebrate(heading: HTMLElement) {
		if (prefersReducedMotion()) return;
		let done = false;
		const burst = () => {
			if (done) return;
			done = true;
			bubbles(centre(heading), {
				count: 16,
				spread: 150,
				rise: [60, 170],
				size: [5, 13],
				stagger: 450
			});
		};
		const timer = setTimeout(burst, window.scrollY > 4 ? 900 : 300);
		window.addEventListener('scrollend', burst, { once: true });
		return () => {
			clearTimeout(timer);
			window.removeEventListener('scrollend', burst);
		};
	}
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
			<div class="mx-auto w-fit" in:wash={{ duration: 1000 }}>
				<WaveMark class="h-8 w-auto text-rose" title="" />
			</div>
			<p
				class="mt-6 eyebrow"
				in:fly={{ y: 12, duration: md(500), delay: md(100), easing: backOut }}
			>
				Order placed
			</p>
			<h1
				class="mt-4 text-5xl md:text-6xl"
				in:fly={{ y: 18, duration: md(600), delay: md(180), easing: backOut }}
				{@attach celebrate}
			>
				Thank you.
			</h1>
			<p class="mt-6 text-ink/70" in:fade={{ duration: md(400), delay: md(320) }}>
				Your order number is
			</p>
			<p class="mt-2 font-serif text-3xl tracking-wider" in:stamp={{ delay: md(450) }}>
				{form.reference}
			</p>
			<div
				class="mt-10 rounded-[2rem] bg-sand p-8"
				in:fly={{ y: 24, duration: md(600), delay: md(600), easing: backOut }}
			>
				<p class="eyebrow">Collect it at</p>
				<p class="mt-3 font-serif text-2xl">{form.popup.eventName}</p>
				<p class="mt-1 text-ink/70">{formatEventDate(form.popup.eventDate)}</p>
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external link -->
				<a href={form.popup.mapsUrl} class="mt-6 btn btn-outline" target="_blank" rel="noopener">
					Directions
				</a>
			</div>
			<p class="mt-8 text-sm text-ink/60" in:fade={{ duration: md(400), delay: md(750) }}>
				{#if form.emailSent}
					We've sent a confirmation to <strong class="text-ink">{form.email}</strong>.
				{:else}
					We couldn't send your confirmation email, but your order is safely placed. Please keep
					your order number.
				{/if}
			</p>
			<a
				href={resolve('/custom')}
				class="mt-10 btn btn-primary"
				in:fly={{ y: 12, duration: md(500), delay: md(850), easing: backOut }}
			>
				Design another
			</a>
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
					<p class="mt-2 text-xs text-ink/60">Collected at a pop-up event — no shipping.</p>

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
							in:slide={{ duration: md(450), easing: cubicOut }}
							use:enhance={({ cancel }) => {
								// Ignore repeat clicks while an order is being placed.
								if (submitting) return cancel();
								submitting = true;
								return async ({ result, update }) => {
									if (result.type === 'success') {
										cart.clear();
										// Glide up to the confirmation that replaces the bag.
										window.scrollTo({
											top: 0,
											behavior: prefersReducedMotion() ? 'auto' : 'smooth'
										});
									}
									await update({ reset: false });
									submitting = false;
									if (result.type === 'failure' && submitButton && !prefersReducedMotion()) {
										shake(submitButton);
									}
								};
							}}
						>
							<input type="hidden" name="items" value={JSON.stringify(cart.items)} />

							<label class="block" in:fly={cascade(0)}>
								<span class="text-sm">Email</span>
								<input
									name="email"
									type="email"
									required
									autocomplete="email"
									value={values?.email ?? ''}
									{@attach focusWhenOpen}
									class="mt-2 w-full rounded-xl border-rose/30 bg-cream text-sm focus:border-rose focus:ring-rose"
								/>
								<span class="mt-1 block text-xs text-ink/60">
									We'll send your confirmation here.
								</span>
							</label>

							<label class="block" in:fly={cascade(1)}>
								<span class="text-sm">Name <span class="text-ink/50">(optional)</span></span>
								<input
									name="name"
									autocomplete="name"
									value={values?.name ?? ''}
									class="mt-2 w-full rounded-xl border-rose/30 bg-cream text-sm focus:border-rose focus:ring-rose"
								/>
							</label>

							<fieldset in:fly={cascade(2)}>
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
								<p
									class="rounded-xl bg-cream p-3 text-sm text-rose-dark"
									role="alert"
									in:fly={{ y: -6, duration: md(300), easing: backOut }}
								>
									{form.error}
								</p>
							{/if}

							<div in:fly={cascade(3)}>
								<button
									bind:this={submitButton}
									class={['btn w-full btn-primary py-4', submitting && 'cursor-wait']}
									aria-busy={submitting}
								>
									{#if submitting}
										<span class="inline-flex items-center gap-3">
											Placing your order
											<!-- three little bubbles bobbing in turn -->
											<span class="inline-flex gap-1.5" aria-hidden="true">
												{#each [0, 1, 2] as i (i)}
													<span
														class="size-1.5 rounded-full border border-cream motion-safe:animate-[bob_0.9s_ease-in-out_infinite]"
														style:animation-delay="{i * 0.15}s"
													></span>
												{/each}
											</span>
										</span>
									{:else}
										Place order · {formatPrice(subtotal)}
									{/if}
								</button>
							</div>
						</form>
					{/if}
				</aside>
			</div>
		{/if}
	{/if}
</section>
