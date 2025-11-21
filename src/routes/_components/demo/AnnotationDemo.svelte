<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'annotation-demo',
		placement: 'outside',
		position_area: 'y-start',
		align_self: 'end',
		offset: 8,
		mode: 'auto'
	});
</script>

<div class="use-case annotation-container">
	<p>Annotations/ Highlights</p>
	<div class="annotation-text">
		const <span 
			class="annotated" 
			style="anchor-name: {config.from_anchor}" 
			onclick={() => config.popover_ref?.showPopover()}
			onkeydown={(e) => e.key === 'Enter' && config.popover_ref?.showPopover()}
			role="button"
			tabindex="0"
		>config</span> = new AnchorPopConfig();
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
		<strong>Note:</strong> This needs review
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
		min-width: 150px;
	}

	.annotation-container {
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: center;
		padding: 1rem;
	}

	.annotation-text {
		font-family: 'Shantell Sans Light', monospace;
		font-size: 0.875rem;
		padding: 1rem;
		background: #f5f5f5;
		border: 1px solid #e5e5e5;
		border-radius: 4px;
	}

	.annotated {
		background: #ffe4b5;
		padding: 2px 4px;
		border-radius: 2px;
		cursor: pointer;
		text-decoration: underline;
		text-decoration-style: wavy;
		text-decoration-color: #ff6b00;
	}
</style>

