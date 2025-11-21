<script>
	/**
	 * Developer tool for testing AnchorPop placements
	 */

	let {
		placement = $bindable(),
		position_area = $bindable(),
		align_self = $bindable(),
		justify_self = $bindable(),
		offset = $bindable(),
		arrow_color = $bindable(),
		arrow_stroke_width = $bindable(),
		arrow_heads = $bindable(),
		flip_axis = $bindable(),
		position_try_order = $bindable(),
		onclose,
		onchange
	} = $props();
	
	// Auto-open AnchorPop when any setting changes
	$effect(() => {
		// Track all settings
		placement;
		position_area;
		align_self;
		justify_self;
		offset;
		arrow_color;
		arrow_stroke_width;
		arrow_heads;
		flip_axis;
		position_try_order;
		
		// Notify parent of change (triggers popover.showPopover())
		if (onchange) {
			onchange();
		}
	});

	/**
	 * Arrow head shape presets
	 */
	const ARROW_SHAPES = {
		triangle: {
			label: '▲ Triangle',
			shape: 'polygon(0% 0%, 100% 50%, 0% 100%)'
		},
		'reverse-triangle': {
			label: '▼ Reverse Triangle',
			shape: 'polygon(100% 0%, 0% 50%, 100% 100%)'
		},
		circle: {
			label: '● Circle',
			shape: 'circle(50% at 50% 50%)'
		},
		chevron: {
			label: '❯ Chevron',
			shape: 'polygon(25% 0, 70% 50%, 20% 100%, 0 100%, 50% 50%, 0 0)'
		}
	};

	/**
	 * Helper to get shape key from shape string
	 */
	function get_shape_key(shape_string) {
		if (!shape_string) return 'triangle';
		
		for (const [key, value] of Object.entries(ARROW_SHAPES)) {
			if (value.shape === shape_string) {
				return key;
			}
		}
		return 'triangle';
	}

	/**
	 * Update arrow head shape
	 */
	function update_arrow_shape(position, shape_key) {
		const shape_data = ARROW_SHAPES[shape_key];
		if (!shape_data) return;
		
		arrow_heads = {
			...arrow_heads,
			[position]: {
				...arrow_heads[position],
				shape: shape_data.shape
			}
		};
	}

	/**
	 * Placement grid configurations for each mode
	 * Each cell contains a group of related placement options that can be toggled through
	 */
	const PLACEMENT_GRIDS = {
		// ========================================================================
		// OUTSIDE: 3×3 grid (11 total placements, center×center excluded)
		// ========================================================================
		outside: [
			[
				// Top-left corner (1 option)
				{
					group: 'outside-top-left',
					options: [
						{ placement: 'outside', position_area: 'start', align_self: 'end', justify_self: 'end' }
					]
				},
				// Top center/stretch (2 options)
				{
					group: 'outside-top-center',
					options: [
						{ placement: 'outside', position_area: 'y-start', align_self: 'end', justify_self: 'anchor-center' },
						{ placement: 'outside', position_area: 'block-start span-all', align_self: 'end', justify_self: 'stretch' }
					]
				},
				// Top-right corner (1 option)
				{
					group: 'outside-top-right',
					options: [
						{ placement: 'outside', position_area: 'start end', align_self: 'end', justify_self: 'start' }
					]
				}
			],
			[
				// Left center/stretch (2 options)
				{
					group: 'outside-left-center',
					options: [
						{ placement: 'outside', position_area: 'x-start', align_self: 'anchor-center', justify_self: 'end' },
						{ placement: 'outside', position_area: 'span-all inline-start', align_self: 'stretch', justify_self: 'end' }
					]
				},
				// Center (invalid)
				null,
				// Right center/stretch (2 options)
				{
					group: 'outside-right-center',
					options: [
						{ placement: 'outside', position_area: 'x-end', align_self: 'anchor-center', justify_self: 'start' },
						{ placement: 'outside', position_area: 'span-all inline-end', align_self: 'stretch', justify_self: 'start' }
					]
				}
			],
			[
				// Bottom-left corner (1 option)
				{
					group: 'outside-bottom-left',
					options: [
						{ placement: 'outside', position_area: 'end start', align_self: 'start', justify_self: 'end' }
					]
				},
				// Bottom center/stretch (2 options)
				{
					group: 'outside-bottom-center',
					options: [
						{ placement: 'outside', position_area: 'y-end', align_self: 'start', justify_self: 'anchor-center' },
						{ placement: 'outside', position_area: 'block-end span-all', align_self: 'start', justify_self: 'stretch' }
					]
				},
				// Bottom-right corner (1 option)
				{
					group: 'outside-bottom-right',
					options: [
						{ placement: 'outside', position_area: 'end', align_self: 'start', justify_self: 'start' }
					]
				}
			]
		],

		// ========================================================================
		// INSIDE: 3×3 grid (16 total placements)
		// ========================================================================
		inside: [
			[
				// Top-left corner (1 option)
				{
					group: 'inside-top-left',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'start', justify_self: 'start' }
					]
				},
				// Top center/stretch (2 options)
				{
					group: 'inside-top-center',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'start', justify_self: 'center' },
						{ placement: 'inside', position_area: 'center', align_self: 'start', justify_self: 'stretch' }
					]
				},
				// Top-right corner (1 option)
				{
					group: 'inside-top-right',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'start', justify_self: 'end' }
					]
				}
			],
			[
				// Left center/stretch (2 options)
				{
					group: 'inside-left-center',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'center', justify_self: 'start' },
						{ placement: 'inside', position_area: 'center', align_self: 'stretch', justify_self: 'start' }
					]
				},
				// Center (4 options)
				{
					group: 'inside-center',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'center', justify_self: 'center' },
						{ placement: 'inside', position_area: 'center', align_self: 'center', justify_self: 'stretch' },
						{ placement: 'inside', position_area: 'center', align_self: 'stretch', justify_self: 'center' },
						{ placement: 'inside', position_area: 'center', align_self: 'stretch', justify_self: 'stretch' }
					]
				},
				// Right center/stretch (2 options)
				{
					group: 'inside-right-center',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'center', justify_self: 'end' },
						{ placement: 'inside', position_area: 'center', align_self: 'stretch', justify_self: 'end' }
					]
				}
			],
			[
				// Bottom-left corner (1 option)
				{
					group: 'inside-bottom-left',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'end', justify_self: 'start' }
					]
				},
				// Bottom center/stretch (2 options)
				{
					group: 'inside-bottom-center',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'end', justify_self: 'center' },
						{ placement: 'inside', position_area: 'center', align_self: 'end', justify_self: 'stretch' }
					]
				},
				// Bottom-right corner (1 option)
				{
					group: 'inside-bottom-right',
					options: [
						{ placement: 'inside', position_area: 'center', align_self: 'end', justify_self: 'end' }
					]
				}
			]
		],

	// ========================================================================
	// OVERLAY: 3×3 grid (15 total placements)
	// ========================================================================
		overlay: [
			[
				// Top-left corner (1 option)
				{
					group: 'overlay-top-left',
					options: [
						{ placement: 'overlay', position_area: 'span-start', align_self: 'end', justify_self: 'anchor-center' }
					]
				},
				// Top edge (2 options)
				{
					group: 'overlay-top-center',
					options: [
						{ placement: 'overlay', position_area: 'span-y-start', align_self: 'end', justify_self: 'anchor-center' },
						{ placement: 'overlay', position_area: 'span-start center', align_self: 'end', justify_self: 'anchor-center' }
					]
				},
				// Top-right corner (1 option)
				{
					group: 'overlay-top-right',
					options: [
						{ placement: 'overlay', position_area: 'span-start span-end', align_self: 'end', justify_self: 'anchor-center' }
					]
				}
			],
			[
				// Left edge (2 options)
				{
					group: 'overlay-left-center',
					options: [
						{ placement: 'overlay', position_area: 'span-x-start', align_self: 'anchor-center', justify_self: 'end' },
						{ placement: 'overlay', position_area: 'center span-start', align_self: 'stretch', justify_self: 'end' }
					]
				},
				// Center (3 options)
				{
					group: 'overlay-center',
					options: [
						{ placement: 'overlay', position_area: 'span-all', align_self: 'anchor-center', justify_self: 'anchor-center' },
						{ placement: 'overlay', position_area: 'span-all center', align_self: 'anchor-center', justify_self: 'anchor-center' },
						{ placement: 'overlay', position_area: 'center span-all', align_self: 'stretch', justify_self: 'anchor-center' }
					]
				},
				// Right edge (2 options)
				{
					group: 'overlay-right-center',
					options: [
						{ placement: 'overlay', position_area: 'span-x-end', align_self: 'anchor-center', justify_self: 'start' },
						{ placement: 'overlay', position_area: 'center span-end', align_self: 'stretch', justify_self: 'start' }
					]
				}
			],
			[
				// Bottom-left corner (1 option)
				{
					group: 'overlay-bottom-left',
					options: [
						{ placement: 'overlay', position_area: 'span-end span-start', align_self: 'start', justify_self: 'anchor-center' }
					]
				},
				// Bottom edge (2 options)
				{
					group: 'overlay-bottom-center',
					options: [
						{ placement: 'overlay', position_area: 'span-y-end', align_self: 'start', justify_self: 'anchor-center' },
						{ placement: 'overlay', position_area: 'span-end center', align_self: 'start', justify_self: 'anchor-center' }
					]
				},
				// Bottom-right corner (1 option)
				{
					group: 'overlay-bottom-right',
					options: [
						{ placement: 'overlay', position_area: 'span-end', align_self: 'start', justify_self: 'anchor-center' }
					]
				}
			]
		],

		// ========================================================================
		// BORDER: 3×3 grid (12 total placements - no center-center)
		// ========================================================================
		border: [
			[
				// Top-left corner (1 option)
				{
					group: 'border-top-left',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'start', justify_self: 'start' }
					]
				},
				// Top center (2 options: center, stretch)
				{
					group: 'border-top-center',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'start', justify_self: 'center' },
						{ placement: 'border', position_area: 'center', align_self: 'start', justify_self: 'stretch' }
					]
				},
				// Top-right corner (1 option)
				{
					group: 'border-top-right',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'start', justify_self: 'end' }
					]
				}
			],
			[
				// Left center (2 options: center, stretch)
				{
					group: 'border-left-center',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'center', justify_self: 'start' },
						{ placement: 'border', position_area: 'center', align_self: 'stretch', justify_self: 'start' }
					]
				},
				// Center - null (no border center option)
				null,
				// Right center (2 options: center, stretch)
				{
					group: 'border-right-center',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'center', justify_self: 'end' },
						{ placement: 'border', position_area: 'center', align_self: 'stretch', justify_self: 'end' }
					]
				}
			],
			[
				// Bottom-left corner (1 option)
				{
					group: 'border-bottom-left',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'end', justify_self: 'start' }
					]
				},
				// Bottom center (2 options: center, stretch)
				{
					group: 'border-bottom-center',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'end', justify_self: 'center' },
						{ placement: 'border', position_area: 'center', align_self: 'end', justify_self: 'stretch' }
					]
				},
				// Bottom-right corner (1 option)
				{
					group: 'border-bottom-right',
					options: [
						{ placement: 'border', position_area: 'center', align_self: 'end', justify_self: 'end' }
					]
				}
			]
		]
	};

	/**
	 * Get placement grid for current mode
	 */
	let current_grid = $derived(PLACEMENT_GRIDS[placement] || []);

	/**
	 * Check if current placement matches any option in the group
	 */
	function is_active(group_config) {
		if (!group_config || !group_config.options) return false;
		
		// Check if current state matches any option in this group
		return group_config.options.some(opt =>
			placement === opt.placement &&
			position_area === opt.position_area &&
			align_self === opt.align_self &&
			justify_self === opt.justify_self
		);
	}

	/**
	 * Apply placement configuration (cycle through options in a group)
	 */
	function apply_placement(group_config) {
		if (!group_config || !group_config.options) return;
		
		const options = group_config.options;
		
		// Check if any option in this group is currently active
		const active_index = options.findIndex(opt => 
			placement === opt.placement && 
			position_area === opt.position_area &&
			align_self === opt.align_self &&
			justify_self === opt.justify_self
		);
		
		if (active_index >= 0) {
			// Cycle to next option (wraps around)
			const next_index = (active_index + 1) % options.length;
			const next_option = options[next_index];
			placement = next_option.placement;
			position_area = next_option.position_area;
			align_self = next_option.align_self;
			justify_self = next_option.justify_self;
		} else {
			// First click: set to first option
			const first_option = options[0];
			placement = first_option.placement;
			position_area = first_option.position_area;
			align_self = first_option.align_self;
			justify_self = first_option.justify_self;
		}
	}

	/**
	 * Find the grid position (row, col) of the currently active placement
	 */
	function find_current_grid_position() {
		const grid = PLACEMENT_GRIDS[placement] || [];
		for (let row = 0; row < grid.length; row++) {
			for (let col = 0; col < grid[row].length; col++) {
				const cell = grid[row][col];
				if (cell && is_active(cell)) {
					return { row, col };
				}
			}
		}
		return { row: 1, col: 1 }; // Default to center if not found
	}

	/**
	 * Apply placement from the new mode based on grid position
	 */
	function apply_placement_from_grid_position(new_mode, row, col) {
		const new_grid = PLACEMENT_GRIDS[new_mode];
		
		// Try to use the same grid position
		let cell = new_grid?.[row]?.[col];
		
		// If position doesn't exist or is null, try center
		if (!cell) {
			const center_row = Math.floor(new_grid.length / 2);
			const center_col = Math.floor(new_grid[center_row].length / 2);
			cell = new_grid[center_row]?.[center_col];
		}
		
		// If center is also null/invalid, find first valid cell
		if (!cell) {
			for (const grid_row of new_grid) {
				for (const grid_cell of grid_row) {
					if (grid_cell && grid_cell.options && grid_cell.options[0]) {
						cell = grid_cell;
						break;
					}
				}
				if (cell) break;
			}
		}
		
		// Apply the placement if we found a valid cell
		if (cell && cell.options && cell.options[0]) {
			const option = cell.options[0];
			placement = option.placement;
			position_area = option.position_area;
			align_self = option.align_self;
			justify_self = option.justify_self;
		}
	}

	/**
	 * Handle mode tab click with grid position preservation
	 */
	function handle_mode_change(new_mode) {
		if (new_mode === placement) return; // Already in this mode
		
		// Find current grid position
		const grid_position = find_current_grid_position();
		
		// Apply placement from new mode at same position
		apply_placement_from_grid_position(new_mode, grid_position.row, grid_position.col);
	}
	
	/**
	 * Get visual indicator for toggle state (shows what the current option is)
	 */
	function get_toggle_indicator(group_config) {
		if (!group_config || !is_active(group_config)) return null;
		if (group_config.options.length <= 1) return null;
		
		// Find which option in the group is currently active
		const active_option = group_config.options.find(opt =>
			placement === opt.placement &&
			position_area === opt.position_area &&
			opt.align_self === align_self &&
			opt.justify_self === justify_self
		);
		
		if (!active_option) return null;
		
		// Determine indicator based on align_self and justify_self
		const option_align = active_option.align_self;
		const option_justify = active_option.justify_self;
		
		if (option_align === 'stretch' && option_justify === 'stretch') {
			return 'F'; // Both stretch
		} else if (option_align === 'stretch') {
			return 'S'; // Stretch vertical
		} else if (option_justify === 'stretch') {
			return 'S'; // Stretch horizontal
		} else if (option_align === 'center' || option_align === 'anchor-center') {
			return 'C'; // Center
		}
		
		return null;
	}

	// ============================================================================
	// DRAGGING & POSITIONING
	// ============================================================================

	let panel_position = $state({ x: (typeof window !== 'undefined' ? window.innerWidth - 324 : 24), y: 24 }); // Position on right side with margin
	let is_dragging = $state(false);
	let drag_start = $state({ x: 0, y: 0 });
	let drag_offset = $state({ x: 0, y: 0 });
	let panel_el;

	function handle_pointer_down(event) {
		// Only drag from header area
		if (!event.target.closest('.debug-header')) return;
		if (event.target.closest('button')) return; // Don't drag when clicking buttons
		
		event.preventDefault();
		is_dragging = true;
		
		drag_start = {
			x: event.clientX,
			y: event.clientY
		};
		drag_offset = { ...panel_position };
		
		panel_el?.setPointerCapture(event.pointerId);
	}

	function handle_pointer_move(event) {
		if (!is_dragging) return;
		
		panel_position = {
			x: drag_offset.x + (event.clientX - drag_start.x),
			y: drag_offset.y + (event.clientY - drag_start.y)
		};
	}

	function handle_pointer_up(event) {
		if (!is_dragging) return;
		
		is_dragging = false;
		panel_el?.releasePointerCapture(event.pointerId);
	}

	// ============================================================================
	// MINIMIZE/EXPAND
	// ============================================================================

	let is_minimized = $state(false);

	function toggle_minimize() {
		is_minimized = !is_minimized;
	}
</script>

<div 
	bind:this={panel_el}
	class="popover-debug-hud" 
	class:minimized={is_minimized}
	class:dragging={is_dragging}
	style:left="{panel_position.x}px"
	style:top="{panel_position.y}px"
	onpointerdown={handle_pointer_down}
	onpointermove={handle_pointer_move}
	onpointerup={handle_pointer_up}
>
	<div class="debug-header">
		<h4>Settings</h4>
		<div class="header-buttons">
			<button 
				onclick={toggle_minimize} 
				aria-label={is_minimized ? "Expand debug HUD" : "Minimize debug HUD"}
				title={is_minimized ? "Expand" : "Minimize"}
			>
				{is_minimized ? '□' : '_'}
			</button>
			<button 
				onclick={onclose} 
				aria-label="Close debug HUD"
				title="Close"
			>
				✕
			</button>
		</div>
	</div>
	
	{#if !is_minimized}
	
	<!-- Placement Mode Selector -->
	<div class="mode-selector" role="tablist" aria-label="Placement mode">
		<button 
			class="mode-tab" 
			class:active={placement === 'outside'}
			onclick={() => handle_mode_change('outside')}
			role="tab"
			aria-selected={placement === 'outside'}
		>
			Outside
		</button>
		<button 
			class="mode-tab" 
			class:active={placement === 'overlay'}
			onclick={() => handle_mode_change('overlay')}
			role="tab"
			aria-selected={placement === 'overlay'}
		>
			Overlay
		</button>
		<button 
			class="mode-tab" 
			class:active={placement === 'border'}
			onclick={() => handle_mode_change('border')}
			role="tab"
			aria-selected={placement === 'border'}
		>
			Border
		</button>
		<button 
			class="mode-tab" 
			class:active={placement === 'inside'}
			onclick={() => handle_mode_change('inside')}
			role="tab"
			aria-selected={placement === 'inside'}
		>
			Inside
		</button>
	</div>
	
	<!-- Placement grid with controls -->
	<div class="grid-and-controls">
		<!-- Compact placement grid with visual icons -->
		<div class="placement-grid" role="grid" aria-label="Placement selector">
			{#each current_grid.flat() as group_config}
				{#if group_config}
				<button 
					class="grid-cell" 
					class:active={is_active(group_config)}
					class:has-multiple={group_config.options.length > 1}
					onclick={() => apply_placement(group_config)}
					role="gridcell"
					aria-label="{group_config.group}"
					title={group_config.options.length > 1 ? 'Click to cycle options' : ''}
				>
						{#if placement === 'overlay'}
							{@const sorted_options = group_config.options.slice().sort((a, b) => {
								const a_active = is_active(group_config) && 
									placement === a.placement &&
									position_area === a.position_area &&
									align_self === a.align_self &&
									justify_self === a.justify_self;
								const b_active = is_active(group_config) && 
									placement === b.placement &&
									position_area === b.position_area &&
									align_self === b.align_self &&
									justify_self === b.justify_self;
								return a_active ? 1 : b_active ? -1 : 0;
							})}
							
							<svg viewBox="0 0 24 24" class="cell-icon">
								<!-- Anchor rectangle - only visible on hover/active -->
								<rect x="6" y="6" width="12" height="12" class="anchor-rect" fill="none" stroke="currentColor" stroke-width="1" />
								
								<!-- Default hover indicator (small center dot) -->
								<circle cx="12" cy="12" r="1.5" class="hover-indicator" fill="currentColor" />
								
								<!-- Render inactive options first, then active option last (on top) -->
								{#each sorted_options as option}
									{@const is_option_active = is_active(group_config) && 
										placement === option.placement &&
										position_area === option.position_area &&
										align_self === option.align_self &&
										justify_self === option.justify_self}
									{@const option_position_area = option.position_area}
									
									<g class="option-icon" class:active-option={is_option_active}>
										{#if group_config.group === 'overlay-top-left'}
											<line x1="6" y1="6" x2="18" y2="6" stroke-width="1" />
											<line x1="6" y1="6" x2="6" y2="18" stroke-width="1" />
										{:else if group_config.group === 'overlay-top-center'}
											{#if option_position_area === 'span-y-start'}
												<line x1="6" y1="6" x2="18" y2="6" stroke-width="1" />
											{:else}
												<line x1="12" y1="6" x2="12" y2="18" stroke-width="1" />
											{/if}
										{:else if group_config.group === 'overlay-top-right'}
											<line x1="18" y1="6" x2="6" y2="6" stroke-width="1" />
											<line x1="18" y1="6" x2="18" y2="18" stroke-width="1" />
										{:else if group_config.group === 'overlay-left-center'}
											{#if option_position_area === 'span-x-start'}
												<line x1="6" y1="6" x2="6" y2="18" stroke-width="1" />
											{:else}
												<line x1="6" y1="12" x2="18" y2="12" stroke-width="1" />
											{/if}
										{:else if group_config.group === 'overlay-center'}
											{#if option_position_area === 'span-all'}
												<!-- <line x1="12" y1="6" x2="12" y2="18" stroke-width="1" /> -->
												<!-- <circle cx="12" cy="12" r="1.5"  /> -->
												<rect x="6" y="6" width="12" height="12" fill="none" stroke-width="1" />
												{:else if option_position_area === 'span-all center'}
												<line x1="12" y1="6" x2="12" y2="18" stroke-width="1" />
												<!-- <line x1="9" y1="6" x2="9" y2="18" stroke-width="1" /> -->
												{:else}
												<line x1="6" y1="12" x2="18" y2="12" stroke-width="1" />
												<!-- <line x1="6" y1="9" x2="18" y2="9" stroke-width="1" /> -->
												<!-- <line x1="6" y1="12" x2="18" y2="12" stroke-width="1" /> -->
											{/if}
										{:else if group_config.group === 'overlay-right-center'}
											{#if option_position_area === 'span-x-end'}
												<line x1="18" y1="6" x2="18" y2="18" stroke-width="1" />
											{:else}
												<line x1="6" y1="12" x2="18" y2="12" stroke-width="1" />
											{/if}
										{:else if group_config.group === 'overlay-bottom-left'}
											<line x1="6" y1="18" x2="18" y2="18" stroke-width="1" />
											<line x1="6" y1="6" x2="6" y2="18" stroke-width="1" />
										{:else if group_config.group === 'overlay-bottom-center'}
											{#if option_position_area === 'span-y-end'}
												<line x1="6" y1="18" x2="18" y2="18" stroke-width="1" />
											{:else}
												<line x1="12" y1="6" x2="12" y2="18" stroke-width="1" />
											{/if}
										{:else if group_config.group === 'overlay-bottom-right'}
											<line x1="6" y1="18" x2="18" y2="18" stroke-width="1" />
											<line x1="18" y1="6" x2="18" y2="18" stroke-width="1" />
										{/if}
									</g>
								{/each}
							</svg>
						{:else}
							<!-- Standard visualization for outside/inside/border -->
							{@const sorted_options = group_config.options.slice().sort((a, b) => {
								const a_active = is_active(group_config) && 
									placement === a.placement &&
									position_area === a.position_area &&
									align_self === a.align_self &&
									justify_self === a.justify_self;
								const b_active = is_active(group_config) && 
									placement === b.placement &&
									position_area === b.position_area &&
									align_self === b.align_self &&
									justify_self === b.justify_self;
								return a_active ? 1 : b_active ? -1 : 0;
							})}
							
							<svg viewBox="0 0 24 24" class="cell-icon">
								<!-- Anchor rectangle - only visible on hover/active -->
								<rect x="6" y="6" width="12" height="12" class="anchor-rect" fill="none" stroke="currentColor" stroke-width="1" />
								
								<!-- Default hover indicator (small center dot) -->
								<circle cx="12" cy="12" r="1.5" class="hover-indicator" fill="currentColor" />
								
								<!-- Render inactive options first, then active option last (on top) -->
								{#each sorted_options as option}
									{@const is_option_active = is_active(group_config) && 
										placement === option.placement &&
										position_area === option.position_area &&
										align_self === option.align_self &&
										justify_self === option.justify_self}
									{@const show_x = option.justify_self}
									{@const show_y = option.align_self}
									
									<!-- For outside placement, invert the visual representation -->
									{@const is_outside = placement === 'outside'}
									{@const is_inside = placement === 'inside'}
									
									{#if show_x === 'stretch' && show_y === 'stretch'}
										<!-- For inside placement, only show stretch+stretch when active (to avoid overlap) -->
										{#if !is_inside || is_option_active}
											<rect x="6" y="6" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1" class="option-icon" class:active-option-stroke={is_option_active} />
										{/if}
									{:else if show_x === 'stretch'}
										{@const bar_y = is_outside
											? (show_y === 'start' ? 17.5 : show_y === 'end' ? 5.5 : 11.5)
											: (show_y === 'start' ? 5.5 : show_y === 'end' ? 17.5 : 11.5)}
										<rect x="6" y={bar_y} width="12" height="1" fill="currentColor" class="option-icon" stroke-width="0" rx="0.5" class:active-option-fill={is_option_active} />
									{:else if show_y === 'stretch'}
										{@const bar_x = is_outside
											? (show_x === 'start' ? 17.5 : show_x === 'end' ? 5.5 : 11.5)
											: (show_x === 'start' ? 5.5 : show_x === 'end' ? 17.5 : 11.5)}
										<rect x={bar_x} y="6" width="1" height="12" fill="currentColor" class="option-icon" stroke-width="0" rx="0.5" class:active-option-fill={is_option_active} />
									{:else}
										{@const x = is_outside
											? (show_x === 'start' ? 18 : show_x === 'end' ? 6 : show_x === 'anchor-center' ? 12 : 12)
											: (show_x === 'start' ? 6 : show_x === 'end' ? 18 : show_x === 'anchor-center' ? 12 : 12)}
										{@const y = is_outside
											? (show_y === 'start' ? 18 : show_y === 'end' ? 6 : show_y === 'anchor-center' ? 12 : 12)
											: (show_y === 'start' ? 6 : show_y === 'end' ? 18 : show_y === 'anchor-center' ? 12 : 12)}
										<circle cx={x} cy={y} r="2" fill="currentColor" class="option-icon" class:active-option={is_option_active} />
									{/if}
								{/each}
							</svg>
						{/if}
						
						<!-- Toggle indicator -->
						{#if get_toggle_indicator(group_config)}
						<span class="toggle-indicator">{get_toggle_indicator(group_config)}</span>
						{/if}
					</button>
				{:else}
				<!-- Empty cell -->
				<div class="grid-cell empty"></div>
				{/if}
			{/each}
		</div>

		<!-- Controls column next to grid -->
		<div class="controls-column">
			<label for="debug-offset-v2">Offset</label>
			<input id="debug-offset-v2" type="number" bind:value={offset} min="-20" max="100" step="10" />

			{#if placement === 'outside' || placement === 'overlay'}
				<label for="debug-flip-axis-v2">Flip</label>
				<select id="debug-flip-axis-v2" bind:value={flip_axis} aria-label="Flip axis">
					<option value="all">all</option>
					<option value="x">x</option>
					<option value="y">y</option>
					<option value="diagonal">diagonal</option>
					<option value="none">none</option>
				</select>

				<label for="debug-pto-v2">Try order</label>
				<select id="debug-pto-v2" bind:value={position_try_order} aria-label="Position try order">
					<option value="auto">auto</option>
					<option value="normal">normal</option>
					<option value="inline">inline</option>
					<option value="block">block</option>
				</select>
			{/if}
		</div>
	</div>

	<!-- Additional controls -->
	<div class="debug-controls">

		{#if placement === 'outside'}
			<!-- Arrow Settings Section -->
			<div class="arrow-settings">
				<div class="section-header">Arrow</div>
					
				<!-- Stroke weight -->
				<div class="control-row">
					<label for="debug-arrow-width">Stroke&nbsp;weight</label>
					<input 
						id="debug-arrow-width" 
						type="number" 
						bind:value={arrow_stroke_width} 
						min="1" 
						max="20" 
						step="1"
					/>
				</div>
				
				<!-- Arrow Heads Grid -->
				<div class="arrow-heads-grid">
					<!-- Column headers with checkboxes -->
					<div class="arrow-head-col">
						<div class="arrow-head-header">
							<span class="arrow-head-label">Start</span>
							<input 
								type="checkbox" 
								bind:checked={arrow_heads.start.show}
								aria-label="Show start arrow head"
							/>
						</div>
					</div>
					<div class="arrow-head-col">
						<div class="arrow-head-header">
							<span class="arrow-head-label">End</span>
							<input 
								type="checkbox" 
								bind:checked={arrow_heads.end.show}
								aria-label="Show end arrow head"
							/>
						</div>
					</div>
					
					<!-- Shape row -->
					<div class="arrow-head-col">
						{#if arrow_heads?.start?.show}
							<select 
								value={get_shape_key(arrow_heads?.start?.shape)}
								onchange={(e) => update_arrow_shape('start', e.target.value)}
								aria-label="Start arrow shape"
							>
								{#each Object.entries(ARROW_SHAPES) as [key, data]}
									<option value={key}>{data.label}</option>
								{/each}
							</select>
						{/if}
					</div>
					<div class="arrow-head-col">
						{#if arrow_heads?.end?.show}
							<select 
								value={get_shape_key(arrow_heads?.end?.shape)}
								onchange={(e) => update_arrow_shape('end', e.target.value)}
								aria-label="End arrow shape"
							>
								{#each Object.entries(ARROW_SHAPES) as [key, data]}
									<option value={key}>{data.label}</option>
								{/each}
							</select>
						{/if}
					</div>
					
					<!-- Offset row -->
					<div class="arrow-head-col">
						{#if arrow_heads?.start?.show}
							<input 
								type="number" 
								bind:value={arrow_heads.start.offset}
								min="0" 
								max="50" 
								step="1"
								placeholder="auto offset"
								aria-label="Start arrow offset"
							/>
						{/if}
					</div>
					<div class="arrow-head-col">
						{#if arrow_heads?.end?.show}
							<input 
								type="number" 
								bind:value={arrow_heads.end.offset}
								min="0" 
								max="50" 
								step="1"
								placeholder="auto offset"
								aria-label="End arrow offset"
							/>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div class="debug-info">
		<div class="config-output">
			<pre><code>{JSON.stringify({
				placement,
				position_area,
				align_self,
				justify_self,
				offset
			}, null, 2)}</code></pre>
		</div>
	</div>
	{/if}
</div>

<style>
	:root {
		/* Colors in oklch */
		--hud-bg: oklch(100% 0 0);
		--hud-text: oklch(0% 0 0);
		--hud-text-muted: oklch(55% 0 270);
		--hud-border: oklch(92% 0 270);
		--hud-bg-2: oklch(96% 0 270);
		--hud-cell-inactive: oklch(70% 0 270);
		--hud-active: oklch(55% 0 307);
		--hud-input-border: oklch(85% 0 270);
		--hud-input-focus: oklch(55% 0 307);
	}

	.popover-debug-hud {
		position: fixed;
		background: var(--hud-bg);
		border: none;
		border-radius: 8px;
		box-shadow: 
			0 0 0 1px rgba(0, 0, 0, 0.05),
			0 4px 16px rgba(0, 0, 0, 0.1);
		padding: 0.75rem;
		z-index: 10000;
		font-family: 'Shantell Sans', cursive;
		font-size: 12px;
		touch-action: none;
		user-select: none;
		width: 280px;
	}

	.popover-debug-hud.dragging {
		cursor: grabbing;
	}

	.popover-debug-hud.minimized {
		padding-bottom: 0.75rem;
	}

	.debug-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		cursor: grab;
		padding: 0.25rem;
		margin: -0.25rem;
		margin-bottom: 0.5rem;
		border-radius: 4px;
	}

	.popover-debug-hud.dragging .debug-header {
		cursor: grabbing;
	}

	.debug-header:hover {
		background: rgba(0, 0, 0, 0.02);
	}

	.debug-header h4 {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--hud-text);
		pointer-events: none;
	}

	.header-buttons {
		display: flex;
		gap: 0.25rem;
	}

	.debug-header button {
		background: none;
		border: none;
		font-size: 16px;
		cursor: pointer;
		color: #9ca3af;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.debug-header button:hover {
		background: #f3f4f6;
		color: #374151;
	}

	/* Mode Selector - Figma-style tabs */
	.mode-selector {
		display: flex;
		gap: 2px;
		background: var(--hud-bg-2);
		padding: 2px;
		border-radius: 6px;
		margin-bottom: 0.75rem;
	}

	.mode-tab {
		flex: 1;
		padding: 0.375rem 0.5rem;
		background: transparent;
		border: none;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 400;
		color: var(--hud-text-muted);
		cursor: pointer;
		white-space: nowrap;
	}

	.mode-tab:hover {
		color: var(--hud-text);
	}

	.mode-tab.active {
		background: white;
		color: var(--hud-text);
		font-weight: 500;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
	}

	/* Grid and Controls Layout */
	.grid-and-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		align-items: flex-start;
	}

	/* Placement Grid */
	.placement-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		background: var(--hud-bg-2);
		border-radius: 6px;
		width: fit-content;
		flex-shrink: 0;
	}

	/* Controls Column */
	.controls-column {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.5rem;
		align-items: center;
		flex: 1;
		min-width: 0;
	}
	
	.grid-cell {
		width: 32px;
		height: 32px;
		border: none;
		padding: 0;
		cursor: pointer;
		position: relative;
		background: transparent;
		color: var(--hud-cell-inactive);
	}

	/* Touch devices - larger tap targets */
	@media (pointer: coarse) {
		.grid-cell {
			width: 44px;
			height: 44px;
		}
	}

	.grid-cell.empty {
		cursor: not-allowed;
		opacity: 0.3;
	}

	.grid-cell:not(.empty):hover {
		z-index: 1;
	}

	.grid-cell.active {
		color: var(--hud-cell-inactive);
	}

	.cell-icon {
		width: 100%;
		height: 100%;
		display: block;
	}

	.anchor-rect {
		stroke-opacity: 0;
	}

	/* Option icons - gray by default, purple when active */
	.option-icon {
		fill: var(--hud-cell-inactive);
		stroke: var(--hud-cell-inactive);
		opacity: 0;
	}

	.option-icon.active-option {
		fill: var(--hud-active);
		stroke: var(--hud-active);
		opacity: 1;
	}
	
	.option-icon.active-option-fill {
		fill: var(--hud-active);
		stroke: none;
		opacity: 1;
	}

	.option-icon.active-option-stroke {
		fill: none;
		stroke: var(--hud-active);
		opacity: 1;
	}

	/* Hover indicator - small center dot */
	.hover-indicator {
		fill: var(--hud-cell-inactive);
	}

	/* Show indicators based on state - for hover-capable devices */
	@media (hover: hover) {
		/* Show hover indicator by default, hide on hover or when active */
		.grid-cell:not(.active):not(:hover) .hover-indicator {
			opacity: 0.3;
		}

		/* Show anchor rect on hover or when active */
		.grid-cell:hover .anchor-rect,
		.grid-cell.active .anchor-rect {
			stroke-opacity: 0.3;
		}

		/* Show option icons on hover or when active */
		.grid-cell:hover .option-icon,
		.grid-cell.active .option-icon {
			opacity: 1;
		}

		/* Hide hover indicator when showing options */
		.grid-cell:hover .hover-indicator,
		.grid-cell.active .hover-indicator {
			opacity: 0;
		}
	}

	/* For touch devices, always show active options, hide hover indicator */
	@media (hover: none) {
		.grid-cell.active .anchor-rect {
			stroke-opacity: 0.3;
		}

		.grid-cell .option-icon {
			opacity: 1;
		}

		.grid-cell .hover-indicator {
			opacity: 0;
		}
	}

	/* Toggle indicator for center/stretch cells */
	.toggle-indicator {
		position: absolute;
		top: 2px;
		right: 2px;
		padding: 1px 3px;
		background: var(--hud-active);
		color: white;
		border-radius: 2px;
		font-size: 7px;
		font-weight: 700;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Controls Column Labels and Inputs */
	.controls-column label {
		font-size: 10px;
		font-weight: 400;
		color: var(--hud-text-muted);
		white-space: nowrap;
	}

	.controls-column input[type="number"],
	.controls-column select {
		width: auto;
		min-width: 0;
		padding: 0.25rem 0.375rem;
		border: 1px solid var(--hud-input-border);
		border-radius: 4px;
		font-size: 11px;
		font-family: 'Shantell Sans Light', monospace;
		background: white;
	}

	.controls-column input[type="number"]:focus,
	.controls-column select:focus {
		outline: none;
		border-color: var(--hud-input-focus);
		box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
	}

	/* Additional controls */
	.debug-controls {
		margin-bottom: 0.5rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-row label {
		font-size: 11px;
		font-weight: 400;
		color: var(--hud-text-muted);
		width: auto;
		flex-shrink: 0;
	}

	.control-row input[type="number"] {
		flex: 1;
		padding: 0.25rem 0.375rem;
		border: 1px solid var(--hud-input-border);
		border-radius: 4px;
		font-size: 11px;
		font-family: 'Shantell Sans Light', monospace;
		background: white;
	}

	.control-row input[type="number"]:focus {
		outline: none;
		border-color: var(--hud-input-focus);
		box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
	}
	
	/* Checkbox styling */
	input[type="checkbox"] {
		accent-color: var(--hud-active);
	}

	/* Current placement info */
	.debug-info {
		padding: 0.375rem 0.5rem;
		border-radius: 4px;
		border: 1px solid var(--hud-border);
		background: var(--hud-bg-2);
	}

	.config-output {
		width: 100%;
		overflow-x: auto;
	}

	.config-output pre {
		margin: 0;
		text-align: left;
	}

	.config-output code {
		font-family: 'Shantell Sans Light', monospace;
		font-size: 10px;
		color: var(--hud-text-muted);
		font-weight: 400;
		user-select: all;
		white-space: pre;
	}

	/* Arrow Settings */
	.arrow-settings {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--hud-border);
	}

	.section-header {
		font-size: 11px;
		font-weight: 600;
		color: var(--hud-text);
		margin-bottom: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.arrow-heads-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.arrow-head-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.arrow-head-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.arrow-head-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--hud-text);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.arrow-head-header input[type="checkbox"] {
		width: 16px;
		height: 16px;
		cursor: pointer;
		margin: 0;
	}

	.arrow-head-col select,
	.arrow-head-col input[type="number"] {
		width: auto;
		min-width: 0;
		padding: 0.25rem 0.375rem;
		border: 1px solid var(--hud-input-border);
		border-radius: 4px;
		font-size: 11px;
		font-family: 'Shantell Sans Light', monospace;
		background: white;
		margin-bottom: 0.5rem;
	}

	.arrow-head-col select:focus,
	.arrow-head-col input[type="number"]:focus {
		outline: none;
		border-color: var(--hud-input-focus);
		box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1);
	}
</style>