# AnchorPop

**CSS Anchor Positioning made simple for Svelte 5**

🎯 **[Live Demo](https://anchorpop.fly.dev)** | 📦 **[npm](https://www.npmjs.com/package/anchorpop)** | 🐙 **[GitHub](https://github.com/johannesmutter/anchorpop)**

AnchorPop is a lightweight library that brings the power of native CSS Anchor Positioning to Svelte applications. Create popovers, tooltips, dropdowns, and context menus that intelligently position themselves and automatically adjust when space is constrained.

## Features

- **Pure CSS Positioning** – Uses the native CSS Anchor Positioning API
- **Automatic Fallbacks** – Intelligently flips when constrained by viewport
- **Visual Arrows** – Optional connecting arrows that follow the popover
- **Multiple Placements** – Outside, inside, overlay, and border positioning modes
- **Zero Dependencies** – Just Svelte 5

## Browser Support

This library requires browser support for CSS Anchor Positioning. Which is Baseline 2026 as of January 2026. Yay!
- Chrome/Edge (Arrows require 143+)
- Safari (Arrows not yet supported due to lack of feature support for anchored container queries)
- Firefox (147+)

## Installation

```bash
npm install anchorpop
```

## Quick Start

```svelte
<script>
  import { AnchorPop, AnchorArrow, AnchorPopConfig } from 'anchorpop';

  const config = new AnchorPopConfig({
    id: 'my-popover',
    placement: 'outside',
    position_area: 'y-end',
    align_self: 'start',
    justify_self: 'anchor-center',
    offset: 16
  });
</script>

<button 
  popovertarget={config.id}
  style="anchor-name: {config.from_anchor}"
>
  Click me
</button>

<AnchorPop {...config}>
  Your content here
</AnchorPop>

<AnchorArrow {...config} />
```

## Core Concepts

### Placements

AnchorPop supports four semantic placement modes:

- **`outside`** – Never overlaps the anchor element. Perfect for tooltips, dropdowns, and context menus.
- **`inside`** – Positioned within anchor bounds. Useful for overlay controls within containers.
- **`overlay`** – Covers the anchor and extends beyond. Perfect for select-style menus.
- **`border`** – Centered on anchor edges/corners. Great for badges and decorations.

### Configuration

The `AnchorPopConfig` class encapsulates all popover state and configuration:

```js
const config = new AnchorPopConfig({
  id: 'my-popover',           // Unique identifier
  placement: 'outside',       // Placement mode
  position_area: 'y-end',     // CSS position-area value
  align_self: 'start',        // Block axis alignment
  justify_self: 'anchor-center', // Inline axis alignment
  offset: 16,                 // Distance from anchor (px)
  arrow_color: '#000000',     // Arrow color
  arrow_stroke_width: 2,      // Arrow thickness (px)
  flip_axis: 'all'           // Which axes can flip ('x', 'y', 'all', 'none')
});
```

### Automatic Fallbacks

When the popover doesn't fit in its primary position, AnchorPop automatically tries fallback positions:

```js
// Enable fallbacks on all axes
const config = new AnchorPopConfig({
  flip_axis: 'all'  // default
});

// Restrict to vertical flipping only
const config = new AnchorPopConfig({
  flip_axis: 'y'
});

// Disable fallbacks
const config = new AnchorPopConfig({
  flip_axis: 'none'
});
```

### Arrows

Visual arrows connect the popover to its anchor. You can pass any clip-path compatible vector to `shape` for the arrow heads:

```js
const config = new AnchorPopConfig({
  arrow_color: '#000000',
  arrow_stroke_width: 2,
  arrow_heads: {
    start: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' },
    end: { show: true, shape: 'polygon(0% 0%, 100% 50%, 0% 100%)' }
  }
});
```

> Arrows are only shown for `outside` placement mode.

## Common Patterns

### Tooltip

```js
const tooltip = AnchorPopConfig.tooltip_bottom({ offset: 8 });
```

### Dropdown Menu

```js
const dropdown = AnchorPopConfig.dropdown({ offset: 4 });
```

### Sidebar

```js
const sidebar = AnchorPopConfig.sidebar({ 
  side: 'right',
  offset: 0 
});
```

## Components

### `<AnchorPop>`

The main popover component. Renders content in the browser's top layer using the Popover API.

**Props:**
- `id` – Unique identifier (required)
- `from_anchor` – Anchor name of the trigger element
- `to_anchor` – Anchor name for this popover
- `placement` – Placement mode
- `position_area` – CSS position-area value
- `align_self` – Block axis alignment
- `justify_self` – Inline axis alignment
- `offset` – Distance from anchor in pixels
- `flip_axis` – Which axes can flip
- `fallback_chain` – Computed fallback positions
- `mode` – Popover mode ('auto' or 'manual')
- `backdrop` – Show backdrop overlay

### `<AnchorArrow>`

Visual arrow connecting the popover to the anchor. Uses pure CSS positioning with automatic updates.

**Props:**
- `id` – Unique identifier (required)
- `from_anchor` – Anchor name of the source
- `to_anchor` – Anchor name of the target
- `placement` – Placement mode
- `position_area` – CSS position-area value
- `align_self` – Block axis alignment
- `justify_self` – Inline axis alignment
- `fallback_chain` – Computed fallback positions
- `arrow_color` – Arrow color
- `arrow_stroke_width` – Arrow thickness
- `arrow_heads` – Arrow head configuration

### `AnchorPopConfig`

Configuration class with reactive state using Svelte 5 runes.

**Methods:**
- `new AnchorPopConfig(options)` – Create a new configuration
- `AnchorPopConfig.tooltip_top(options)` – Tooltip preset (top)
- `AnchorPopConfig.tooltip_bottom(options)` – Tooltip preset (bottom)
- `AnchorPopConfig.dropdown(options)` – Dropdown menu preset
- `AnchorPopConfig.sidebar(options)` – Sidebar preset

## Safari Compatibility

Safari has a limitation where CSS anchor positions don't update when the anchor element is moved using `transform`. To ensure compatibility:

**❌ Don't use transforms for positioning:**
```svelte
<button style="transform: translate(100px, 50px)">
```

**✅ Use layout positioning instead:**
```svelte
<button style="position: relative; left: 100px; top: 50px">
```

This affects draggable triggers or any dynamically positioned anchors.

## Advanced Usage

### Custom Styling

Override CSS variables to customize appearance:

```css
:global(.popover) {
  --popover-background: oklch(100% 0 0 / 0.95);
  --popover-border-color: oklch(90% 0 0);
  --popover-border-width: 1px;
  --popover-border-radius: 8px;
  --popover-shadow: 0 4px 16px oklch(0% 0 0 / 0.1);
  --popover-transition-duration: 80ms;
  --popover-animation-distance: 8px;
}
```

### Manual Control

Use `mode="manual"` for programmatic control:

```svelte
<script>
  let popover_ref;
  
  function open_popover() {
    popover_ref?.showPopover();
  }
  
  function close_popover() {
    popover_ref?.hidePopover();
  }
</script>

<AnchorPop bind:ref={popover_ref} mode="manual" {...config}>
  Content
</AnchorPop>
```

## Architecture

AnchorPop uses several advanced CSS techniques:

1. **CSS Anchor Positioning** – Native browser API for positioning elements relative to anchors
2. **@position-try Rules** – Declarative fallback positioning
3. **Anchored Container Queries** – Detect which fallback is active
4. **Scroll-driven Animations** – Pure CSS dimension measurement
5. **Trigger Proxy Pattern** – Bridge between stacking contexts for arrows (toplayer)

For implementation details, see the component source code.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT © Johannes Mutter

## Acknowledgments

Built with Svelte 5 and inspired by the CSS Anchor Positioning specification.
