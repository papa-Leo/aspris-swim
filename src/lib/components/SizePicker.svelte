<script lang="ts">
	import type { Size } from '#lib/catalogue.ts';

	let {
		sizes,
		value = $bindable(),
		label = 'Size',
		isDisabled = () => false
	}: {
		sizes: Size[];
		value?: Size;
		label?: string;
		/** Return true to show a size as sold out. */
		isDisabled?: (size: Size) => boolean;
	} = $props();
</script>

<fieldset>
	<legend class="text-sm">{label}</legend>
	<div class="mt-3 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-2">
		{#each sizes as size (size)}
			{@const disabled = isDisabled(size)}
			<label
				class={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
				title={disabled ? `${size} — sold out` : undefined}
			>
				<input
					type="radio"
					class="peer sr-only"
					bind:group={value}
					value={size}
					{disabled}
					aria-label={disabled ? `${size}, sold out` : size}
				/>
				<span
					class="block rounded-xl border border-rose/30 py-3 text-center text-sm transition peer-checked:border-rose peer-checked:bg-rose peer-checked:text-cream peer-focus-visible:ring-2 peer-focus-visible:ring-rose peer-disabled:border-ink/10 peer-disabled:text-ink/30 peer-disabled:line-through peer-enabled:hover:border-rose"
				>
					{size}
				</span>
			</label>
		{/each}
	</div>
</fieldset>
