import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	environments: {
		ssr: {
			// SvelteKit stops Vite pre-bundling itself in the browser, but not on the server. When the
			// server pre-bundles it, `fail()` / `error()` / `redirect()` come from a second copy of Kit that
			// Kit doesn't recognise, so in dev they surface as 500s instead of 400/404 responses.
			optimizeDeps: { exclude: ['@sveltejs/kit'] }
		}
	}
});
