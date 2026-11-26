<script lang="ts">
	import type { Colour } from '#lib/data/catalogue.ts';

	let {
		colours,
		value = $bindable(),
		label = 'Colour'
	}: { colours: Colour[]; value?: string; label?: string } = $props();

	const selected = $derived(colours.find((c) => c.id === value));
</script>

<fieldset>
	<legend class="text-sm">
		{label}{#if selected}<span class="text-ink/60">&nbsp;— {selected.name}</span>{/if}
	</legend>
	<div class="mt-3 flex flex-wrap gap-3">
		{#each colours as colour (colour.id)}
			<label class="cursor-pointer" title={colour.name}>
				<input type="radio" class="peer sr-only" bind:group={value} value={colour.id} />
				<span
					class="block size-10 rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-cream transition peer-checked:ring-2 peer-checked:ring-rose peer-focus-visible:ring-2 peer-focus-visible:ring-rose"
					style:background-color={colour.hex}
				></span>
				<span class="sr-only">{colour.name}</span>
			</label>
		{/each}
	</div>
</fieldset>
