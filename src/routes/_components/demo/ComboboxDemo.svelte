<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'combo-demo',
		placement: 'outside',
		position_area: 'y-end',
		align_self: 'start',
		offset: 4,
		mode: 'manual'
	});

	function handleInputInteraction(e) {
		if (config.popover_ref && !config.popover_ref.matches(':popover-open')) {
			config.popover_ref.showPopover();
		}
	}
</script>

<div class="use-case">
	<input 
		type="text" 
		placeholder="Comboboxes..." 
		onfocus={handleInputInteraction}
		onclick={handleInputInteraction}
		style="width: 100%; max-width: 200px; padding: 0.5rem; border: 2px solid #000; border-radius: 4px; font-family: 'Shantell Sans Light', monospace; anchor-name: {config.from_anchor};"
	>
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
		<div class="dropdown-item">JavaScript</div>
		<div class="dropdown-item">Python</div>
		<div class="dropdown-item">Rust</div>
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

