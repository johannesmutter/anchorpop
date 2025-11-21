<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import AnchorArrow from '$lib/AnchorArrow.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const TOOLTIP_DELAY_MS = 500;

	const config = new AnchorPopConfig({
		id: 'tooltip-demo',
		placement: 'outside',
		position_area: 'y-start',
		align_self: 'end',
		offset: 12,
		mode: 'auto',
		flip_axis: 'all',
		arrow_color: '#000000',
	});

	/** @type {ReturnType<typeof setTimeout> | null} */
	let hover_timeout = null;
	let is_sticky = $state(false);
	let is_hovered = $state(false);

	/**
	 * Handle pointer enter event with delay
	 */
	function handle_pointer_enter() {
		is_hovered = true;
		if (is_sticky) {
			return;
		}
		hover_timeout = setTimeout(() => {
			if (is_hovered && !is_sticky) {
				config.popover_ref?.showPopover();
			}
		}, TOOLTIP_DELAY_MS);
	}

	/**
	 * Handle pointer leave event
	 */
	function handle_pointer_leave() {
		is_hovered = false;
		if (is_sticky) {
			return;
		}
		if (hover_timeout) {
			clearTimeout(hover_timeout);
			hover_timeout = null;
		}
		config.popover_ref?.hidePopover();
	}

	/**
	 * Handle click event to toggle tooltip sticky state
	 */
	function handle_click() {
		if (hover_timeout) {
			clearTimeout(hover_timeout);
			hover_timeout = null;
		}
		
		if (is_sticky) {
			// Toggle off sticky mode
			is_sticky = false;
			if (!is_hovered) {
				config.popover_ref?.hidePopover();
			}
		} else {
			// Toggle on sticky mode
			is_sticky = true;
			config.popover_ref?.showPopover();
		}
	}

	/**
	 * Handle keydown event to close sticky tooltip
	 * @param {KeyboardEvent} event
	 */
	function handle_keydown(event) {
		if (event.key === 'Escape' && is_sticky) {
			is_sticky = false;
			if (!is_hovered) {
				config.popover_ref?.hidePopover();
			}
		}
	}

	/**
	 * Handle keyboard interaction for tooltip trigger
	 * @param {KeyboardEvent} event
	 */
	function handle_trigger_keydown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handle_click();
		}
	}
</script>

<svelte:window onkeydown={handle_keydown} />

<div class="use-case">
	<p>
		Hover over the
		<button 
			class="tooltip-trigger"
			style="anchor-name: {config.from_anchor}" 
			popovertarget={config.id}
			role="button"
			tabindex="0"
			onpointerenter={handle_pointer_enter}
			onpointerleave={handle_pointer_leave}
		>
			dotted underline
		</button>
		to see the tooltip.
	</p>
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
	<div class="mini-demo-content">The stock market is crashing in 1,2,3…</div>
</AnchorPop>

<AnchorArrow
	id={config.id}
	from_anchor={config.from_anchor}
	to_anchor={config.to_anchor}
	position_area={config.position_area}
	align_self={config.align_self}
	justify_self={config.justify_self}
	fallback_chain={config.fallback_chain}
	target_ref={config.popover_ref}
	arrow_color={config.arrow_color}
	arrow_stroke_width={2}
	arrow_heads={{
		start: { show: false },
		end: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' }
	}}
/>

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

	.use-case p {
		font-size: 1rem;
		line-height: 1.6;
		margin: 0;
	}

	.tooltip-trigger {
		all: unset;
		border-bottom: 2px dotted #000000;
		cursor: pointer;
		text-decoration: none;
		user-select: none;
		display: inline;
		background: none;
	}

	.mini-demo-content {
		font-family: 'Shantell Sans', cursive;
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		background: #000000;
		color: #ffffff;
		min-width: 150px;
	}

</style>

