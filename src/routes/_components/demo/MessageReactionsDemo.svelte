<script>
	import { tick } from 'svelte';
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'reaction-demo',
		placement: 'border',
		position_area: 'center',
		align_self: 'end',
		justify_self: 'end',
		offset: 0,
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

<div class="use-case speech-bubble-container">
	<p>Border Overlays</p>
	<div class="speech-bubble" style="anchor-name: {config.from_anchor}">
		Hey! Great work on this project 👏
	</div>
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
	<div class="reaction-content">
		<button class="reaction-btn">👍</button>
		<button class="reaction-btn">❤️</button>
		<button class="reaction-btn">😂</button>
		<button class="reaction-btn">🎉</button>
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

	.speech-bubble-container {
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
	}

	.speech-bubble {
		position: relative;
		background: #ffffff;
		border: 2px solid #000000;
		border-radius: 12px;
		padding: 0.75rem 1rem;
		font-family: 'Shantell Sans', cursive;
		max-width: 200px;
		line-height: 1.4;
	}

	.speech-bubble::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 10px;
		width: 0;
		height: 0;
		border: 8px solid transparent;
		border-top-color: #000000;
		border-left-color: #000000;
		transform: translateY(100%);
	}

	.speech-bubble::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: 12px;
		width: 0;
		height: 0;
		border: 6px solid transparent;
		border-top-color: #ffffff;
		border-left-color: #ffffff;
		transform: translateY(100%);
		z-index: 1;
	}

	.reaction-content {
		display: flex;
		gap: 0.25rem;
		padding: 0.25rem;
	}

	.reaction-btn {
		background: transparent;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: background 0.15s ease;
	}

	.reaction-btn:hover {
		background: rgba(0, 0, 0, 0.05);
	}
</style>

