<script lang="ts">
	import { resolve } from '$app/paths';
	import WaveMark from './WaveMark.svelte';
</script>

<footer class="mt-24 border-t border-rose/20">
	<div class="mx-auto grid max-w-7xl gap-12 px-5 py-16 md:grid-cols-3 md:px-8">
		<div class="md:col-span-2">
			<WaveMark class="h-8 w-auto text-rose" />
			<p class="mt-4 max-w-sm font-serif text-2xl">Swimwear made for you, in your colours.</p>
		</div>

		<div>
			<p class="eyebrow">Aspris</p>
			<ul class="mt-4 space-y-2 text-sm">
				<li><a class="hover:text-rose" href={resolve('/custom')}>Design your bikini</a></li>
				<li><a class="hover:text-rose" href={resolve('/about')}>Our story</a></li>
				<!-- TODO: real social link -->
				<li><a class="hover:text-rose" href="https://instagram.com">Instagram</a></li>
			</ul>
		</div>
	</div>
	<p class="pb-8 text-center text-xs tracking-[0.2em] text-ink/50 uppercase">
		© {new Date().getFullYear()} Aspris Swim
	</p>
</footer>
