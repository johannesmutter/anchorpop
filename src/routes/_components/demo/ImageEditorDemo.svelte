<script>
	import { tick } from 'svelte';
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'editor-demo',
		placement: 'inside',
		position_area: 'center',
		align_self: 'start',
		justify_self: 'end',
		offset: 8,
		mode: 'manual'
	});

	// Show popover after it's bound - use untracked to avoid re-running
	let hasShown = false;
	$effect(() => {
		if (config.popover_ref && !hasShown) {
			hasShown = true;
			tick().then(() => {
				config.popover_ref?.showPopover();
			});
		}
	});
</script>

<div class="use-case image-editor-container">
	<p>Inside Overlays</p>
	<svg viewBox="0 0 200 150" class="image-placeholder" style="anchor-name: {config.from_anchor}">
		<rect width="200" height="150" fill="#e5e5e5" stroke="#000" stroke-width="2"/>
		<circle cx="60" cy="50" r="20" fill="#cccccc"/>
		<polygon points="0,150 100,80 200,150" fill="#999999"/>
		<text x="100" y="130" text-anchor="middle" font-family="Shantell Sans" font-size="12" fill="#000">Image</text>
	</svg>
</div>

<AnchorPop
	bind:ref={config.popover_ref}
	bind:popover_width={config.popover_width}
	bind:popover_height={config.popover_height}
	id={config.id}
	from_anchor={config.from_anchor}
	to_anchor={config.to_anchor}
	placement={config.placement}
	position_area={config.position_area}
	align_self={config.align_self}
	justify_self={config.justify_self}
	fallback_chain={config.fallback_chain}
	offset={config.offset}
	flip_axis={config.flip_axis}
	position_try_order={config.position_try_order}
	mode={config.mode}
>
	<div class="editor-tools">
		<button class="tool-btn">↻</button>
		<button class="tool-btn">✂</button>
		<button class="tool-btn">🎨</button>
	</div>
</AnchorPop>

<style>
	.use-case {
		font-family: 'Shantell Sans', cursive;
		padding: 1.5rem;
		border-radius: 4px;
		text-align: center;
		transition: all 0.15s ease;
		background: #ffffff;
		font-size: 1rem;
		min-width: 280px;
		min-height: 280px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.editor-tools {
		display: flex;
		gap: 0.25rem;
		padding: 0.375rem;
	}

	.tool-btn {
		padding: 0.375rem;
		background: oklch(100% 0 0 / 0.9);
		backdrop-filter: blur(8px);
		cursor: pointer;
		font-size: 0.875rem;
		border: none;
		&:not(:first-child) {
			border-left: 1px solid oklch(0% 0 0 / 0.1);
		}
	}

	.image-editor-container {
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
	}

	.image-placeholder {
		max-width: 200px;
		cursor: pointer;
	}
</style>

