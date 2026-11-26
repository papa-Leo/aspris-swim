<script lang="ts">
	import { resolve } from '$app/paths';
	import ProductImage from '#lib/components/ProductImage.svelte';
	import WaveMark from '#lib/components/WaveMark.svelte';
</script>

<!-- Hero -->
<section class="mx-auto max-w-7xl px-5 pt-10 md:px-8 md:pt-16">
	<h1 class="text-center text-6xl leading-none tracking-wide text-rose md:text-[7rem]">
		Here we are, Aspris.
	</h1>

	<div class="relative mt-8 md:mt-12">
		<!-- TODO: replace with a hero campaign photo: <ProductImage src="/images/hero.jpg" ... /> -->
		<ProductImage alt="Aspris Swim custom bikinis" class="aspect-[4/5] md:aspect-[16/7]" />

		<div class="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-8 md:p-12">
			<a href={resolve('/custom')} class="btn btn-primary">Design your bikini</a>
		</div>

		<div
			class="absolute top-6 left-6 grid size-28 place-items-center rounded-full bg-cream text-center md:top-auto md:bottom-10 md:left-10 md:size-36"
		>
			<div>
				<p class="text-[10px] tracking-[0.3em] text-rose uppercase">New</p>
				<p class="font-serif text-lg leading-tight md:text-xl">10% off<br />first order</p>
			</div>
		</div>
	</div>
</section>

<!-- Who we are -->
<section class="mx-auto max-w-3xl px-5 py-24 text-center md:py-32">
	<p class="eyebrow">Who we are</p>
	<h2 class="mt-6 text-3xl leading-snug md:text-5xl">
		We're Aspris, and we want your swimwear to be as well.
	</h2>
	<a href={resolve('/about')} class="mt-10 btn btn-outline">Our story</a>
</section>

<!-- Custom bikini CTA -->
<section class="mx-auto max-w-7xl px-5 md:px-8">
	<div class="grid items-center gap-10 rounded-[2rem] bg-sand p-8 md:grid-cols-2 md:p-16">
		<div>
			<WaveMark class="h-8 w-auto text-rose" />
			<h2 class="mt-6 text-4xl md:text-6xl">Make it yours.</h2>
			<p class="mt-4 text-lg text-ink/70">Customise a bikini to suit you in every way.</p>
			<a href={resolve('/custom')} class="mt-8 btn btn-primary">Design your custom bikini</a>
		</div>
		<ProductImage alt="Custom bikini" class="aspect-square" />
	</div>
</section>

<!-- What we do -->
<section class="mx-auto max-w-5xl px-5 pt-24 text-center md:pt-32">
	<p class="eyebrow">What we do</p>
	<div class="mt-10 grid gap-12 md:grid-cols-3">
		{#each [{ title: 'Local is lekker', body: 'Every piece is hand made in Cape Town because we believe in supporting local artisans.' }, { title: 'Mix your sizes', body: 'Tops and bottoms are sized separately, because bodies are.' }, { title: 'Your colours', body: 'Pick from our palette and build a bikini that is completely you.' }] as point (point.title)}
			<div>
				<h3 class="text-2xl">{point.title}</h3>
				<p class="mt-3 text-sm leading-relaxed text-ink/70">{point.body}</p>
			</div>
		{/each}
	</div>
</section>
