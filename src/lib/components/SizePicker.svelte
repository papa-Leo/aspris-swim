<script lang="ts">
	import type { Size } from '#lib/data/catalogue.ts';

	let {
		sizes,
		value = $bindable(),
		label = 'Size'
	}: { sizes: Size[]; value?: Size; label?: string } = $props();
</script>

<fieldset>
	<legend class="text-sm">{label}</legend>
	<div class="mt-3 grid grid-cols-5 gap-2">
		{#each sizes as size (size)}
			<label class="cursor-pointer">
				<input type="radio" class="peer sr-only" bind:group={value} value={size} />
				<span
					class="block rounded-xl border border-rose/30 py-3 text-center text-sm transition peer-checked:border-rose peer-checked:bg-rose peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-rose hover:border-rose"
				>
					{size}
				</span>
			</label>
		{/each}
	</div>
</fieldset>
