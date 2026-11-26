<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { cart } from '#lib/cart.svelte.ts';
	import Logo from './Logo.svelte';

	const links = [
		{ href: '/custom', label: 'Make it yours' },
		{ href: '/about', label: 'About' }
	] as const;

	let menuOpen = $state(false);

	// Close the mobile menu whenever the route changes.
	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});

	const isActive = (href: string) => page.url.pathname.startsWith(href);
</script>

<header class="sticky top-0 z-30 border-b border-rose/20 bg-cream/90 backdrop-blur">
	<div class="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 md:px-8">
		<button
			class="-ml-2 p-2 text-rose md:hidden"
			aria-label={menuOpen ? 'Close menu' : 'Open menu'}
			aria-expanded={menuOpen}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				{#if menuOpen}
					<path d="M6 6l12 12M18 6L6 18" />
				{:else}
					<path d="M4 8h16M4 16h16" />
				{/if}
			</svg>
		</button>

		<a href={resolve('/')} class="text-rose" aria-label="Aspris Swim home">
			<Logo class="h-12 w-auto md:h-14" />
		</a>

		<nav class="hidden flex-1 justify-end gap-8 md:flex" aria-label="Main">
			{#each links as link (link.href)}
				<a
					href={resolve(link.href)}
					class={[
						'text-xs tracking-[0.25em] uppercase transition-colors hover:text-rose',
						isActive(link.href) ? 'text-rose' : 'text-ink/80'
					]}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<a
			href={resolve('/cart')}
			class="relative -mr-2 p-2 text-rose"
			aria-label="Bag, {cart.count} items"
		>
			<svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M5 8h14l-1 12H6L5 8z" />
				<path d="M9 8V6a3 3 0 016 0v2" />
			</svg>
			{#if cart.count > 0}
				<span
					class="absolute top-0 right-0 grid size-4 place-items-center rounded-full bg-rose text-[10px] text-cream"
				>
					{cart.count}
				</span>
			{/if}
		</a>
	</div>

	{#if menuOpen}
		<nav class="border-t border-rose/20 px-5 pb-6 md:hidden" aria-label="Mobile">
			{#each links as link (link.href)}
				<a
					href={resolve(link.href)}
					class="block border-b border-rose/10 py-4 text-sm tracking-[0.25em] uppercase"
				>
					{link.label}
				</a>
			{/each}
		</nav>
	{/if}
</header>
