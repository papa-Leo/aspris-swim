<script lang="ts">
	import ProductImage from '#lib/components/ProductImage.svelte';
</script>

<svelte:head>
	<title>About · Aspris Swim</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-5 pt-12 md:px-8 md:pt-20">
	<p class="eyebrow">Our story</p>
	<h1 class="mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">Swimwear, made to be yours.</h1>

	<div class="mt-14 grid items-start gap-10 md:grid-cols-2 md:gap-16">
		<!-- TODO: founder / studio photo -->
		<ProductImage alt="The Aspris studio" class="aspect-[4/5]" />
		<div class="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-normal">
			<!-- TODO: replace with her real story -->
			<p>
				Aspris started with a simple idea: the perfect bikini is the one you design yourself. Every
				piece is made to order, in the colours and sizes you choose.
			</p>
			<h2>Made slowly</h2>
			<p>
				We cut and sew each piece once it's ordered, which means less waste and swimwear that's
				truly made for you.
			</p>
			<h2>Made for every body</h2>
			<p>Tops and bottoms are sized separately, so you never have to compromise on fit.</p>
		</div>
	</div>
</section>
