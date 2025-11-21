/**
 * Shared utility functions for CSS Anchor Positioning fallback chains
 * Used by both AnchorPop and AnchorArrow components
 */

/**
 * Generate unique identifier for a position config (for @position-try rule names)
 * Format: placement_position-area_align-self_justify-self
 * Note: Using underscores instead of colons to avoid CSS parsing issues
 * @param {string} placement
 * @param {{position_area: string, align_self: string, justify_self: string}} config
 */
export function get_fallback_id(placement, config) {
	return `${placement}_${config.position_area.replace(/\s+/g, '-')}_${config.align_self}_${config.justify_self}`;
}


/**
 * Flip position-area value along specified axis
 * @param {string} area - position-area value
 * @param {'x' | 'y' | 'both'} axis - axis to flip
 * 
 * Corner keywords:
 * - 'start' = top-left (block-start inline-start)
 * - 'end' = bottom-right (block-end inline-end)
 * - 'start end' = top-right (block-start inline-end)
 * - 'end start' = bottom-left (block-end inline-start)
 * 
 * Overlay span keywords:
 * - 'span-start' = top-left L
 * - 'span-end' = bottom-right L
 * - 'span-start span-end' = top-right L
 * - 'span-end span-start' = bottom-left L
 */
export function flip_position_area(area, axis) {
	// Handle explicit axis keywords first (y-start, x-end, etc.)
	if (axis === 'y' || axis === 'both') {
		area = area.replace(/y-start/g, 'TEMP_Y_END')
			.replace(/y-end/g, 'y-start')
			.replace(/TEMP_Y_END/g, 'y-end')
			.replace(/block-start/g, 'TEMP_BLOCK_END')
			.replace(/block-end/g, 'block-start')
			.replace(/TEMP_BLOCK_END/g, 'block-end');
	}
	
	if (axis === 'x' || axis === 'both') {
		area = area.replace(/x-start/g, 'TEMP_X_END')
			.replace(/x-end/g, 'x-start')
			.replace(/TEMP_X_END/g, 'x-end')
			.replace(/inline-start/g, 'TEMP_INLINE_END')
			.replace(/inline-end/g, 'inline-start')
			.replace(/TEMP_INLINE_END/g, 'inline-end');
	}
	
	// Handle corner keywords (start, end, start end, end start)
	if (axis === 'both') {
		// Flip both axes
		if (area === 'start') return 'end';
		if (area === 'end') return 'start';
		if (area === 'start end') return 'end start';
		if (area === 'end start') return 'start end';
		// Overlay corners
		if (area === 'span-start') return 'span-end';
		if (area === 'span-end') return 'span-start';
		if (area === 'span-start span-end') return 'span-end span-start';
		if (area === 'span-end span-start') return 'span-start span-end';
	} else if (axis === 'y') {
		// Flip Y (block) axis only
		if (area === 'start') return 'end start';      // top-left → bottom-left
		if (area === 'end') return 'start end';        // bottom-right → top-right
		if (area === 'start end') return 'end';        // top-right → bottom-right
		if (area === 'end start') return 'start';      // bottom-left → top-left
		// Overlay corners - Y flip
		if (area === 'span-start') return 'span-end span-start';           // top-left → bottom-left
		if (area === 'span-end') return 'span-start span-end';             // bottom-right → top-right
		if (area === 'span-start span-end') return 'span-end';             // top-right → bottom-right
		if (area === 'span-end span-start') return 'span-start';           // bottom-left → top-left
		// Overlay edges - vertical (span-start center ↔ span-end center)
		if (area === 'span-start center') return 'span-end center';
		if (area === 'span-end center') return 'span-start center';
	} else if (axis === 'x') {
		// Flip X (inline) axis only
		if (area === 'start') return 'start end';      // top-left → top-right
		if (area === 'end') return 'end start';        // bottom-right → bottom-left
		if (area === 'start end') return 'start';      // top-right → top-left
		if (area === 'end start') return 'end';        // bottom-left → bottom-right
		// Overlay corners - X flip
		if (area === 'span-start') return 'span-start span-end';           // top-left → top-right
		if (area === 'span-end') return 'span-end span-start';             // bottom-right → bottom-left
		if (area === 'span-start span-end') return 'span-start';           // top-right → top-left
		if (area === 'span-end span-start') return 'span-end';             // bottom-left → bottom-right
		// Overlay edges - horizontal (center span-start ↔ center span-end)
		if (area === 'center span-start') return 'center span-end';
		if (area === 'center span-end') return 'center span-start';
	}
	
	return area;
}

/**
 * Flip alignment value (start ↔ end)
 * @param {string} value - align-self or justify-self value
 */
export function flip_alignment(value) {
	if (value === 'start') return 'end';
	if (value === 'end') return 'start';
	return value; // stretch, center, anchor-center stay the same
}

/**
 * Get fallback chain based on placement and current CSS properties
 * Returns array of position configuration objects
 * @param {{
 *   placement: string,
 *   position_area: string,
 *   align_self: string,
 *   justify_self: string,
 *   flip_axis: 'none' | 'x' | 'y' | 'diagonal' | 'all'
 * }} config
 * @returns {Array<{position_area: string, align_self: string, justify_self: string}>}
 */
export function get_fallback_chain({ placement, position_area, align_self, justify_self, flip_axis }) {
	// CRITICAL: OUTSIDE stretch alignments require fallbacks to work across all viewport positions
	const has_stretch = align_self === 'stretch' || justify_self === 'stretch';
	const effective_flip_axis = (flip_axis === 'none' && has_stretch && placement === 'outside') ? 'all' : flip_axis;
	
	if (effective_flip_axis === 'none') return [];

	// Determine primary axis based on align_self (block axis)
	const is_vertical_primary = (align_self === 'start' || align_self === 'end');
	
	// OUTSIDE fallbacks: flip main axis, then cross axis
	if (placement === 'outside') {
		/** @type {Array<{config: {position_area: string, align_self: string, justify_self: string}, type: 'main'|'cross'|'diagonal'}>} */
		let tries = [];
		
		if (is_vertical_primary) {
			// Vertical primary: flip vertical first
			tries = [
				{
					config: {
						position_area: flip_position_area(position_area, 'y'),
						align_self: flip_alignment(align_self),
						justify_self
					},
					type: 'main'
				},
				{
					config: {
						position_area: flip_position_area(position_area, 'x'),
						align_self,
						justify_self: flip_alignment(justify_self)
					},
					type: 'cross'
				},
				{
					config: {
						position_area: flip_position_area(position_area, 'both'),
						align_self: flip_alignment(align_self),
						justify_self: flip_alignment(justify_self)
					},
					type: 'diagonal'
				}
			];
		} else {
			// Horizontal primary: flip horizontal first
			tries = [
				{
					config: {
						position_area: flip_position_area(position_area, 'x'),
						align_self,
						justify_self: flip_alignment(justify_self)
					},
					type: 'main'
				},
				{
					config: {
						position_area: flip_position_area(position_area, 'y'),
						align_self: flip_alignment(align_self),
						justify_self
					},
					type: 'cross'
				},
				{
					config: {
						position_area: flip_position_area(position_area, 'both'),
						align_self: flip_alignment(align_self),
						justify_self: flip_alignment(justify_self)
					},
					type: 'diagonal'
				}
			];
		}
		
		// Filter based on effective_flip_axis
		/** @param {'main'|'cross'|'diagonal'} t */
		const allow = (t) => {
			if (effective_flip_axis === 'all') return true;
			if (effective_flip_axis === 'diagonal') return t === 'diagonal';
			if (effective_flip_axis === 'x') return is_vertical_primary ? t === 'cross' : t === 'main';
			if (effective_flip_axis === 'y') return is_vertical_primary ? t === 'main' : t === 'cross';
			return false;
		};
		
		return tries.filter(x => allow(x.type)).map(x => x.config);
	}

	// OVERLAY fallbacks: flip to opposite edge first, then reduce coverage
	if (placement === 'overlay') {
		const fallbacks = [];
		
		// For OVERLAY, position_area determines the type (corner/edge/full)
		// Not align_self/justify_self (those control alignment within the span area)
		const is_corner = position_area === 'span-start' || 
		                  position_area === 'span-end' || 
		                  position_area === 'span-start span-end' || 
		                  position_area === 'span-end span-start';
		const is_vertical_edge = position_area.includes('span-y-') || 
		                         position_area === 'span-start center' || 
		                         position_area === 'span-end center';
		const is_horizontal_edge = position_area.includes('span-x-') || 
		                           position_area === 'center span-start' || 
		                           position_area === 'center span-end';
		const is_full_coverage = position_area.includes('span-all') || 
		                         position_area === 'center span-all';
		
		if (is_full_coverage) {
			// Full coverage stays as full coverage (no fallbacks needed)
			fallbacks.push({ position_area, align_self, justify_self });
		} else if (is_vertical_edge) {
			// Top/bottom edge: flip to opposite edge, then expand to full
			fallbacks.push(
				{ position_area: flip_position_area(position_area, 'y'), align_self: flip_alignment(align_self), justify_self },
				// { position_area: 'span-all', align_self: 'anchor-center', justify_self: 'anchor-center' }
			);
		} else if (is_horizontal_edge) {
			// Left/right edge: flip to opposite edge, then expand to full
			fallbacks.push(
				{ position_area: flip_position_area(position_area, 'x'), align_self, justify_self: flip_alignment(justify_self) },
				// { position_area: 'span-all', align_self: 'anchor-center', justify_self: 'anchor-center' }
			);
		} else if (is_corner) {
			// Corner: try opposite corner, then adjacent edges
			fallbacks.push(
				{ position_area: flip_position_area(position_area, 'both'), align_self: flip_alignment(align_self), justify_self: flip_alignment(justify_self) },
				{ position_area: flip_position_area(position_area, 'y'), align_self: flip_alignment(align_self), justify_self },
				{ position_area: flip_position_area(position_area, 'x'), align_self, justify_self: flip_alignment(justify_self) }
			);
		}
		
		return fallbacks;
	}

	// BORDER doesn't need fallbacks (always positioned on anchor edges/corners)
	if (placement === 'border') {
		return [];
	}

	// INSIDE doesn't need fallbacks (always fits)
	return [];
}