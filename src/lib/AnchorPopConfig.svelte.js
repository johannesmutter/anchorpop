import { get_fallback_chain } from '$lib/fallback-utils.js';

/**
 * Generate a unique ID for popover instances
 */
function generate_id() {
	return `anchorpop-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * AnchorPopConfig - Configuration class for AnchorPop components
 * 
 * Encapsulates all state and configuration for a popover with smart defaults.
 * Uses Svelte 5 runes for reactivity.
 * 
 * @example
 * ```js
 * const config = new AnchorPopConfig({
 *   placement: 'outside',
 *   position_area: 'y-end'
 * });
 * ```
 */
export class AnchorPopConfig {
	/** @type {string} Unique ID for this popover */
	id = $state('');
	
	/** @type {'outside' | 'inside' | 'overlay' | 'border'} */
	placement = $state('outside');
	
	/** @type {string} */
	position_area = $state('y-end');
	
	/** @type {string} */
	align_self = $state('start');
	
	/** @type {string} */
	justify_self = $state('anchor-center');
	
	/** @type {number} */
	offset = $state(8);
	
	/** @type {'none' | 'x' | 'y' | 'diagonal' | 'all'} */
	flip_axis = $state('all');
	
	/** @type {'auto' | 'inline' | 'block' | 'normal'} */
	position_try_order = $state('auto');
	
	/** @type {'auto' | 'manual'} */
	mode = $state('auto');
	
	/** @type {string} */
	arrow_color = $state('black');
	
	/** @type {number} */
	arrow_stroke_width = $state(2);
	
	/** @type {{start?: {show?: boolean, shape?: string, offset?: number}, end?: {show?: boolean, shape?: string, offset?: number}}} */
	arrow_heads = $state({
		start: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' },
		end: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' }
	});
	
	/** @type {HTMLElement | null} */
	popover_ref = $state(null);
	
	/** @type {number} */
	popover_width = $state(0);
	
	/** @type {number} */
	popover_height = $state(0);
	
	/**
	 * @param {Partial<{
	 *   id: string,
	 *   placement: 'outside' | 'inside' | 'overlay' | 'border',
	 *   position_area: string,
	 *   align_self: string,
	 *   justify_self: string,
	 *   offset: number,
	 *   flip_axis: 'none' | 'x' | 'y' | 'diagonal' | 'all',
	 *   position_try_order: 'auto' | 'inline' | 'block' | 'normal',
	 *   mode: 'auto' | 'manual',
	 *   arrow_color: string,
	 *   arrow_stroke_width: number,
	 *   arrow_heads: {start?: {show?: boolean, shape?: string, offset?: number}, end?: {show?: boolean, shape?: string, offset?: number}}
	 * }>} [options={}]
	 */
	constructor(options = {}) {
		// Generate ID if not provided
		this.id = options.id ?? generate_id();
		
		// Override defaults with provided options
		if (options.placement !== undefined) this.placement = options.placement;
		if (options.position_area !== undefined) this.position_area = options.position_area;
		if (options.align_self !== undefined) this.align_self = options.align_self;
		if (options.justify_self !== undefined) this.justify_self = options.justify_self;
		if (options.offset !== undefined) this.offset = options.offset;
		if (options.flip_axis !== undefined) this.flip_axis = options.flip_axis;
		if (options.position_try_order !== undefined) this.position_try_order = options.position_try_order;
		if (options.mode !== undefined) this.mode = options.mode;
		if (options.arrow_color !== undefined) this.arrow_color = options.arrow_color;
		if (options.arrow_stroke_width !== undefined) this.arrow_stroke_width = options.arrow_stroke_width;
		if (options.arrow_heads !== undefined) {
			this.arrow_heads = {
				start: { ...this.arrow_heads.start, ...options.arrow_heads.start },
				end: { ...this.arrow_heads.end, ...options.arrow_heads.end }
			};
		}
		
		// ============================================================================
		// COMPUTED/DERIVED VALUES
		// ============================================================================
		
		/** @type {string} Source anchor name (where the connection starts from) */
		this.from_anchor = $derived(`--anchor-${this.id}`);
		
		/** @type {string} Target anchor name (where the connection points to) */
		this.to_anchor = $derived(`--anchor-popover-${this.id}`);
		
		/** @type {Array<{position_area: string, align_self: string, justify_self: string}>} Computed fallback chain */
		this.fallback_chain = $derived(get_fallback_chain({
			placement: this.placement,
			position_area: this.position_area,
			align_self: this.align_self,
			justify_self: this.justify_self,
			flip_axis: this.flip_axis
		}));
		
		/** @type {boolean} Check if arrow should be shown */
		this.show_arrow = $derived(
			this.placement === 'outside' && 
			!!(this.arrow_heads?.start?.show || this.arrow_heads?.end?.show)
		);
	}
	
	// ============================================================================
	// PRESETS
	// ============================================================================
	
	/**
	 * Create a config with preset for tooltip-style popover (top)
	 * @param {Partial<{id: string, offset: number}>} [options={}]
	 */
	static tooltip_top(options = {}) {
		return new AnchorPopConfig({
			placement: 'outside',
			position_area: 'y-start',
			align_self: 'end',
			justify_self: 'anchor-center',
			offset: options.offset ?? 8,
			id: options.id,
			arrow_stroke_width: 2
		});
	}
	
	/**
	 * Create a config with preset for tooltip-style popover (bottom)
	 * @param {Partial<{id: string, offset: number}>} [options={}]
	 */
	static tooltip_bottom(options = {}) {
		return new AnchorPopConfig({
			placement: 'outside',
			position_area: 'y-end',
			align_self: 'start',
			justify_self: 'anchor-center',
			offset: options.offset ?? 8,
			id: options.id,
			arrow_stroke_width: 2
		});
	}
	
	/**
	 * Create a config with preset for dropdown menu
	 * @param {Partial<{id: string, offset: number}>} [options={}]
	 */
	static dropdown(options = {}) {
		return new AnchorPopConfig({
			placement: 'outside',
			position_area: 'y-end',
			align_self: 'start',
			justify_self: 'start',
			offset: options.offset ?? 4,
			id: options.id,
			arrow_heads: { start: { show: false }, end: { show: false } }
		});
	}
	
	/**
	 * Create a config with preset for sidebar
	 * @param {Partial<{id: string, side: 'left' | 'right', offset: number}>} [options={}]
	 */
	static sidebar(options = {}) {
		const side = options.side ?? 'right';
		return new AnchorPopConfig({
			placement: 'outside',
			position_area: side === 'right' ? 'span-all inline-end' : 'span-all inline-start',
			align_self: 'stretch',
			justify_self: side === 'right' ? 'start' : 'end',
			offset: options.offset ?? 0,
			id: options.id,
			arrow_heads: { start: { show: false }, end: { show: false } }
		});
	}
}

