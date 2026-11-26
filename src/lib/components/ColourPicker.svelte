<script lang="ts">
	import type { Colour } from '#lib/catalogue.ts';

	let {
		colours,
		value = $bindable(),
		label = 'Colour',
		isDisabled = () => false
	}: {
		colours: Colour[];
		value?: string;
		label?: string;
		/** Return true to show a colour as sold out. */
		isDisabled?: (colourId: string) => boolean;
	} = $props();

	const selected = $derived(colours.find((c) => c.id === value));
</script>

<fieldset>
	<legend class="text-sm">
		{label}{#if selected}<span class="text-ink/60">&nbsp;— {selected.name}</span>{/if}
	</legend>
	<div class="mt-3 flex flex-wrap gap-3">
		{#each colours as colour (colour.id)}
			{@const disabled = isDisabled(colour.id)}
			{@const name = disabled ? `${colour.name} — sold out` : colour.name}
			<label class={['relative', disabled ? 'cursor-not-allowed' : 'cursor-pointer']} title={name}>
				<input type="radio" class="peer sr-only" bind:group={value} value={colour.id} {disabled} />
				<span
					class="block size-10 rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-cream transition peer-checked:ring-2 peer-checked:ring-rose peer-focus-visible:ring-2 peer-focus-visible:ring-rose peer-disabled:opacity-30"
					style:background-color={colour.hex}
				></span>
				{#if disabled}
					<!-- diagonal strike-through -->
					<span
						class="pointer-events-none absolute top-1/2 left-1/2 h-px w-11 -translate-1/2 -rotate-45 bg-ink/50"
					></span>
				{/if}
				<span class="sr-only">{name}</span>
			</label>
		{/each}
	</div>
</fieldset>
