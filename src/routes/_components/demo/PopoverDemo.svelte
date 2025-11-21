<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import AnchorArrow from '$lib/AnchorArrow.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'simple-popover',
		placement: 'outside',
		position_area: 'start end',
		align_self: 'end',
		justify_self: 'start',
		offset: 30,
		mode: 'auto'
	});
</script>

<div class="use-case">
	<button 
		style="anchor-name: {config.from_anchor}" 
		popovertarget={config.id}
	>
		Popovers
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
	<div class="mini-demo-content">more demos coming soon...</div>
</AnchorPop>

<!-- Arrow component -->
{#if config.show_arrow}
	<AnchorArrow
		bind:target_ref={config.popover_ref}
		bind:target_width={config.popover_width}
		bind:target_height={config.popover_height}
		id={config.id}
		from_anchor={config.from_anchor}
		to_anchor={config.to_anchor}
		placement={config.placement}
		position_area={config.position_area}
		align_self={config.align_self}
		justify_self={config.justify_self}
		fallback_chain={config.fallback_chain}
		arrow_color={config.arrow_color}
		arrow_stroke_width={config.arrow_stroke_width}
		arrow_heads={config.arrow_heads}
	/>
{/if}

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
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.use-case button:hover {
		background: #ffffff;
		color: #000000;
	}

	.mini-demo-content {
		font-family: 'Shantell Sans', cursive;
		font-size: 0.875rem;
		padding: 0.75rem 1rem;
		min-width: 150px;
	}
</style>

