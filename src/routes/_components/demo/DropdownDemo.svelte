<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'dropdown-demo',
		placement: 'outside',
		position_area: 'block-end',
		align_self: 'start',
		offset: 8,
		mode: 'auto'
	});
</script>

<div class="use-case">
	<button 
		style="anchor-name: {config.from_anchor}" 
		popovertarget={config.id}
	>
		Dropdowns
	</button>
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
		<div class="dropdown-item">🍎 Apple</div>
		<div class="dropdown-item">🍌 Banana</div>
		<div class="dropdown-item">🍒 Cherry</div>
		<div class="dropdown-item">🍊 Orange</div>
		<div class="dropdown-item">🍇 Grapes</div>
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

	.use-case button {
		font-family: 'Shantell Sans', cursive;
		padding: 1rem 2rem;
		background: #ffffff;
		color: #000000;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.use-case button:hover {
		background: #000000;
		color: #ffffff;
	}

	.mini-demo-content {
		font-family: 'Shantell Sans', cursive;
		font-size: 0.875rem;
		padding: 0.5rem;
		min-width: 150px;
	}

	.dropdown-item {
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.15s ease;
	}

	.dropdown-item:hover {
		background: #f5f5f5;
	}
</style>

