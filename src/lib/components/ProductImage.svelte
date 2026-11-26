<script lang="ts">
	import type { ClassValue } from 'svelte/elements';
	import WaveMark from './WaveMark.svelte';

	/**
	 * Shows a product photo, or a branded placeholder tinted with the product colour
	 * until real photography is added.
	 */
	let {
		src,
		alt,
		tint = '#b07f7b',
		class: className
	}: { src?: string; alt: string; tint?: string; class?: ClassValue } = $props();
</script>

<div class={['relative overflow-hidden rounded-3xl bg-sand', className]}>
	{#if src}
		<img {src} {alt} class="size-full object-cover" loading="lazy" />
	{:else}
		<div
			class="grid size-full place-items-center"
			style:background="radial-gradient(circle at 30% 20%, {tint}33, transparent 60%),
			radial-gradient(circle at 80% 90%, {tint}55, transparent 55%)"
			role="img"
			aria-label={alt}
		>
			<WaveMark class="w-1/3 text-rose/40" title="" />
		</div>
	{/if}
</div>
