<script>
	import { onMount } from 'svelte';
	import AnchorPop from '$lib/AnchorPop.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';

	const config = new AnchorPopConfig({
		id: 'text-demo',
		placement: 'outside',
		position_area: 'y-start',
		align_self: 'end',
		justify_self: 'anchor-center',
		offset: 0,
		flip_axis: 'none',
		mode: 'manual'
	});

	let container_el;
	let current_selection_span = null;

	/**
	 * Handle text selection
	 */
	function handle_selection() {
		const selection = window.getSelection();
		
		// Remove previous selection span if exists
		if (current_selection_span) {
			const parent = current_selection_span.parentNode;
			const text = current_selection_span.textContent;
			parent.replaceChild(document.createTextNode(text), current_selection_span);
			current_selection_span = null;
		}

		// Hide popover if no selection
		if (!selection || !selection.toString().trim() || selection.rangeCount === 0) {
			config.popover_ref?.hidePopover();
			return;
		}

		const range = selection.getRangeAt(0);
		
		// Check if selection is within our container
		if (!container_el.contains(range.commonAncestorContainer)) {
			return;
		}

		// Create span to wrap selection
		const span = document.createElement('span');
		span.className = 'selection-anchor';
		span.style.anchorName = config.from_anchor;
		span.style.background = '#ffe4b5';
		span.style.outline = '1px solid #000000';
		span.style.outlineOffset = '1px';
		
		
		try {
			range.surroundContents(span);
			current_selection_span = span;
			
			// Show popover
			if (config.popover_ref) {
				config.popover_ref.showPopover();
			}
		} catch (e) {
			// If surroundContents fails (e.g., partial element selection), use extract/insert
			console.log('Selection wrapping failed:', e);
		}
	}

	onMount(() => {
		// Listen for mouseup to detect selection completion
		document.addEventListener('mouseup', handle_selection);
		
		return () => {
			document.removeEventListener('mouseup', handle_selection);
		};
	});
</script>

<div class="use-case text-editor-container">
	<div class="text-editor-demo" bind:this={container_el}>
		<p style="margin: 0; padding: 1rem; font-family: 'Shantell Sans', cursive; line-height: 1.6;">
			Select any text in this paragraph to see formatting tools appear above your selection.
		</p>
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
	<div class="text-tools">
		<button class="format-btn">B</button>
		<button class="format-btn italic">I</button>
		<button class="format-btn underline">U</button>
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

	.text-tools {
		display: flex;
		gap: 0.25rem;
		padding: 0.2rem;
	}

	.format-btn {
		padding: 0.25rem 0.5rem;
		background: #ffffff;
		border: none;
		border-radius: 3px;
		cursor: pointer;
		font-weight: bold;
		font-size: 0.875rem;
	}

	.format-btn.italic {
		font-style: italic;
		font-weight: normal;
	}

	.format-btn.underline {
		text-decoration: underline;
		font-weight: normal;
	}

	.text-editor-container {
		padding: 0;
	}

	.text-editor-demo {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: text;
		user-select: text;
	}
	.text-editor-demo::selection,
	.text-editor-demo *::selection,
	.text-editor-demo::-webkit-selection {
		background: #ffe4b5;
	}

	:global(.selection-anchor) {
		transition: background 0.15s ease;
	}
</style>

