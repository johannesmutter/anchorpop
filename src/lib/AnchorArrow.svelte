<!-- @ts-nocheck -->
<script>
	import { get_fallback_id } from '$lib/fallback-utils.js';
	
	/**
	 * AnchorArrow - Arrow Component Connecting Two Anchors
	 * MIT License. Copyright (c) 2025 Johannes Mutter
	 * https://github.com/johannesmutter/anchorpop
	 *
	 * Creates a visual connection between two anchor elements using pure CSS 
	 * anchor positioning. Uses the "Proxy Pattern" to bridge stacking contexts.
	 * Originally designed for trigger-popover connections, but generalized to
	 * connect any two anchored elements.
	 * 
	 * ============================================================================
	 * ARCHITECTURE: THE TRIGGER PROXY PATTERN
	 * ============================================================================
	 * 
	 * Problem:
	 * --------
	 * The trigger button exists in the normal document flow, while the popover 
	 * and arrow are in the browser's "top layer" (a separate stacking context).
	 * 
	 * CSS anchor positioning has limited cross-stacking-context support:
	 * - Elements in the top layer can reference anchors from normal flow (one-way)
	 * - BUT elements in the top layer cannot reliably reference EACH OTHER when
	 *   one references an anchor from outside the top layer
	 * 
	 * Initial attempts failed because the arrow element (in top layer) tried to
	 * reference both:
	 * 1. The popover anchor (in top layer) ✓ works
	 * 2. The trigger anchor (in normal flow) ✗ doesn't work reliably
	 * 
	 * The arrow could reference the popover correctly but not the trigger, causing
	 * it to only partially track movement or collapse to minimal size.
	 * 
	 * Solution: Trigger Proxy Pattern
	 * --------------------------------
	 * We create an invisible "proxy" popover that acts as a bridge:
	 * 
	 * 1. Trigger Proxy (invisible popover in top layer)
	 *    - Has `popover="manual"` attribute to enter the top layer
	 *    - Uses `position-anchor` to follow the trigger button (cross-context reference)
	 *    - Creates its own anchor name (--trigger-proxy-anchor)
	 *    - Positioned at trigger's center with zero dimensions
	 *    - Visibility synced with main popover via JavaScript
	 * 
	 * 2. Arrow-Shape (popover in top layer)
	 *    - Also has `popover="manual"` to enter the top layer
	 *    - References TWO anchors that are BOTH in the top layer:
	 *      * --popover-anchor (the main popover)
	 *      * --trigger-proxy-anchor (the proxy)
	 *    - Can now reliably span between both points!
	 *    - Uses `top`, `left`, `bottom`, `right` with `anchor()` to span the area
	 * 
	 * Key Insights from Debugging:
	 * ----------------------------
	 * 1. All elements must have `popover` attribute to enter the top layer
	 * 2. All must use `position: fixed` (applied via [popover] selector)
	 * 3. `width: auto`, `height: auto` are critical for measuring/ sizing
	 * 4. `min()` and `max()` functions don't work with `anchor()` in current browsers
	 * 5. Multi-anchor spanning works perfectly when all elements are in the same
	 *    stacking context (verified with test cases)
	 * 
	 * Browser Limitation:
	 * -------------------
	 * This is a known limitation in CSS Anchor Positioning Level 1. The spec doesn't
	 * explicitly define behavior for cross-stacking-context multi-anchor references.
	 * The Trigger Proxy Pattern is the workaround until browsers improve this support.
	 * 
	 * This is pure CSS positioning - the proxy automatically tracks the trigger, and
	 * the arrow automatically spans between the proxy and popover. JavaScript is only
	 * used for syncing visibility (showing/hiding the proxy and arrow with the popover).
	 */

	let {
		/** @type {HTMLElement | null}
		 * Reference to the target element (e.g., popover) */
		target_ref = $bindable(),
		
		/** @type {string}
		 * Unique ID for this arrow instance */
		id,
		
		/** @type {string}
		 * Source anchor name - where the arrow starts from (e.g., "--anchor-item-1") */
		from_anchor,
		
		/** @type {string}
		 * Target anchor name - where the arrow points to (e.g., "--anchor-item-2") */
		to_anchor,
		
		/** @type {'outside'}
		 * Placement type */
		placement = 'outside',
		
		/** @type {string}
		 * CSS position-area value */
		position_area = 'y-end',
		
		/** @type {string}
		 * CSS align-self value (block axis) */
		align_self = 'start',
		
		/** @type {string}
		 * CSS justify-self value (inline axis) */
		justify_self = 'anchor-center',

		/** @type {Array<{position_area: string, align_self: string, justify_self: string}>}
		 * Fallback chain from parent popover */
		fallback_chain = [],
		
		/** @type {number}
		 * Target width (bound in parent) */
		target_width = $bindable(0),
		
		/** @type {number}
		 * Target height (bound in parent) */
		target_height = $bindable(0),
		
		/** @type {string}
		 * Arrow color (CSS color value) */
		arrow_color = 'black',
		
		/** @type {number}
		 * Arrow stroke width in pixels */
		arrow_stroke_width = 2,
		
		/** @type {{
		 *   start?: { show?: boolean, shape?: string, offset?: number },
		 *   end?: { show?: boolean, shape?: string, offset?: number }
		 * }}
		 * Arrow head configuration
		 * - start/end.show: Show this arrow head (default: true)
		 * - start/end.shape: CSS clip-path value, e.g. 'polygon(0% 0%, 100% 50%, 0% 100%)' for triangle, 'circle(50% at 50% 50%)' for circle (default: 'polygon(0% 0%, 100% 50%, 0% 100%)')
		 * - start/end.offset: Gap between line end and element boundary in pixels (default: 3 * stroke_width, so arrow head tip aligns with boundary)
		 * 
			* Note: Arrow head size is fixed at ARROW_HEAD_SIZE_MULTIPLIER x stroke_width (standard multiplier)
		*/
		arrow_heads = {
			start: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' },
			end: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' }
		},
	} = $props();

	const ARROW_HEAD_SIZE_MULTIPLIER = 3;

	// ============================================================================
	// STATE
	// ============================================================================

	/** @type {HTMLElement | null} */
	let from_proxy_ref = $state(null);
	let from_proxy_anchor = `--from-proxy-${id}`;

	/**
	 * Parse position_area and alignment to determine arrow direction
	 * @param {string} position_area_val - position-area value
	 * @param {string} align_self_val - align-self value
	 * @param {string} justify_self_val - justify-self value
	 * @returns {{vertical: string, horizontal: string}}
	 */
	function parse_direction(position_area_val, align_self_val, justify_self_val) {
		let vertical = 'bottom';
		let horizontal = 'right';
		
		// Vertical axis from position_area
		if (position_area_val.includes('y-start') || position_area_val.includes('block-start')) {
			vertical = 'top';
		} else if (position_area_val.includes('y-end') || position_area_val.includes('block-end')) {
			vertical = 'bottom';
		} else if (position_area_val.includes('x-start') || position_area_val.includes('x-end') || 
		           position_area_val.includes('inline-start') || position_area_val.includes('inline-end')) {
			vertical = align_self_val === 'stretch' ? 'stretch' : 'center';
		} else if (position_area_val === 'start' || position_area_val === 'start end') {
			vertical = 'top';
		} else if (position_area_val === 'end' || position_area_val === 'end start') {
			vertical = 'bottom';
		} else if (position_area_val.includes('span-all')) {
			vertical = align_self_val === 'stretch' ? 'stretch' : 'center';
		}
		
		// Horizontal axis from position_area
		if (position_area_val.includes('x-start') || position_area_val.includes('inline-start')) {
			horizontal = 'left';
		} else if (position_area_val.includes('x-end') || position_area_val.includes('inline-end')) {
			horizontal = 'right';
		} else if (position_area_val.includes('y-start') || position_area_val.includes('y-end') || 
		           position_area_val.includes('block-start') || position_area_val.includes('block-end')) {
			horizontal = justify_self_val === 'stretch' ? 'stretch' : 'center';
		} else if (position_area_val === 'start' || position_area_val === 'end start') {
			horizontal = 'left';
		} else if (position_area_val === 'end' || position_area_val === 'start end') {
			horizontal = 'right';
		} else if (position_area_val.includes('span-all')) {
			horizontal = justify_self_val === 'stretch' ? 'stretch' : 'center';
		}
		
		return { vertical, horizontal };
	}

	/**
	 * Determine arrow direction class based on placement
	 * For OUTSIDE placements, direction comes from position-area
	 */
	let arrow_direction_class = $derived.by(() => {
		if (placement !== 'outside') return 'arrow-bottom-right';
		const { vertical, horizontal } = parse_direction(position_area, align_self, justify_self);
		return `arrow-${vertical}-${horizontal}`;
	});


	/**
	 * Generate instance-specific CSS for scroll-driven dimension measurement
	 * Creates unique @property declarations, @keyframes, and timeline-scope per instance
	 * This prevents conflicts when multiple arrow instances exist simultaneously
	 */
	function generate_instance_css() {
		return `
		/* Instance-specific @property declarations for ${id} */
		@property --_tw-x-${id} {
			syntax: "<number>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --_tw-y-${id} {
			syntax: "<number>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --tw-${id} {
			syntax: "<integer>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --th-${id} {
			syntax: "<integer>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --_pw-x-${id} {
			syntax: "<number>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --_pw-y-${id} {
			syntax: "<number>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --pw-${id} {
			syntax: "<integer>";
			inherits: true;
			initial-value: 0;
		}
		
		@property --ph-${id} {
			syntax: "<integer>";
			inherits: true;
			initial-value: 0;
		}
		
		/* Instance-specific keyframes for ${id} */
		@keyframes x-${id} {
			to {
				--_tw-x-${id}: 1;
			}
		}
		
		@keyframes y-${id} {
			to {
				--_tw-y-${id}: 1;
			}
		}
		
		@keyframes px-${id} {
			to {
				--_pw-x-${id}: 1;
			}
		}
		
		@keyframes py-${id} {
			to {
				--_pw-y-${id}: 1;
			}
		}
		
		/* Target shared parent using :has() - applies timeline-scope to any element containing children with this arrow-id */
		*:has(> [data-arrow-id="${id}"]) {
			timeline-scope: --cx-${id}, --cy-${id}, --px-${id}, --py-${id};
			
			/* Dimension calculations (inherited by descendants) */
			--tw-${id}: calc(1 / (1 - var(--_tw-x-${id})));
			--th-${id}: calc(1 / (1 - var(--_tw-y-${id})));
			--pw-${id}: calc(1 / (1 - var(--_pw-x-${id})));
			--ph-${id}: calc(1 / (1 - var(--_pw-y-${id})));
			
			animation-name: x-${id}, y-${id}, px-${id}, py-${id};
			animation-timing-function: linear;
			animation-timeline: --cx-${id}, --cy-${id}, --px-${id}, --py-${id};
			animation-range: entry 100% exit 100%;
			animation-fill-mode: both;
		}
		
		/* Instance-specific timeline declarations for from-proxy */
		.from-proxy[data-arrow-id="${id}"]::before {
			view-timeline: --cx-${id} inline, --cy-${id} block;
		}
		
		/* Instance-specific timeline declarations for popover-content */
		#${id} > .popover-content::before {
			view-timeline: --px-${id} inline, --py-${id} block;
		}
		
		/* Instance-specific dimension variables for arrow-shape-line */
		.arrow-shape[data-arrow-id="${id}"] .arrow-shape-line {
			--tw: var(--tw-${id});
			--th: var(--th-${id});
			--pw: var(--pw-${id});
			--ph: var(--ph-${id});
		}
		`;
	}

	/**
	 * Generate @position-try rules and anchored container queries
	 * Defines fallback positions and detects which one is active
	 * 
	 * CRITICAL: We must use the actual anchor names (from_proxy_anchor, to_anchor)
	 * directly in the generated CSS, NOT CSS variables like var(--to-anchor).
	 * This is because @position-try rules in <svelte:head> can't access element-scoped
	 * CSS variables defined as inline styles.
	 * 
	 * CRITICAL: Rule names must be unique per arrow instance to prevent conflicts when
	 * multiple arrows exist simultaneously. Include the arrow's unique `id` in all rule names.
	 * Because position-try rules refer to the anchor by 'anchor_name'
	 */
	function generate_arrow_fallback_styles() {
		if (fallback_chain.length === 0) return '';
		
		/**
		 * BROWSER BUG WORKAROUND: Minimum dimension threshold for @position-try validation
		 * 
		 * When the browser evaluates @position-try fallback positions, it appears to reject
		 * fallbacks where the positioned element would have dimensions below a certain threshold
		 * (approximately 2px). This validation happens BEFORE min-width/min-height are applied.
		 * 
		 * Issue: When popover and trigger centers are aligned on the same axis (e.g., both
		 * vertically centered), the arrow's height should theoretically be 0px. However, if
		 * we calculate the exact center mathematically, the browser rejects the fallback as
		 * invalid, even though the element has min-width: 1px; min-height: 1px; in CSS.
		 * 
		 * Testing revealed:
		 * - Without offset: fallback rejected (dimension too close to 0)
		 * - With 1px offset: fallback rejected
		 * - With 2px offset: fallback accepted ✓
		 * 
		 * This threshold ensures fallbacks are considered valid by the browser's validation
		 * logic, while the actual rendered size still respects min-width/min-height constraints.
		 * 
		 * Context: Popover previously had 1px default border (removed), element has
		 * min-width: 1px and min-height: 1px. Absolute minimum threshold appears to be 2px.
     * The actual width and height of the arrow (borders, paddings, margins, …) influence this threshold.
     * The threshold has to be larger than the actual width and height of the arrow for fallback to work
		 */
		const FALLBACK_VALIDATION_THRESHOLD = '0.1px';
		
		/**
		 * Get edge assignments for a given direction
		 * Uses actual anchor names instead of CSS variables
		 * Also sets flip indicators for arrow-shape-line positioning
		 */
		// @ts-ignore
		function get_edge_assignments(vertical, horizontal) {
			// Helper: center coordinates per edge without using 'center' keyword
			// Note: bottom and right use FALLBACK_VALIDATION_THRESHOLD to ensure browser accepts fallbacks
			// @ts-ignore
			const center_top = (anchor_name) => `calc(anchor(${anchor_name} top) + anchor-size(${anchor_name} height) / 2)`;
			// @ts-ignore
			const center_bottom = (anchor_name) => `calc(anchor(${anchor_name} bottom) - ${FALLBACK_VALIDATION_THRESHOLD} + anchor-size(${anchor_name} height) / 2)`;
			// @ts-ignore
			const center_left = (anchor_name) => `calc(anchor(${anchor_name} left) + anchor-size(${anchor_name} width) / 2)`;
			// @ts-ignore
			const center_right = (anchor_name) => `calc(anchor(${anchor_name} right) - ${FALLBACK_VALIDATION_THRESHOLD} + anchor-size(${anchor_name} width) / 2)`;

			// Determine vertical edge assignments
			// For 'top' or 'stretch': use top=to, bottom=from (universally valid for stretched)
			// For 'bottom', 'center': use top=from, bottom=to
			const use_top_positioning = (vertical === 'top' || vertical === 'stretch');
			const top_val = use_top_positioning ? center_top(to_anchor) : center_top(from_proxy_anchor);
			const bottom_val = use_top_positioning ? center_bottom(from_proxy_anchor) : center_bottom(to_anchor);

			// Determine horizontal edge assignments
			// For 'left', 'center', 'stretch': use left=to, right=from (universally valid for stretched)
			// For 'right': use left=from, right=to
			const use_left_positioning = (horizontal === 'left' || horizontal === 'center' || horizontal === 'stretch');
			const left_val = use_left_positioning ? center_left(to_anchor) : center_left(from_proxy_anchor);
			const right_val = use_left_positioning ? center_right(from_proxy_anchor) : center_right(to_anchor);

			return {
				wrapper: `top: ${top_val};
					left: ${left_val};
					bottom: ${bottom_val};
					right: ${right_val};`,
				flip_y: use_top_positioning ? 1 : -1,
				flip_x: use_left_positioning ? 1 : -1
			};
		}
		
		// Generate @position-try rules with instance-specific names to prevent conflicts
		// Include arrow's unique `id` to ensure multiple arrows don't overwrite each other's rules
		const position_try_rules = fallback_chain.flatMap(config => {
			const fallback_id = get_fallback_id(placement, config);
			const { vertical, horizontal } = parse_direction(config.position_area, config.align_self, config.justify_self);
			
			// For horizontally stretched or centered fallbacks, generate TWO arrow rules (left and right)
			// This allows browser to choose based on trigger position relative to popover
			if (horizontal === 'stretch' || horizontal === 'center') {
				const left_data = get_edge_assignments(vertical, 'left');
				const right_data = get_edge_assignments(vertical, 'right');
				
				return [
					`@position-try --arrow-${id}-${fallback_id}-left {
						${left_data.wrapper}
					}`,
					`@position-try --arrow-${id}-${fallback_id}-right {
						${right_data.wrapper}
					}`
				];
			}
			
			// For vertically stretched or centered fallbacks, generate TWO arrow rules (top and bottom)
			if (vertical === 'stretch' || vertical === 'center') {
				const top_data = get_edge_assignments('top', horizontal);
				const bottom_data = get_edge_assignments('bottom', horizontal);
				
				return [
					`@position-try --arrow-${id}-${fallback_id}-top {
						${top_data.wrapper}
					}`,
					`@position-try --arrow-${id}-${fallback_id}-bottom {
						${bottom_data.wrapper}
					}`
				];
			}
			
			// For non-stretch/non-center fallbacks, generate single rule
			const data = get_edge_assignments(vertical, horizontal);
			
			return `@position-try --arrow-${id}-${fallback_id} {
				${data.wrapper}
			}`;
		}).join('\n');
		
		// Generate @container queries for arrow-shape-line flip indicators
		// Include instance-specific rule names to match @position-try rules above
		const container_queries_arrow_shape_line = fallback_chain.flatMap(config => {
			const fallback_id = get_fallback_id(placement, config);
			const { vertical, horizontal } = parse_direction(config.position_area, config.align_self, config.justify_self);
			
			if (horizontal === 'stretch' || horizontal === 'center') {
				const left_data = get_edge_assignments(vertical, 'left');
				const right_data = get_edge_assignments(vertical, 'right');
				
				return [
					`@container popover-arrow-shape-container anchored(fallback: --arrow-${id}-${fallback_id}-left) {
						.arrow-shape-line { --flip-y: ${left_data.flip_y}; --flip-x: ${left_data.flip_x}; }
					}`,
					`@container popover-arrow-shape-container anchored(fallback: --arrow-${id}-${fallback_id}-right) {
						.arrow-shape-line { --flip-y: ${right_data.flip_y}; --flip-x: ${right_data.flip_x}; }
					}`
				];
			}
			
			if (vertical === 'stretch' || vertical === 'center') {
				const top_data = get_edge_assignments('top', horizontal);
				const bottom_data = get_edge_assignments('bottom', horizontal);
				
				return [
					`@container popover-arrow-shape-container anchored(fallback: --arrow-${id}-${fallback_id}-top) {
						.arrow-shape-line { --flip-y: ${top_data.flip_y}; --flip-x: ${top_data.flip_x}; }
					}`,
					`@container popover-arrow-shape-container anchored(fallback: --arrow-${id}-${fallback_id}-bottom) {
						.arrow-shape-line { --flip-y: ${bottom_data.flip_y}; --flip-x: ${bottom_data.flip_x}; }
					}`
				];
			}
			
			const data = get_edge_assignments(vertical, horizontal);
			
			return `@container popover-arrow-shape-container anchored(fallback: --arrow-${id}-${fallback_id}) {
				.arrow-shape-line { --flip-y: ${data.flip_y}; --flip-x: ${data.flip_x}; }
			}`;
		}).join('\n');
		
		return '<' + 'style>' + position_try_rules + '\n' + container_queries_arrow_shape_line + '<' + '/style>';
	}

	let arrow_fallback_styles_html = $derived(generate_arrow_fallback_styles());
	let instance_css_html = $derived('<' + 'style>' + generate_instance_css() + '<' + '/style>');
	
	// ============================================================================
	// ARROW-SHAPE (PURE CSS)
	// ============================================================================
	
	/** @type {HTMLElement | null} */
	let arrow_shape_ref = $state(null);

	/**
	 * Sync arrow and from proxy visibility with target visibility
	 */
	$effect(() => {
		if (!target_ref || !from_proxy_ref || !arrow_shape_ref) return;

		/** @param {any} event */
		const handle_toggle = (event) => {
			if (event.newState === 'open') {
				from_proxy_ref?.showPopover?.();
				arrow_shape_ref?.showPopover?.();
			} else if (event.newState === 'closed') {
				from_proxy_ref?.hidePopover?.();
				arrow_shape_ref?.hidePopover?.();
			}
		};

		target_ref.addEventListener('toggle', handle_toggle);

		return () => {
			target_ref.removeEventListener('toggle', handle_toggle);
		};
	});
</script>

<!-- From Proxy: Invisible bridge to bring source anchor position into top layer -->
<div 
	bind:this={from_proxy_ref}
	class="from-proxy"
	data-arrow-id={id}
	popover="manual"
	style:--from-anchor={from_anchor}
	style:anchor-name={from_proxy_anchor}
	style:position-anchor={from_anchor}
	style:left={`anchor(${from_anchor} left)`}
	style:right={`anchor(${from_anchor} right)`}
	style:top={`anchor(${from_anchor} top)`}
	style:bottom={`anchor(${from_anchor} bottom)`}
>
</div>

<!-- Arrow-Shape -->
<div 
	bind:this={arrow_shape_ref}
	class="arrow-shape {arrow_direction_class}"
	data-arrow-id={id}
	popover="manual"
	style:--from-proxy-anchor={from_proxy_anchor}
	style:--to-anchor={to_anchor}
	style:--from-anchor={from_anchor}
	style:--arrow-color={arrow_color}
	style:--arrow-stroke-width={arrow_stroke_width}
	style:--arrow-head-start-show={arrow_heads?.start?.show ?? true ? 'block' : 'none'}
	style:--arrow-head-start-size="{ARROW_HEAD_SIZE_MULTIPLIER * arrow_stroke_width}px"
	style:--arrow-head-start-shape={arrow_heads?.start?.shape ?? 'polygon(0% 0%, 100% 50%, 0% 100%)'}
	style:--arrow-head-start-offset="{(arrow_heads?.start?.show ?? true) ? (arrow_heads?.start?.offset ?? ARROW_HEAD_SIZE_MULTIPLIER * arrow_stroke_width) : 0}px"
	style:--arrow-head-end-show={arrow_heads?.end?.show ?? true ? 'block' : 'none'}
	style:--arrow-head-end-size="{ARROW_HEAD_SIZE_MULTIPLIER * arrow_stroke_width}px"
	style:--arrow-head-end-shape={arrow_heads?.end?.shape ?? 'polygon(0% 0%, 100% 50%, 0% 100%)'}
	style:--arrow-head-end-offset="{(arrow_heads?.end?.show ?? true) ? (arrow_heads?.end?.offset ?? ARROW_HEAD_SIZE_MULTIPLIER * arrow_stroke_width) : 0}px"
	style:position-anchor={to_anchor}
	style:position-try={fallback_chain.length > 0 ? fallback_chain.flatMap(config => {
		const fallback_id = get_fallback_id(placement, config);
		const { vertical, horizontal } = parse_direction(config.position_area, config.align_self, config.justify_self);
		if (horizontal === 'stretch' || horizontal === 'center') return [`--arrow-${id}-${fallback_id}-left`, `--arrow-${id}-${fallback_id}-right`];
		if (vertical === 'stretch' || vertical === 'center') return [`--arrow-${id}-${fallback_id}-top`, `--arrow-${id}-${fallback_id}-bottom`];
		return `--arrow-${id}-${fallback_id}`;
	}).join(', ') : 'none'}
>
	<div class="arrow-shape-calc">
		<div class="arrow-shape-line">
			<div class="arrow-shape-line-visual"></div>
		</div>
	</div>
</div>

<!-- Dynamic instance-specific CSS and @position-try rules -->
<svelte:head>
	{@html instance_css_html}
	{@html arrow_fallback_styles_html}
</svelte:head>

<style>
	/* ========================================================================
	   CSS @property DECLARATIONS FOR SCROLL-DRIVEN DIMENSION MEASUREMENT
	   ======================================================================== */
	
	/* @property declarations are generated per-instance in generate_instance_css() to prevent conflicts when multiple arrows exist.
	   Each instance gets unique property names like --tw-${id}, --th-${id}, etc. */
	
	/* Unit conversion helpers for extracting unitless values from container queries
	   Based on: https://css-tricks.com/converting-css-lengths-to-unitless-values/ */
	@property --_wrapper-w-with-unit {
		syntax: "<length>";
		inherits: true;
		initial-value: 0px;
	}
	
	@property --_wrapper-h-with-unit {
		syntax: "<length>";
		inherits: true;
		initial-value: 0px;
	}
	
	/* CRITICAL: Aspect ratio as a number
	   
	   KEY LEARNING: When dividing two container query units (100cqh / 100cqw), 
	   the result is UNITLESS because the units cancel out. However, the browser
	   won't evaluate this division to a numeric value unless we use @property
	   with syntax: "<number>".
	   
	   Without @property: calc(100cqh / 100cqw) stays as a string "calc(...)"
	   With @property: calc(100cqh / 100cqw) evaluates to numeric value (e.g., 0.533291)
	   
	   This numeric value can then be used inside atan() for rotation calculations. */
	@property --diagonal-aspect-ratio {
		syntax: "<number>";
		inherits: true;
		initial-value: 1;
	}
	

	/* ========================================================================
	   TRIGGER PROXY & DIMENSION MEASUREMENT
	   ======================================================================== */
	
	/* The from proxy is an invisible popover that acts as a bridge between
	   the normal document flow (where the source anchor lives) and the top
	   layer (where the target and arrow live).
	   
	   It must:
	   - Have `popover="manual"` to enter the top layer
	   - Be positioned with inline `anchor()` styles referencing the source
	   - Create its own anchor name for the arrow-shape to reference
	   - Be synced visibility-wise with the target element
	   
	   Dimension measurement:
	   - Source dimensions (--tw, --th) are measured via from-proxy using scroll-driven animations
	   - Target dimensions (--pw, --ph) are measured via the target element itself
	   - Both use the same scroll-driven animation technique with view-timeline on ::before pseudo-elements
	   
	   Key learnings:
	   - Initially tried using CSS-only positioning, but inline styles work better
	   - Tried `top: anchor(left)` / `left: anchor(top)` (WRONG - axes were swapped!)
	   - Tried giving it full source dimensions with `anchor-size()` (caused issues)
	   - Final solution: zero dimensions at source center, positioned inline
	*/

	/* The :root animations, @keyframes, and timeline-scope are generated per-instance
	   in generate_instance_css() to prevent conflicts when multiple arrows exist.
	   Each instance gets unique timeline names like --cx-${id}, --cy-${id}, etc. */
	
	.from-proxy {
		position: fixed;
		width: auto;
		height: auto;
		
		/* Invisible */
		margin: 0;
		padding: 0;
		visibility: hidden;
		pointer-events: none;

		/* Make this a scroller for scroll-driven animations */
		overflow: hidden;
		
		/* Debugging - visual indicators to verify positioning */
		/* background: rgba(255, 0, 187, 0.464);
		outline: 2px solid rgb(255, 0, 221);
		outline-offset: 3px;
		visibility: visible !important; */
	}
	
	/* Subject for scroll-driven dimension measurement
	   The view-timeline is instance-specific (--cx-${id}, --cy-${id}) to prevent conflicts when multiple arrows exist */
	.from-proxy::before {
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width: 1px;
		aspect-ratio: 1;
	}


	/* ========================================================================
	   ARROW-SHAPE (PURE CSS)
	   ======================================================================== */
	
	/* Pure CSS arrow implementation using anchor-size() and container queries.
	   
	   Features:
	   - No JavaScript dimension bindings
	   - Direct edge positioning with parametric intersection calculations
	   - CSS variables for all dimensions via anchor-size()
	   - Container queries for self-measurement and fallback detection
	*/
	
	.arrow-shape {
		/* Animation variables */
		--arrow-transition-duration: 80ms;
		
		position: fixed;
		margin: 0;
		padding: 0;
		border: none;
		pointer-events: none;
		background: none;
		border: none;
		
		/* Allow natural spanning */
		width: auto;
		height: auto;
		
		/* Enable size AND anchored container queries */
		container-name: popover-arrow-shape-container;
		container-type: size anchored;
		
		/* CRITICAL: position-anchor must reference the TARGET (popover), not SOURCE (trigger)
		 * 
		 * Key Discovery: anchor() functions in edges calculate to static pixel values and
		 * don't update during scroll UNLESS position-anchor references an element being
		 * actively tracked (i.e., using position-area).
		 * 
		 * Why position-anchor: var(--to-anchor) works:
		 * - Target/popover uses position-area → browser actively tracks it during scroll
		 * - Arrow inherits that tracking behavior via position-anchor
		 * - Even though edges use anchor() to reference BOTH anchors, only the element
		 *   in position-anchor determines if positions update during scroll
		 * 
		 * ❌ If set to --from-anchor (trigger): Arrow stays fixed to viewport (trigger is
		 *    in normal flow, not actively tracked by anchor positioning system)
		 * ✅ If set to --to-anchor (popover): Arrow scrolls correctly (popover is tracked
		 *    via position-area, arrow inherits that tracking)
		 * 
		 * See AnchorPop.svelte gotcha #10 for full explanation. */
		position-anchor: var(--to-anchor);
		
		/* Allow overflow for arrow-shape-line */
		overflow: visible;
		
		/* Debugging - visual indicators */
		/* background: rgba(255, 165, 0, 0.5);
		outline: 0.5px solid orange;
		opacity: 1 !important;
		visibility: visible !important;
		display: block !important; */
	}
	
	/* Open state - normal scale and opacity with transitions */
	.arrow-shape:popover-open {
		opacity: 1;
		transform: scale(1);
		transition: 
			opacity var(--arrow-transition-duration) ease-out,
			transform var(--arrow-transition-duration) ease-out;
	}
	
	/* Starting state for fade-in and scale animation */
	@starting-style {
		.arrow-shape:popover-open {
			opacity: 0;
			transform: scale(0.9);
		}
	}
	
	/* Edge assignments for arrow-shape based on direction classes */
	.arrow-shape {
		&.arrow-top-left,
		&.arrow-top-center,
		&.arrow-top-stretch {
			top: calc(anchor(var(--to-anchor) top) + anchor-size(var(--to-anchor) height) / 2);
			left: calc(anchor(var(--to-anchor) left) + anchor-size(var(--to-anchor) width) / 2);
			bottom: calc(anchor(var(--from-proxy-anchor) bottom) + anchor-size(var(--from-proxy-anchor) height) / 2);
			right: calc(anchor(var(--from-proxy-anchor) right) + anchor-size(var(--from-proxy-anchor) width) / 2);
			--flip-y: 1;
			--flip-x: 1;
		}

		&.arrow-top-right {
			top: calc(anchor(var(--to-anchor) top) + anchor-size(var(--to-anchor) height) / 2);
			left: calc(anchor(var(--from-proxy-anchor) left) + anchor-size(var(--from-proxy-anchor) width) / 2);
			bottom: calc(anchor(var(--from-proxy-anchor) bottom) + anchor-size(var(--from-proxy-anchor) height) / 2);
			right: calc(anchor(var(--to-anchor) right) + anchor-size(var(--to-anchor) width) / 2);
			--flip-y: 1;
			--flip-x: -1;
		}

		&.arrow-bottom-left,
		&.arrow-bottom-center,
		&.arrow-bottom-stretch,
		&.arrow-center-left,
		&.arrow-stretch-left,
		&.arrow-stretch-stretch {
			top: calc(anchor(var(--from-proxy-anchor) top) + anchor-size(var(--from-proxy-anchor) height) / 2);
			left: calc(anchor(var(--to-anchor) left) + anchor-size(var(--to-anchor) width) / 2);
			bottom: calc(anchor(var(--to-anchor) bottom) + anchor-size(var(--to-anchor) height) / 2);
			right: calc(anchor(var(--from-proxy-anchor) right) + anchor-size(var(--from-proxy-anchor) width) / 2);
			--flip-y: -1;
			--flip-x: 1;
		}

		&.arrow-bottom-right,
		&.arrow-center-right,
		&.arrow-stretch-right {
			top: calc(anchor(var(--from-proxy-anchor) top) + anchor-size(var(--from-proxy-anchor) height) / 2);
			left: calc(anchor(var(--from-proxy-anchor) left) + anchor-size(var(--from-proxy-anchor) width) / 2);
			bottom: calc(anchor(var(--to-anchor) bottom) + anchor-size(var(--to-anchor) height) / 2);
			right: calc(anchor(var(--to-anchor) right) + anchor-size(var(--to-anchor) width) / 2);
			--flip-y: -1;
			--flip-x: -1;
		}
	}
	
	/* Intermediate wrapper for aspect ratio calculation
	   
	   KEY LEARNING #1: Cannot query container dimensions from the same element that
	   declares container-type: size. Need an intermediate child element.
	   
	   KEY LEARNING #2: Must explicitly set height: 100% and width: 100% to fill parent,
	   otherwise this element collapses to 0x0 and container queries fail.
	   
	   KEY LEARNING #3: Container query units (100cqw, 100cqh) refer to the PARENT's
	   container dimensions (arrow-shape), not this element's own dimensions. */
	.arrow-shape-calc {
		position: absolute;
		inset: 0;
		height: 100%;  /* CRITICAL: Without this, element collapses to 0 height */
		width: 100%;   /* CRITICAL: Without this, element collapses to 0 width */
		
		/* Convert container query units (100cqw, 100cqh) to unitless values
		   Using tan(atan2()) trick from: https://css-tricks.com/converting-css-lengths-to-unitless-values/
		   Here, 100cqw and 100cqh refer to arrow-shape's dimensions (parent container) */
		--_m: 3.35544e7; /* Largest value for most browsers */
		--_wrapper-w-with-unit: calc(100cqw * var(--_m));
		--_wrapper-w-unit: calc(var(--_wrapper-w-with-unit) / var(--_m)); /* = 1cqw */
		--ww-unitless: tan(atan2(100cqw, var(--_wrapper-w-unit))); /* = 100 */
		
		--_wrapper-h-with-unit: calc(100cqh * var(--_m));
		--_wrapper-h-unit: calc(var(--_wrapper-h-with-unit) / var(--_m)); /* = 1cqh */
		--wh-unitless: tan(atan2(100cqh, var(--_wrapper-h-unit))); /* = 100 */
		
		
		/* Calculate aspect ratio directly - when dividing lengths, units cancel out!
		   Combined with @property syntax: "<number>", this evaluates to a numeric value.
		   aspect_ratio = height / width (unitless) */
		--diagonal-aspect-ratio: calc(100cqh / 100cqw);
		
		/* Pre-calculate full diagonal length for use in arrow-shape-line-visual
		   This is the diagonal of the full wrapper (arrow-shape), not the trimmed line */
		--full-diagonal-length: hypot(100cqw, 100cqh);
	}
	
	/* Arrow-shape line - 100% PURE CSS with unit conversion!
	   
	   Uses scroll-driven animations to measure trigger dimensions (--tw, --th)
	   Uses container queries + unit conversion to get wrapper dimensions (inherited from arrow-shape-calc)
	   
	   Calculates parametric intersection points where the diagonal line crosses trigger
	   and popover boundaries, using universal positioning formulas with flip indicators.
	   
	   IMPORTANT: Flip values must be explicitly set here for each direction class,
	   not just inherited from parent, to ensure they're available in calculations.
	*/
	.arrow-shape-line {
		position: absolute;
		
		/* CRITICAL: Do NOT set height to stroke-width (e.g., 2px)!
		   
		   This element uses container-type: size, which means its 100cqw and 100cqh values
		   represent its own dimensions. If we set height to just the stroke width (2px),
		   then 100cqh = 2px, and any calculations using container query units will be
		   limited to this tiny height.
		   
		   Specifically, hypot(100cqw, 100cqh) in arrow-shape-line-visual would calculate
		   the diagonal of this 2px-tall box, not the full diagonal from trigger to popover.
		   The visual line length would be capped at sqrt(width² + 4), never extending
		   beyond the smaller of the wrapper's width or height.
		   
		   Solution: Set height to span the full trimmed diagonal (100% minus top/bottom offsets).
		   This ensures container query units reflect the actual trimmed line dimensions,
		   and hypot() calculates the correct full diagonal length.
		   The actual visual stroke width is applied to arrow-shape-line-visual. */
		
		/* Calculate parametric t values for boundary intersections
		   t = min(half_width / wrapper_width, half_height / wrapper_height) */
		--t-trigger-x: calc(var(--tw) / 2 / var(--ww-unitless));
		--t-trigger-y: calc(var(--th) / 2 / var(--wh-unitless));
		--t-trigger: min(var(--t-trigger-x), var(--t-trigger-y));
		
		/* Popover dimensions measured via scroll-driven animations */
		--t-popover-x: calc(var(--pw) / 2 / var(--ww-unitless));
		--t-popover-y: calc(var(--ph) / 2 / var(--wh-unitless));
		--t-popover: min(var(--t-popover-x), var(--t-popover-y));
		
		/* Universal positioning using flip indicators
		   100cqw/100cqh represent wrapper dimensions in container queries */
		--left: calc(
			((1 + var(--flip-x)) / 2) * var(--t-popover) * 100cqw +
			((1 - var(--flip-x)) / 2) * var(--t-trigger) * 100cqw
		);
		left: var(--left);
		
		--top: calc(
			((1 + var(--flip-y)) / 2) * var(--t-popover) * 100cqh +
			((1 - var(--flip-y)) / 2) * var(--t-trigger) * 100cqh
		);
		top: var(--top);
		
		--right: calc(
			((1 - var(--flip-x)) / 2) * var(--t-popover) * 100cqw +
			((1 + var(--flip-x)) / 2) * var(--t-trigger) * 100cqw
		);
		right: var(--right);
		
		--bottom: calc(
			((1 - var(--flip-y)) / 2) * var(--t-popover) * 100cqh +
			((1 + var(--flip-y)) / 2) * var(--t-trigger) * 100cqh
		);
		bottom: var(--bottom);

		/* Explicitly set width and height to ensure container query dimensions are correct */
		width: calc(100% - var(--left) - var(--right));
		height: calc(100% - var(--top) - var(--bottom));
		
		/* Make arrow-shape-line a container for size queries */
		container-type: size;
		overflow: visible;
	}
	
	/* Visual line element - renders the diagonal across arrow-shape-line's trimmed rectangle
	   arrow-shape-line has already been trimmed via parametric intersections (inset positioning),
	   so this element just draws a simple diagonal line across that trimmed rectangle */
	.arrow-shape-line-visual {
		position: absolute;
		background: var(--arrow-color, black);
		height: calc(var(--arrow-stroke-width) * 1px);
		
		/* Calculate diagonal length of the TRIMMED line (arrow-shape-line's dimensions)
		   and subtract arrow-head offsets from both ends.
		   
		   CRITICAL: Use 100cqw/100cqh which refer to arrow-shape-line's container dimensions
		   (the trimmed diagonal), NOT --full-diagonal-length which is the full wrapper diagonal.
		   
		   arrow-shape-line has already been trimmed via parametric positioning to exclude
		   the trigger and popover boxes. We want the visual line to span this trimmed diagonal,
		   minus the arrow-head offsets. */
		/* Calculate the diagonal of THIS trimmed container */
		--diagonal-length: hypot(100cqw, 100cqh);
		
		/* The visual line spans the trimmed diagonal minus arrow head offsets at both ends */
		width: calc(var(--diagonal-length) - var(--arrow-head-start-offset) - var(--arrow-head-end-offset));
		
		/* Position at the correct start corner based on flip values, then offset inward
		   
		   Start corner depends on flip values:
		   - flip-x=1, flip-y=1: left=0%, top=0% (top-left)
		   - flip-x=-1, flip-y=1: left=100%, top=0% (top-right)
		   - flip-x=1, flip-y=-1: left=0%, top=100% (bottom-left)
		   - flip-x=-1, flip-y=-1: left=100%, top=100% (bottom-right) */
		--start-corner-x: calc(((1 - var(--flip-x)) / 2) * 100%);
		--start-corner-y: calc(((1 - var(--flip-y)) / 2) * 100%);
		--offset-ratio: calc(var(--arrow-head-start-offset) / var(--diagonal-length));
		left: calc(var(--start-corner-x) + var(--offset-ratio) * var(--flip-x) * 100cqw);
		top: calc(var(--start-corner-y) + var(--offset-ratio) * var(--flip-y) * 100cqh);
		
		/* Calculate rotation angle using atan2 to correctly handle all quadrants
		   
		   CRITICAL: Using atan2(y, x) correctly handles all four quadrants, while
		   atan(y/x) * flip-x * flip-y only works correctly in two quadrants (fails
		   when the result needs to be in the range outside -90° to +90°).
		   
		   The flip values ensure the arrow rotates in the correct direction:
		   - flip-x controls horizontal direction (left vs right)
		   - flip-y controls vertical direction (up vs down) */
		--angle: atan2(
			calc(var(--flip-y) * 100cqh),
			calc(var(--flip-x) * 100cqw)
		);
		transform: rotate(var(--angle));
		transform-origin: left center;
	}
	
	/* Arrow heads */
	.arrow-shape-line-visual::before,
	.arrow-shape-line-visual::after {
		content: '';
		position: absolute;
		background: var(--arrow-color, black);
		pointer-events: none;
		top: 50%;
	}
	
	.arrow-shape-line-visual::before {
		display: var(--arrow-head-start-show);
		width: var(--arrow-head-start-size);
		height: var(--arrow-head-start-size);
		clip-path: var(--arrow-head-start-shape);
		left: 0;
		transform: translate(-50%, -50%) scaleX(-1);
	}
	
	.arrow-shape-line-visual::after {
		display: var(--arrow-head-end-show);
		width: var(--arrow-head-end-size);
		height: var(--arrow-head-end-size);
		clip-path: var(--arrow-head-end-shape);
		right: 0;
		transform: translate(50%, -50%);
	}
</style>

