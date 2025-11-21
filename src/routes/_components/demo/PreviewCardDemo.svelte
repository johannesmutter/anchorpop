<script>
	import { onMount } from 'svelte';
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'preview-demo',
		placement: 'outside',
		position_area: 'y-end',
		align_self: 'start',
		offset: 8,
		mode: 'manual'
	});

	onMount(() => {
		const preview_card = document.querySelector('.preview-card');
		if (preview_card && config.popover_ref) {
			preview_card.addEventListener('mouseenter', () => {
				config.popover_ref.showPopover();
			});
			preview_card.addEventListener('mouseleave', () => {
				config.popover_ref.hidePopover();
			});
		}
	});
</script>

<div class="use-case preview-container">
	<div class="preview-card" style="anchor-name: {config.from_anchor};">
		<div style="width: 100%; height: 120px; background: linear-gradient(135deg, #d5d5d5 0%, #999999 100%); border-radius: 4px; margin-bottom: 0.5rem; border: 2px solid #000;"></div>
		<strong style="display: block; margin-bottom: 0.25rem;">Preview Cards</strong>
		<p style="margin: 0; font-size: 0.875rem; opacity: 0.7;">Hover to see details</p>
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
	<div class="mini-demo-content">
		<strong>Extended Information</strong>
		<p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; line-height: 1.4;">Additional details and metadata appear when you hover over the preview card.</p>
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

	.mini-demo-content {
		font-family: 'Shantell Sans', cursive;
		font-size: 0.875rem;
		padding: 0.75rem 1rem;
		width: 250px;
	}

	.preview-card {
		width: 100%;
		max-width: 200px;
		cursor: pointer;
	}
</style>

