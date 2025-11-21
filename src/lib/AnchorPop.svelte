<script>
	import { get_fallback_id } from '$lib/fallback-utils.js';
	
	/**
	 * AnchorPop - CSS Anchor Positioned Popover
	 * MIT License. Copyright (c) 2025 Johannes Mutter
	 * https://github.com/johannesmutter/anchorpop
	 * 
	 * Popover component using CSS anchor positioning for automatic placement and fallbacks.
	 * Use alongside AnchorArrow component for visual connection to trigger.
	 */

	// ============================================================================
	// PROPS
	// ============================================================================

	let {
		/** @type {import('svelte').HTMLProps<HTMLDivElement>}
		 * Reference to the popover element for programmatic control */
		ref = $bindable(),
		
		/** @type {'outside' | 'inside' | 'overlay' | 'border'}
		 * Semantic placement category (determines offset strategy) */
		placement = $bindable('outside'),

		/** @type {string}
		 * CSS position-area value (e.g., 'y-end', 'start', 'span-all') */
		position_area = $bindable('y-end'),

		/** @type {string}
		 * CSS align-self value (block axis alignment) */
		align_self = $bindable('start'),

		/** @type {string}
		 * CSS justify-self value (inline axis alignment) */
		justify_self = $bindable('anchor-center'),

		/** @type {'none' | 'x' | 'y' | 'diagonal' | 'all'}
		 * Controls which axes are allowed when flipping */
		flip_axis = $bindable('all'),
 
 		/** @type {number}
 		 * Offset distance from anchor (in pixels) */
 		offset = $bindable(8),
		
		/** @type {number}
		 * Popover width (bound automatically) */
		popover_width = $bindable(0),
		
		/** @type {number}
		 * Popover height (bound automatically) */
		popover_height = $bindable(0),

		/** @type {string}
		 * Unique ID that connects trigger, popover, and arrow */
		id,

		/** @type {'auto' | 'manual'}
		 * Popover mode: 'auto' (light dismiss) or 'manual' (programmatic control) */
		mode = 'auto',

		/** @type {boolean}
		 * Enable backdrop overlay (recommended for modal popovers only) */
		backdrop = false,
 
 		/** @type {'auto' | 'inline' | 'block' | 'normal'}
 		 * Controls position-try-order.
 		 * - auto: picks 'most-inline-size' for horizontal main axis, 'most-block-size' for vertical
 		 * - inline: force 'most-inline-size'
 		 * - block: force 'most-block-size'
 		 * - normal: use 'normal' */
 		position_try_order = $bindable('auto'),
 
		/** @type {string}
		 * Source anchor name - where the popover is anchored from (e.g., "--anchor-trigger") */
		from_anchor = `--anchor-${id}`,
		
		/** @type {string}
		 * Target anchor name - the popover's own anchor name (e.g., "--anchor-popover-${id}") */
		to_anchor = `--anchor-popover-${id}`,

		/** @type {Array<{position_area: string, align_self: string, justify_self: string}>}
		 * Fallback chain (computed by parent or passed in) */
		fallback_chain = $bindable([]),

		// Pass-through props
		children,
		...rest_props
	} = $props();


	// ============================================================================
	// INSIGHTS / WARNINGS (CSS Anchor Positioning Gotchas)
	// ============================================================================
	/**
	 * This section consolidates all known browser limitations, workarounds, and best practices
	 * discovered while implementing CSS Anchor Positioning with position-try fallbacks.
	 * 
	 * ═══════════════════════════════════════════════════════════════════════════
	 * CHROME / CHROMIUM ISSUES
	 * ═══════════════════════════════════════════════════════════════════════════
	 * 
	 * 1) AVOID 'center' in position-area on cross-axis for OUTSIDE placements
	 *    
	 *    Using values like 'center end' or 'start center' can cause Chrome to bail out
	 *    in constrained spaces and skip trying @position-try fallbacks. Prefer axis-
	 *    specific tokens instead (x-start/x-end or y-start/y-end) and use anchor-center
	 *    alignment on the cross-axis. This improves flip engagement in tight viewports.
	 *    
	 *    Reference: https://nerdy.dev/why-isnt-my-position-try-fallback-working-in-small-spaces
	 * 
	 * 2) @position-try fallback validation threshold
	 *    
	 *    When the browser evaluates @position-try fallback positions, it rejects fallbacks
	 *    where the positioned element would have dimensions below ~2px. This validation
	 *    happens BEFORE min-width/min-height are applied.
	 *    
	 *    Issue: When popover and trigger centers align on same axis, the arrow height/width
	 *    should be 0px. If we calculate exact center, browser rejects the fallback as invalid.
	 *    
	 *    Workaround: Add small offset (0.1px) to bottom/right anchor calculations to ensure
	 *    dimensions exceed validation threshold while maintaining visual accuracy.
	 *    
	 *    See: AnchorArrow.svelte line 255 (FALLBACK_VALIDATION_THRESHOLD)
	 * 
	 * ═══════════════════════════════════════════════════════════════════════════
	 * SAFARI LIMITATIONS
	 * ═══════════════════════════════════════════════════════════════════════════
	 * 
	 * 3) Safari does NOT update anchor positions with CSS transforms
	 *    
	 *    Safari doesn't recalculate anchor positions when the anchor element is moved using
	 *    CSS transforms (e.g., transform: translate()). This affects draggable triggers.
	 *    
	 *    Solution: Use layout positioning (position: relative/absolute with left/top) instead
	 *    of transforms to move the trigger element. Safari's anchor positioning DOES track
	 *    layout position changes.
	 *    
	 *    Example:
	 *    ❌ DON'T: style="transform: translate(100px, 50px)"  // Safari won't update
	 *    ✅ DO:    style="position: relative; left: 100px; top: 50px"  // Safari works
	 *    
	 *    This affects the trigger element with the anchor-name property. The popover and
	 *    arrow components will work correctly in Safari as long as the trigger uses layout
	 *    positioning instead of transforms.
	 * 
	 * ═══════════════════════════════════════════════════════════════════════════
	 * GENERAL BROWSER LIMITATIONS
	 * ═══════════════════════════════════════════════════════════════════════════
	 * 
	 * 4) Set 'position-try' directly inline, NOT via CSS variables
	 *    
	 *    Feeding the property through var() can be ignored at parse/evaluation time for
	 *    named @position-try references, leading to DevTools crossing it out and no flips.
	 *    Inline assignment ensures the engine applies the try list.
	 *    
	 *    ❌ DON'T: style:position-try={css_var} where css_var = "var(--my-fallbacks)"
	 *    ✅ DO:    style:position-try={css_fallbacks} where css_fallbacks = "--fallback1, --fallback2"
	 * 
	 * 5) min() and max() functions don't work with anchor() in current browsers
	 *    
	 *    Cannot use min(anchor(...), anchor(...)) or max(anchor(...), anchor(...)). 
	 *    Browser will ignore the entire rule.
	 *    
	 *    Workaround: Use direct anchor() calculations with manual edge assignment logic.
	 * 
	 * 6) Cross-stacking-context multi-anchor references
	 *    
	 *    Elements in the top layer (popover) can reference anchors from normal flow, but
	 *    elements in the top layer cannot reliably reference EACH OTHER when one references
	 *    an anchor from outside the top layer.
	 *    
	 *    Workaround: The "Trigger Proxy Pattern" - create an invisible proxy popover that
	 *    acts as a bridge, bringing the trigger position into the top layer. The arrow can
	 *    then reference both the popover and proxy (both in top layer).
	 *    
	 *    See: AnchorArrow.svelte line 10-69 for full architecture explanation
	 * 
	 * 7) @position-try rules can't access element-scoped CSS variables
	 *    
	 *    @position-try rules in <svelte:head> cannot access CSS variables defined as inline
	 *    styles on elements. Must use actual anchor names directly in generated CSS.
	 *    
	 *    ❌ DON'T: `top: anchor(var(--my-anchor) top)` in @position-try rule
	 *    ✅ DO:    `top: anchor(--trigger-my-id top)` with hardcoded anchor name
	 * 
	 * 8) box-sizing: border-box essential for position-try fallbacks
	 *    
	 *    If element uses content-box with borders, the total width/height (content + borders)
	 *    can exceed container, causing position-try to skip ALL fallbacks (element wouldn't
	 *    fit in ANY position).
	 *    
	 *    Solution: Always use box-sizing: border-box so borders are included in dimensions.
	 * 
	 * 9) Overflow handling for OUTSIDE stretch alignments
	 *    
	 *    Position-try requires the element to fit on ALL axes. If popover overflows (even on
	 *    the stretch axis), Chrome won't try fallbacks because element wouldn't fit anywhere.
	 *    
	 *    Solution for vertical stretch:
	 *    - height: 100% stretches to anchor height (with box-sizing: border-box)
	 *    - max-height: 100svh prevents exceeding viewport on stretch axis
	 *    - Allows position-try to properly evaluate positioning axis and engage fallbacks
	 *    
	 *    Solution for horizontal stretch:
	 *    - width: 100% stretches to anchor width
	 *    - max-width: 100svw prevents exceeding viewport on stretch axis
	 *    
	 *    Note: 100svh (small viewport height) accounts for mobile browser UI. This is NOT a
	 *    bug—it's intentional: an already-overflowing element can't be repositioned to fit.
	 * 
	 * 10) Scroll tracking with position-anchor
	 *     
	 *     CRITICAL: anchor() functions in top/left/bottom/right calculate to static pixel
	 *     values and don't update during scroll UNLESS position-anchor references an element
	 *     that's actively tracked (i.e., using position-area).
	 *     
	 *     Problem: Element with explicit anchor() edges stays fixed to viewport during scroll
	 *     Solution: Set position-anchor to an anchor that's already being tracked
	 *     
	 *     Example (AnchorArrow spanning trigger → popover):
	 *     ❌ BAD:  position-anchor: --trigger (normal flow, not tracked)
	 *            → Arrow stays fixed to viewport during scroll
	 *     ✅ GOOD: position-anchor: --popover (uses position-area, actively tracked)
	 *            → Arrow scrolls correctly with trigger and popover
	 *     
	 *     The element referenced in position-anchor acts as the "tracking anchor". Even though
	 *     the edges use anchor() to reference multiple anchors, only the position-anchor
	 *     determines if the browser continuously updates positions during scroll.
	 * 
	 * 11) Multi-instance arrow support requires unique timeline names and shared parent
	 *     
	 *     When multiple popovers with arrows exist simultaneously, scroll-driven animation
	 *     timeline names must be unique per instance to prevent measurement conflicts.
	 *     
	 *     Problem 1: Timeline-related properties (animation-timeline, timeline-scope, 
	 *     view-timeline) cannot use CSS variables—they must be literal strings at parse time.
	 *     
	 *     Problem 2: timeline-scope must be on a shared parent of both from-proxy and 
	 *     arrow-shape elements (siblings in top layer). Animation properties (animation-name,
	 *     animation-timeline, etc.) must also be declared on the shared parent to avoid
	 *     being overridden by other instances.
	 *     
	 *     Solution: Generate instance-specific CSS with :has() selector targeting shared parent:
	 *     - Use *:has(> [data-arrow-id="${id}"]) to target any parent containing children with this ID
	 *     - Declare timeline-scope, animation properties, and dimension calculations on parent
	 *     - @property declarations: --tw-${id}, --th-${id}, --pw-${id}, --ph-${id}
	 *     - @keyframes: x-${id}, y-${id}, px-${id}, py-${id}
	 *     - Timeline names: --cx-${id}, --cy-${id}, --px-${id}, --py-${id}
	 *     
	 *     ❌ DON'T: animation-timeline: var(--timeline-name)  // Not supported
	 *     ❌ DON'T: Put timeline-scope on :root  // Will be overridden by other instances
	 *     ✅ DO:    *:has(> [data-arrow-id="${id}"]) { timeline-scope: --cx-${id}, ... }
	 *     
	 *     See: AnchorArrow.svelte generate_instance_css() function
	 * 
	 * 12) Multi-instance @position-try rules must be unique per arrow instance
	 *     
	 *     When multiple arrows exist, their @position-try rules will overwrite each other
	 *     if they have the same placement configuration, causing arrows to reference the
	 *     wrong anchor elements after the overwrite.
	 *     
	 *     Problem: @position-try rule names were only based on placement config (e.g.,
	 *     `--arrow-outside_y-end_start_anchor-center`), not the arrow's unique ID. When a
	 *     second arrow with the same config generates its rules, it overwrites the first
	 *     arrow's rules with different anchor names (e.g., `--anchor-popover-tooltip-demo`
	 *     instead of `--anchor-popover-demo-popover`).
	 *     
	 *     Solution: Include arrow's unique `id` in all @position-try rule names and
	 *     corresponding position-try property references:
	 *     - @position-try rules: `--arrow-${id}-${fallback_id}` (not just `--arrow-${fallback_id}`)
	 *     - position-try property: reference these instance-specific rules
	 *     - Container queries: match the same instance-specific rule names
	 *     
	 *     ❌ DON'T: `@position-try --arrow-outside_y-end_start_anchor-center { ... }`
	 *     ✅ DO:    `@position-try --arrow-demo-popover-outside_y-end_start_anchor-center { ... }`
	 *     
	 *     See: AnchorArrow.svelte generate_arrow_fallback_styles() function
	 * 
	 */

	// ============================================================================
	// CSS CLASS NAME GENERATION
	// ============================================================================

	/**
	 * Generate CSS class name from current position properties
	 * Format: placement:position-area:align-self:justify-self
	 * Example: outside:y-end:start:anchor-center
	 */
	let css_class_name = $derived(
		`${placement}:${position_area.replace(/\s+/g, '-')}:${align_self}:${justify_self}`
	);
	
	// Generate CSS position-try-fallbacks string
	let css_fallbacks = $derived(
		fallback_chain.length > 0 
			? fallback_chain.map(config => `--${get_fallback_id(placement, config)}`).join(', ')
			: 'none'
	);

	/**
	 * Determine primary axis for position-try-order
	 * Only relevant for placements with fallbacks (outside, overlay)
	 * @returns {'horizontal' | 'vertical'}
	 */
	function get_primary_axis() {
		if (placement === 'outside') {
			// For outside, align_self determines primary axis
			return (align_self === 'start' || align_self === 'end') ? 'vertical' : 'horizontal';
		}
		
		if (placement === 'overlay') {
			// For overlay, position_area determines primary axis
			const is_horizontal_edge = position_area.includes('span-x-') || 
			                           position_area === 'center span-start' || 
			                           position_area === 'center span-end';
			
			if (is_horizontal_edge) return 'horizontal';
			return 'vertical';
		}
		
		// Default for placements without fallbacks (border, inside)
		return 'horizontal';
	}

	function resolve_position_try_order_value() {
		if (position_try_order === 'inline') return 'most-inline-size';
		if (position_try_order === 'block') return 'most-block-size';
		if (position_try_order === 'normal') return 'normal';
		return get_primary_axis() === 'vertical' ? 'most-block-size' : 'most-inline-size';
	}

	let position_try_order_value = $derived.by(() => resolve_position_try_order_value());

	/**
	 * Get flip values for animation direction based on position configuration
	 * Flip values determine the animation direction:
	 * - flip = 1 means slide towards end (down/right)
	 * - flip = -1 means slide towards start (up/left)
	 * - flip = 0 means no movement on that axis (centered)
	 * 
	 * Animation formula: calc(flip * -1 * distance)
	 * Examples:
	 * - Bottom (y-end): flip-y=1, flip-x=0 → starts translate3d(0, -8px, 0) (up, towards trigger above)
	 * - Top (y-start): flip-y=-1, flip-x=0 → starts translate3d(0, 8px, 0) (down, towards trigger below)
	 * - Right (inline-end): flip-x=1, flip-y=0 → starts translate3d(-8px, 0, 0) (left, towards trigger left)
	 * - Left (inline-start): flip-x=-1, flip-y=0 → starts translate3d(8px, 0, 0) (right, towards trigger right)
	 * 
	 * Handles both explicit axis keywords (y-start, inline-end) and shorthand (start, end, span-start, span-end):
	 * - "start" / "span-start" = block-start inline-start (top-left)
	 * - "end" / "span-end" = block-end inline-end (bottom-right)
	 * - "start end" / "span-start span-end" = block-start inline-end (top-right)
	 * - "end start" / "span-end span-start" = block-end inline-start (bottom-left)
	 * 
	 * @param {string} position_area_val
	 * @param {string} align_self_val
	 */
	function get_flip_values(position_area_val, align_self_val) {
		let flip_y = 0;  // Default: no vertical movement
		let flip_x = 0;  // Default: no horizontal movement
		
		// Split position_area into tokens to handle shorthand vs explicit syntax
		const tokens = position_area_val.trim().split(/\s+/);
		
		// Check for explicit vertical axis keywords
		if (position_area_val.includes('y-start') || position_area_val.includes('block-start')) {
			flip_y = -1;  // Top placement: slide from below (positive Y)
		} else if (position_area_val.includes('y-end') || position_area_val.includes('block-end')) {
			flip_y = 1;   // Bottom placement: slide from above (negative Y)
		} else {
			// Handle shorthand: first token is block-axis (vertical)
			if (tokens[0] === 'start' || tokens[0] === 'span-start') {
				flip_y = -1;  // Top placement
			} else if (tokens[0] === 'end' || tokens[0] === 'span-end') {
				flip_y = 1;   // Bottom placement
			}
		}
		
		// Check for explicit horizontal axis keywords
		if (position_area_val.includes('inline-start') || position_area_val.includes('x-start')) {
			flip_x = -1;  // Left placement: slide from right (positive X)
		} else if (position_area_val.includes('inline-end') || position_area_val.includes('x-end')) {
			flip_x = 1;   // Right placement: slide from left (negative X)
		} else {
			// Handle shorthand: second token is inline-axis (horizontal)
			// If only one token, it applies to both axes
			const inline_token = tokens.length > 1 ? tokens[1] : tokens[0];
			if (inline_token === 'start' || inline_token === 'span-start') {
				flip_x = -1;  // Left placement
			} else if (inline_token === 'end' || inline_token === 'span-end') {
				flip_x = 1;   // Right placement
			}
		}
		
		return { flip_x, flip_y };
	}

	/**
	 * Generate dynamic @position-try CSS rules and container queries for fallback positions
	 * 
	 * MARGIN STRATEGIES:
	 * 
	 * OUTSIDE: Margins computed in @position-try rules (applied to .popover)
	 * - Margins must be on .popover (shell) because arrow connects to its edges
	 * - Container queries can't target .popover (the container itself)
	 * - Solution: Calculate margins in @position-try rules with !important
	 * 
	 * OVERLAY: Margins computed in CSS formulas (applied to .popover-content)
	 * - Margins on .popover-content (child) so pointer-events trick works
	 * - Container queries CAN target .popover-content to update --flip-x/y
	 * - Solution: CSS formulas calc(max(0, var(--flip-x)) * var(--_offset))
	 */
	function generate_fallback_styles() {
		if (fallback_chain.length === 0) return '';
		
		const position_try_rules = fallback_chain.map(config => {
			const fallback_id = get_fallback_id(placement, config);
			const { flip_x, flip_y } = get_flip_values(config.position_area, config.align_self);
			
			// OUTSIDE: Calculate margins here (applied to .popover in @position-try rules)
			let margin_rules = '';
			if (placement === 'outside') {
				const margin_inline_start = flip_x === 1 ? 'var(--_offset) !important' : '0px !important';
				const margin_inline_end = flip_x === -1 ? 'var(--_offset) !important' : '0px !important';
				const margin_block_start = flip_y === 1 ? 'var(--_offset) !important' : '0px !important';
				const margin_block_end = flip_y === -1 ? 'var(--_offset) !important' : '0px !important';
				
				margin_rules = `
				margin-inline-start: ${margin_inline_start};
				margin-inline-end: ${margin_inline_end};
				margin-block-start: ${margin_block_start};
				margin-block-end: ${margin_block_end};`;
			}
			
			return `@position-try --${fallback_id} {
				position-area: ${config.position_area};
				align-self: ${config.align_self};
				justify-self: ${config.justify_self};
				${margin_rules}
			}`;
		}).join('\n');
		
		// Container queries update --flip-x/y for animations (all placements) and overlay margins (via CSS formulas)
		const container_queries = fallback_chain.map(config => {
			const fallback_id = get_fallback_id(placement, config);
			const { flip_x, flip_y } = get_flip_values(config.position_area, config.align_self);
			
			return `@container popover-container anchored(fallback: --${fallback_id}) {
				.popover-content { --flip-x: ${flip_x} !important; --flip-y: ${flip_y} !important; }
			}`;
		}).join('\n');
		
		return '<' + 'style>' + position_try_rules + '\n' + container_queries + '<' + '/style>';
	}

	let fallback_styles_html = $derived(generate_fallback_styles());
</script>


<!-- Popover element with its own anchor name -->
<!-- id is required for AnchorArrow's instance-specific timeline declarations for popover-content -->
<div
	bind:this={ref}
	bind:clientWidth={popover_width}
	bind:clientHeight={popover_height}
	{id}
	popover={mode === 'manual' ? 'manual' : 'auto'}
	role="dialog"
	aria-modal="true"
	class={`popover popover-${css_class_name} ${backdrop ? 'backdrop' : ''}`}
	style:--popover-offset={`${offset}px`}
	style:position-area={position_area}
	style:align-self={align_self}
	style:justify-self={justify_self}
	style:position-try={css_fallbacks}
	style:position-try-order={position_try_order_value}
	style:position-anchor={from_anchor}
	style:anchor-name={to_anchor}
	{...rest_props}
>
	<div class="popover-content">
		{@render children()}
	</div>
</div>

<!-- Dynamic @position-try rules for popover fallbacks -->
<svelte:head>
	{@html fallback_styles_html}
</svelte:head>

<style>
	/* ========================================================================
	   CSS VARIABLE OVERRIDES (for container queries)
	   ======================================================================== */

	.popover {
		/* Default theme variables - consistent naming with smart defaults */
		--popover-background: oklch(100% 0 0 / 0.95);
		--popover-border-color: oklch(90% 0 0);
		--popover-border-width: 1px;
		--popover-border-radius: 8px;
		--popover-backdrop-filter: blur(20px) saturate(180%);
		--popover-backdrop-background: oklch(0% 0 0);
		--popover-backdrop-opacity: 0.3;
		--popover-shadow: 0 4px 16px oklch(0% 0 0 / 0.1);
		--popover-transition-duration: 80ms;
		--popover-animation-distance: 8px;
		
		/* Flip indicators for animation direction (updated by CSS selectors and container queries)
		   1 = towards end, -1 = towards start, 0 = no movement on that axis */
		--flip-x: 0;
		--flip-y: 0;

		/* Internal variables with three-layer priority:
		   1. External override (--offset-override, etc.) - highest priority
		   2. Inline style (--popover-offset, etc.) - set by component
		   3. Default fallback - lowest priority
		   This allows external CSS to override without !important */
		--_offset: var(--offset-override, var(--popover-offset, 8px));
		--_position-area: var(--position-area-override, var(--position-area, center));
		--_align-self: var(--align-self-override, var(--align-self, center));
		--_justify-self: var(--justify-self-override, var(--justify-self, center));
		--_anchor-name: var(--anchor-name-override, var(--anchor-name, --my-anchor));
		
		/* Enable anchored container queries to detect fallback positioning */
		container-name: popover-container;
		container-type: anchored;

	/* ========================================================================
	   BASE POPOVER STYLES (Positioning Shell)
	   ======================================================================== */

		/* Reset UA defaults - make shell transparent */
		position: fixed;
		inset: auto;
		margin: unset;
		padding: 0;
		outline: none;
		border: none;
		background: none;

		/* Anchor positioning */
		position-anchor: var(--_anchor-name);
		position-area: var(--_position-area);
		align-self: var(--_align-self);
		justify-self: var(--_justify-self);
		position-visibility: anchors-visible;

		/* Visibility */
		visibility: hidden;
		pointer-events: none; /** disabled when closed */
		
		/* Allow child to overflow during animations */
		overflow: visible;
		
		/* Sizing defaults - let content determine size */
		width: fit-content;
		height: fit-content;
		min-width: min-content;
		min-height: min-content;
		
		/* CRITICAL: border-box ensures borders are included in width/height calculations.
		 * This is essential for position-try fallbacks: if the element itself overflows
		 * (e.g., content-box with 100% + borders), position-try won't engage because
		 * the element wouldn't fit in ANY position. */
		box-sizing: border-box;
	}

	/* Subject for scroll-driven dimension measurement (used by AnchorArrow) */
	.popover-content::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width: 1px;
		aspect-ratio: 1;
		view-timeline: --px inline, --py block;
	}

	/* ========================================================================
	   OPEN/CLOSE STATE TRANSITIONS
	   ======================================================================== */

	/* Open state */
	.popover:popover-open {
		visibility: visible;
		pointer-events: auto;
	}
	
	/* Popover content wrapper - handles all visual presentation and animations */
	.popover-content {
		/* Inherit flip indicators - defaults set here, overridden by CSS selectors below and container queries */
		height: inherit;
		width: inherit;
		min-width: inherit;
		min-height: inherit;
		max-width: inherit;
		max-height: inherit;
		
		/* Performance optimizations */
		will-change: transform;
		backface-visibility: hidden;
		
		/* Box model */
		box-sizing: border-box;
		
		/* Enable scroll-driven dimension measurement (via ::before pseudo-element) */
		position: relative;
		overflow: hidden;
		
		/* Visual styles */
		background-color: var(--popover-background);
		backdrop-filter: var(--popover-backdrop-filter);
		border-radius: var(--popover-border-radius);
		border: var(--popover-border-width) solid var(--popover-border-color);
		box-shadow: var(--popover-shadow);
		
		/* Layout */
		display: var(--popover-display, flex);
		flex-direction: var(--popover-flex-direction, column);
		
		/* Transition both transform and opacity */
		transition: 
			transform var(--popover-transition-duration) ease-out,
			opacity var(--popover-transition-duration) ease-out;
	}
	
	/* Open state - normal position, scale, and opacity */
	.popover:popover-open .popover-content {
		transform: translate3d(0, 0, 0) scale(1);
		opacity: 1;
	}
	
	/* Starting state - defines where animation begins when popover first opens */
	@starting-style {
		.popover:popover-open .popover-content {
			opacity: 0;
			transform: translate3d(
				calc(var(--flip-x) * -1 * var(--popover-animation-distance)),
				calc(var(--flip-y) * -1 * var(--popover-animation-distance)),
				0
			) scale(0.95);
		}
	}

	/* Backdrop - only apply when .backdrop class is present */
	.popover.backdrop::backdrop {
		background-color: var(--popover-backdrop-background);
		opacity: var(--popover-backdrop-opacity);
	}

	/* ========================================================================
	   FLIP DIRECTION INDICATORS
	   ======================================================================== */

	/* Set initial flip values based on position-area keywords in class name.
	   Class format: placement:position-area:align-self:justify-self
	   We need to match ONLY the position-area segment to avoid conflicts with align-self/justify-self. */
	
	.popover {
		/* Vertical (block) axis */
		&[class*="y-end"], &[class*="block-end"] { 
			--flip-y: 1;
		}
		&[class*="y-start"], &[class*="block-start"] { 
			--flip-y: -1;
		}
		
		/* Horizontal (inline) axis */
		&[class*="inline-end"], &[class*="x-end"] { 
			--flip-x: 1;
		}
		&[class*="inline-start"], &[class*="x-start"] { 
			--flip-x: -1;
		}
		
		/* block axis: position_area starts with "start" or "end" (after "popover-placement:") */
		&[class*="popover-outside:start"], &[class*="popover-inside:start"],
		&[class*="popover-overlay:start"], &[class*="popover-border:start"] {
			--flip-y: -1;
		}
		&[class*="popover-outside:end"], &[class*="popover-inside:end"],
		&[class*="popover-overlay:end"], &[class*="popover-border:end"] {
			--flip-y: 1;
		}
		
		/* inline axis: compound patterns (start-end, end-start, etc.) */
		&[class*="t-start:"], &[class*="d-start:"] { 
			--flip-x: -1;
		}
		&[class*="t-end:"], &[class*="d-end:"] { 
			--flip-x: 1;
		}
		
		/* single-token: "start" or "end" applies to BOTH axes (no hyphen) */
		&[class*="popover-outside:start:"], &[class*="popover-inside:start:"],
		&[class*="popover-overlay:start:"], &[class*="popover-border:start:"] {
			--flip-x: -1;
		}
		&[class*="popover-outside:end:"], &[class*="popover-inside:end:"],
		&[class*="popover-overlay:end:"], &[class*="popover-border:end:"] {
			--flip-x: 1;
		}
		
		/* OVERLAY-specific patterns with span-start and span-end */
		/* Vertical edges: span-start center (top) and span-end center (bottom) */
		&[class*="span-start-center"] {
			--flip-y: -1;
		}
		&[class*="span-end-center"] {
			--flip-y: 1;
		}
		
		/* Horizontal edges: center span-start (left) and center span-end (right) */
		&[class*="center-span-start"] {
			--flip-x: -1;
		}
		&[class*="center-span-end"] {
			--flip-x: 1;
		}
		
		/* Overlay corners: span-start (top-left), span-end (bottom-right) */
		&[class*="popover-overlay:span-start:"] {
			--flip-y: -1;
			--flip-x: -1;
		}
		&[class*="popover-overlay:span-end:"] {
			--flip-y: 1;
			--flip-x: 1;
		}
		
		/* Overlay corners: span-start span-end (top-right), span-end span-start (bottom-left) */
		&[class*="span-start-span-end"] {
			--flip-y: -1;
			--flip-x: 1;
		}
		&[class*="span-end-span-start"] {
			--flip-y: 1;
			--flip-x: -1;
		}
	}

	/* Backdrop fade-in animation */
	@keyframes popover-backdrop-fade-in {
		from {
			opacity: 0;
		}
	}

	.popover.backdrop:popover-open::backdrop {
		animation: popover-backdrop-fade-in var(--popover-transition-duration);
	}


	/* ========================================================================
	   OFFSET APPLICATION
	   ======================================================================== */

	/* OUTSIDE: directional margins push away from anchor
	 * Margins on .popover (shell) because arrow connects to .popover edges */
	.popover[class*="popover-outside:"] {
		&[class*="y-end"], &[class*="block-end"] { margin-block-start: var(--_offset); }
		&[class*="y-start"], &[class*="block-start"] { margin-block-end: var(--_offset); }
		&[class*="inline-end"], &[class*="x-end"] { margin-inline-start: var(--_offset); }
		&[class*="inline-start"], &[class*="x-start"] { margin-inline-end: var(--_offset); }
		
		/* Diagonals */
		&[class*="outside:start:"] { margin-block-end: var(--_offset); margin-inline-end: var(--_offset); }
		&[class*="outside:end:"] { margin-block-start: var(--_offset); margin-inline-start: var(--_offset); }
		&[class*="t-start:"], &[class*="d-start:"] { margin-inline-end: var(--_offset); }
		&[class*="t-end:"], &[class*="d-end:"] { margin-inline-start: var(--_offset); }
	}

	/* OUTSIDE STRETCH: Remove margin on stretching axis */
	/* Vertical stretch (span-all inline-start/end): remove block-axis margin, keep inline-axis margin */
	.popover[class*=":span-all-inline-start:"],
	.popover[class*=":span-all-inline-end:"] {
		margin-block: 0;
		/* CRITICAL: Position-try fallbacks require the element to fit on ALL axes.
		 * If the popover itself overflows (even on the stretch axis), Chrome won't
		 * try fallback positions because the element wouldn't fit anywhere.
		 * 
		 * Solution:
		 * - height: 100% stretches to anchor height (with box-sizing: border-box)
		 * - max-height: 100svh prevents exceeding viewport on stretch axis
		 * - This allows position-try to properly evaluate positioning axis overflow
		 *   and engage fallbacks (e.g., flip from right to left)
		 * 
		 * Note: 100svh (small viewport height) accounts for mobile browser UI.
		 * This is NOT a bug—it's intentional behavior: an already-overflowing
		 * element can't be repositioned to fit.
		 */
		height: 100%;
		max-height: 100svh;
	}

	/* Horizontal stretch (block-start/end span-all): remove inline-axis margin, keep block-axis margin */
	.popover[class*=":block-start-span-all:"],
	.popover[class*=":block-end-span-all:"] {
		margin-inline: 0;
		/* CRITICAL: Same principle as vertical stretch (see above).
		 * - width: 100% stretches to anchor width (with box-sizing: border-box)
		 * - max-width: 100svw prevents exceeding viewport on stretch axis
		 * - Enables position-try to flip on positioning axis (e.g., top to bottom)
		 */
		width: 100%;
		max-width: 100svw;
	}

	/* INSIDE: inset from anchor edges */
	.popover[class*="popover-inside:"] {
		inset: var(--_offset);
	}

	/* INSIDE STRETCH: explicitly fill dimension */
	/* Horizontal stretch (justify_self = stretch, last part of class) */
	.popover[class*="inside:center:center:stretch"],
	.popover[class*="inside:center:stretch:stretch"] {
		width: 100%;
	}
	
	/* Horizontal stretch with start/end alignment needs offset compensation */
	.popover[class*="inside:center:start:stretch"],
	.popover[class*="inside:center:end:stretch"] {
		width: calc(100% - 2 * var(--_offset));
	}

	/* Vertical stretch (align_self = stretch, third part of class) */
	.popover[class*="inside:center:stretch:center"],
	.popover[class*="inside:center:stretch:stretch"] {
		height: 100%;
	}
	
	/* Vertical stretch with start/end alignment needs offset compensation */
	.popover[class*="inside:center:stretch:start"],
	.popover[class*="inside:center:stretch:end"] {
		height: calc(100% - 2 * var(--_offset));
	}

	/* OVERLAY: directional margins push away from trigger center
	 * Margins on .popover-content (not .popover) so container queries can update them on flip
	 * Use pointer-events trick so clicking margin area dismisses popover
	 * Margins calculated using CSS formulas with --flip-x and --flip-y variables */
	.popover[class*="popover-overlay:"]:popover-open {
		/* Make shell click-through (pointer-events trick) - only when open */
		pointer-events: none;
		
		/* Re-enable pointer events on content */
		.popover-content {
			pointer-events: auto;
			
			/* CSS formulas for directional margins based on flip values:
			 * flip-x/y = 1 (end) → margin on start side
			 * flip-x/y = -1 (start) → margin on end side */
			margin-inline-start: calc(max(0, var(--flip-x)) * var(--_offset));
			margin-inline-end: calc(max(0, var(--flip-x) * -1) * var(--_offset));
			margin-block-start: calc(max(0, var(--flip-y)) * var(--_offset));
			margin-block-end: calc(max(0, var(--flip-y) * -1) * var(--_offset));
		}
	}
	
	/* OVERLAY: Fixed dimensions for testing */
	/* Exclude variants that are confined to one row/column (should align with trigger size) */
	.popover[class*="popover-overlay:"]:not([class*="center-span-end"]):not([class*="center-span-start"]):not([class*="center-span-all"]) {
		/* FOR DEBUGGING */
		/* height: 300px; */
	}
	/* FOR DEBUGGING: fixed dimensions */
	.popover[class*="popover-overlay:"]:not([class*="span-end-center"]):not([class*="span-start-center"]):not([class*="span-all-center"]) {
		/* width: 300px; */
	}

	/* BORDER: offset shifts position from edge */
	.popover[class*="popover-border:"] {
		/* Offset applied via margin to shift away from edge */
		margin: var(--_offset);
	}

	/* ========================================================================
	   BORDER TRANSFORMS (center on edge/corner)
	   ======================================================================== */

	/* Corner placements: center on corner point */
	.popover[class*="border:center:start:start"] { transform: translate(-50%, -50%); }
	.popover[class*="border:center:end:start"] { transform: translate(-50%, 50%); }
	.popover[class*="border:center:start:end"] { transform: translate(50%, -50%); }
	.popover[class*="border:center:end:end"] { transform: translate(50%, 50%); }

	/* Edge center placements: center on edge */
	.popover[class*="border:center:start:center"] { transform: translateY(-50%); }
	.popover[class*="border:center:end:center"] { transform: translateY(50%); }
	.popover[class*="border:center:center:start"] { transform: translateX(-50%); }
	.popover[class*="border:center:center:end"] { transform: translateX(50%); }

	/* ========================================================================
	   BORDER STRETCH (full width/height along edges)
	   ======================================================================== */

	/* Horizontal stretch (top and bottom edges) */
	.popover[class*="border:center:start:stretch"],
	.popover[class*="border:center:end:stretch"] {
		width: calc(100% - 2 * var(--_offset));
		transform: translateY(-50%);
	}
	
	.popover[class*="border:center:end:stretch"] {
		transform: translateY(50%);
	}

	/* Vertical stretch (left and right edges) */
	.popover[class*="border:center:stretch:start"],
	.popover[class*="border:center:stretch:end"] {
		height: calc(100% - 2 * var(--_offset));
		transform: translateX(-50%);
	}
	
	.popover[class*="border:center:stretch:end"] {
		transform: translateX(50%);
	}
</style>