<script>
	import AnchorPop from '$lib/AnchorPop.svelte';
	import AnchorArrow from '$lib/AnchorArrow.svelte';
	import { AnchorPopConfig } from '$lib/AnchorPopConfig.svelte.js';
	import AnchorPopSettingsHUD from './_components/AnchorPopSettingsHUD.svelte';
	import SyntaxHighlight from './_components/SyntaxHighlight.svelte';
	
	// Demo components
	import TooltipDemo from './_components/demo/TooltipDemo.svelte';
	import PopoverDemo from './_components/demo/PopoverDemo.svelte';
	import DropdownDemo from './_components/demo/DropdownDemo.svelte';
	import ComboboxDemo from './_components/demo/ComboboxDemo.svelte';
	import DialogDemo from './_components/demo/DialogDemo.svelte';
	import MessageReactionsDemo from './_components/demo/MessageReactionsDemo.svelte';
	import AnnotationDemo from './_components/demo/AnnotationDemo.svelte';
	import ImageEditorDemo from './_components/demo/ImageEditorDemo.svelte';
	import TextEditorDemo from './_components/demo/TextEditorDemo.svelte';
	import PreviewCardDemo from './_components/demo/PreviewCardDemo.svelte';

	// Configuration
	const config = new AnchorPopConfig({
		id: 'demo-popover',
		placement: 'outside',
		position_area: 'y-end',
		align_self: 'start',
		justify_self: 'anchor-center',
		offset: 30,
		arrow_color: '#000000',
		arrow_stroke_width: 2,
		mode: 'auto'
	});
	
	// HUD visibility
	let show_hud = $state(true);
	
	// Donation calculator
	let hourly_rate = $state(80);
	let time_saved = $state(4);
	let donation_amount = $derived(Math.round((hourly_rate * time_saved) / 10));
	
	// Code examples (as constants to prevent Svelte from parsing them)
	const usage_example = '<script>\n  import { AnchorPop, AnchorPopConfig } from \'anchorpop\';\n\n  const config = new AnchorPopConfig({\n    id: \'my-popover\',\n    placement: \'outside\',\n    position_area: \'y-end\',\n    align_self: \'start\',\n    justify_self: \'anchor-center\',\n    offset: 16\n  });\n<\/script>\n\n<button \n  popovertarget={config.id}\n  style="anchor-name: {config.from_anchor}"\n>\n  Click me\n</button>\n\n<AnchorPop {...config}>\n  Your content here\n</AnchorPop>';
	
	const install_curl_example = '# Copy components\ncurl https://raw.githubusercontent.com/johannesmutter/anchorpop/main/src/lib/AnchorPop.svelte > src/lib/AnchorPop.svelte\ncurl https://raw.githubusercontent.com/johannesmutter/anchorpop/main/src/lib/AnchorArrow.svelte > src/lib/AnchorArrow.svelte\ncurl https://raw.githubusercontent.com/johannesmutter/anchorpop/main/src/lib/AnchorPopConfig.svelte.js > src/lib/AnchorPopConfig.svelte.js';
	
	const install_npm_example = 'npm install anchorpop';
	
	// Draggable button state
	let drag_position = $state({ x: 0, y: 0 });
	let start_pointer = $state(/** @type {{x: number, y: number} | null} */ (null));
	let start_position = $state(/** @type {{x: number, y: number} | null} */ (null));
	let button_el = $state(/** @type {HTMLButtonElement | undefined} */ (undefined));

	/**
	 * Handle pointer down for drag interaction
	 * @param {PointerEvent} event
	 */
	function on_pointer_down(event) {
		if (!button_el) return;
		event.preventDefault();
		button_el.setPointerCapture(event.pointerId);
		
		start_pointer = { x: event.clientX, y: event.clientY };
		start_position = { ...drag_position };
	}

	/**
	 * Handle pointer move for drag interaction
	 * @param {PointerEvent} event
	 */
	function on_pointer_move(event) {
		if (!start_pointer || !start_position) return;
		
		drag_position = {
			x: start_position.x + (event.clientX - start_pointer.x),
			y: start_position.y + (event.clientY - start_pointer.y)
		};
	}

	/**
	 * Handle pointer up for drag interaction
	 * @param {PointerEvent} event
	 */
	function on_pointer_up(event) {
		start_pointer = null;
		start_position = null;
		button_el?.releasePointerCapture(event.pointerId);
	}
	
	function handle_debug_change() {
		// Auto-open popover when debug settings change
		if (config.popover_ref && !config.popover_ref.matches(':popover-open')) {
			config.popover_ref.showPopover();
		}
	}
</script>

<svelte:head>
	<title>AnchorPop - CSS Anchor Positioning for Svelte</title>
</svelte:head>

<div class="page">
	<!-- HUD positioned fixed on right side -->
	{#if show_hud}
		<AnchorPopSettingsHUD
			bind:placement={config.placement}
			bind:position_area={config.position_area}
			bind:align_self={config.align_self}
			bind:justify_self={config.justify_self}
			bind:offset={config.offset}
			bind:arrow_color={config.arrow_color}
			bind:arrow_stroke_width={config.arrow_stroke_width}
			bind:arrow_heads={config.arrow_heads}
			bind:flip_axis={config.flip_axis}
			bind:position_try_order={config.position_try_order}
			onclose={() => show_hud = false}
			onchange={handle_debug_change}
		/>
	{/if}

	<div class="content">
		<header class="header">
			<div class="flex-row">
				<img src="/AnchorPop.svg" alt="AnchorPop" class="logo" width="60" height="60" />
				<h1>AnchorPop</h1>
				<a href="https://github.com/johannesmutter/anchorpop" target="_blank" rel="noopener noreferrer" class="github-link" aria-label="View on GitHub">
					<svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
						<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
					</svg>
					GitHub
				</a>
			</div>
			<p class="tagline">Create self-positioning popovers with native CSS—no JavaScript required</p>
		</header>

		<div class="main-layout">
			<div class="demo-column">
				<section class="demo-section">
					<h2>Try it</h2>
					<p class="instruction">Drag the button to screen edges to see the popover follow and flip. <br/>Play with the placement settings.</p>
					
					<div class="demo-area">
				<!-- Draggable trigger button -->
				<button
					bind:this={button_el}
					class="trigger-button"
					popovertarget={config.id}
					onpointerdown={on_pointer_down}
					onpointermove={on_pointer_move}
					onpointerup={on_pointer_up}
					style={`anchor-name: ${config.from_anchor}; position: relative; left: ${drag_position.x}px; top: ${drag_position.y}px; touch-action: none; user-select: none;`}
				>
					<span class="drag-indicator">⋮⋮</span>
					Click me
				</button>

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

				<!-- Popover component -->
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
				>
					<div class="main-demo-popover-content" contenteditable="true">
						Edit this text! The popover stays anchored to the button with automatic positioning and fallbacks.
					</div>
				</AnchorPop>
					</div>
				</section>

				<section class="code-section">
					<h2>Usage</h2>
					<SyntaxHighlight
						value={usage_example}
						regex={/(\/\/.*|\/\*[\s\S]*?\*\/)|(\b(?:import|export|from|const|let|var|function|return|if|else|for|while|class|new|async|await|default)\b)|(<\/?[\w-]+)|(\s[\w-]+(?==))|(['"`](?:\\.|[^'"`\\])*['"`])|(\{|\}|\[|\]|\(|\))|(\d+(?:\.\d+)?)/g}
						colors={[
							{ bg: 'transparent', fg: '#6a737d' },
							{ bg: 'transparent', fg: '#d73a49' },
							{ bg: 'transparent', fg: '#22863a' },
							{ bg: 'transparent', fg: '#6f42c1' },
							{ bg: 'transparent', fg: '#032f62' },
							{ bg: 'transparent', fg: '#24292e' },
							{ bg: 'transparent', fg: '#005cc5' }
						]}
					/>
				</section>
			</div>
		</div>



		<section class="use-cases-section">
			<h2>Make it pop! Make it float!</h2>
			<p>Built any of these components with <code>AnchorPop</code> in just a few lines of code</p>
			<div class="use-cases-grid">
				<DropdownDemo />
				<TooltipDemo />
				<TextEditorDemo />
				<ComboboxDemo />
				<DialogDemo />
				<MessageReactionsDemo />
				<AnnotationDemo />
				<ImageEditorDemo />
				<PreviewCardDemo />
				<PopoverDemo />
			</div>
		</section>

		<section class="install-section">
			<h2>Install</h2>
			<h3>Option 1: Copy & Paste (Recommended)</h3>
			<p>Copy the components directly into your project for full control:</p>
			<SyntaxHighlight
				value={install_curl_example}
				regex={/\b(curl)\b|(https:\/\/[^\s]+)|(>)|(src\/[^\s]+)/g}
				colors={[
					{ bg: '#f3e5f5', fg: '#7b1fa2' },
					{ bg: '#e3f2fd', fg: '#1565c0' },
					{ bg: '#fff3e0', fg: '#ef6c00' },
					{ bg: '#e8f5e8', fg: '#2e7d32' }
				]}
			/>

			<h3>Option 2: NPM Package</h3>
			<SyntaxHighlight
				value={install_npm_example}
				regex={/\b(npm|install)\b|(anchorpop)/g}
				colors={[
					{ bg: '#f3e5f5', fg: '#7b1fa2' },
					{ bg: '#e8f5e8', fg: '#2e7d32' }
				]}
			/>

			<h3>Option 3: Visual Configuration</h3>
			<p>Use the settings panel above to visually configure your popover, then inspect the code and copy the configuration that works for you.</p>
		</section>

		<section class="comparison-section">
			<h2>vs. Floating UI</h2>
			<div class="comparison-table">
				<div class="table-row table-header">
					<div class="table-cell">Feature</div>
					<div class="table-cell">AnchorPop</div>
					<div class="table-cell">Floating UI</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Implementation</div>
					<div class="table-cell">Pure CSS</div>
					<div class="table-cell">JavaScript</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Real Arrows</div>
					<div class="table-cell"><span class="checkmark">✓</span> Dynamic</div>
					<div class="table-cell">Static</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Placement Options</div>
					<div class="table-cell"><span class="checkmark">✓</span> Outside<br><span class="checkmark">✓</span> Inside<br><span class="checkmark">✓</span> Overlay<br><span class="checkmark">✓</span> Border</div>
					<div class="table-cell"><span class="checkmark">✓</span> Outside</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Directional Transitions</div>
					<div class="table-cell"><span class="checkmark">✓</span> Built-in</div>
					<div class="table-cell">–</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Performance</div>
					<div class="table-cell"><span class="checkmark">✓</span> No CLS<br><span class="checkmark">✓</span> Instant positioning<br><span class="checkmark">✓</span> No JS dependency</div>
					<div class="table-cell">Initial layout shift<br>Requires JS calculation</div>
				</div>
				<div class="table-row">
					<div class="table-cell">Browser Support</div>
					<div class="table-cell">(<span class="checkmark">✓</span>) Chrome/ Edge 125+, Safari TP</div>
					<div class="table-cell"><span class="checkmark">✓</span> All modern browsers</div>
				</div>
			</div>
		</section>

		<section class="roadmap-section">
			<h2>Roadmap</h2>
			<ul class="roadmap-list">
				<li><span class="status done">✓</span> Svelte 5 Implementation</li>
				<li><span class="status wip">→</span> React Version</li>
				<li><span class="status planned">○</span> Vue Version</li>
				<li><span class="status planned">○</span> Vanilla JS Version</li>
				<li><span class="status planned">○</span> Animation Presets</li>
			</ul>
		</section>

		<section class="donate-section">
			<div class="donate-content">
				<h2>Let me do more Open Source</h2>
				<p>AnchorPop saves you development time. Consider supporting it:</p>
			</div>
		<div class="donation-calculator">
			<div class="calc-row">
				<label for="hourly-rate">Your hourly rate: $</label>
				<input id="hourly-rate" type="number" bind:value={hourly_rate} min="0" step="10" />
			</div>
			<div class="calc-row">
				<label for="time-saved">Hours saved:</label>
				<input id="time-saved" type="number" bind:value={time_saved} min="0" step="1" />
			</div>
				<div class="calc-result">
					Suggested donation: <strong>${donation_amount}</strong>
					<p class="calc-note">(10% of value saved)</p>
				</div>
				<a href="https://github.com/sponsors/johannesmutter" class="donate-button" target="_blank" rel="noopener">
					Donate on GitHub Sponsors
				</a>
			</div>
		</section>

		<section class="credits-section">
			<h2>Thank you</h2>
			<ul class="credits-list">
				<li><a href="https://css-tip.com/position-area/" target="_blank" rel="noopener">Temani Afif</a> – Position area explorations and CSS dimension measurement technique</li>
				<li><a href="https://ishadeed.com/article/anchor-positioning/" target="_blank" rel="noopener">Ahmad Shadeed</a> – Comprehensive anchor positioning guide</li>
				<li><a href="https://www.oddbird.net/2025/01/29/anchor-position-validity/" target="_blank" rel="noopener">OddBird</a> – Anchor position validity insights</li>
				<li><a href="https://developer.chrome.com/blog/anchored-container-queries" target="_blank" rel="noopener">Chrome</a> & <a href="https://webkit.org/css-status/" target="_blank" rel="noopener">Safari Team</a></li>
			</ul>
		</section>
	</div>
</div>

<style>
	@font-face {
		font-family: 'Shantell Sans';
		src: url('/Shantell_Sans-Informal_Regular.woff2') format('woff2');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'Shantell Sans Light';
		src: url('/Shantell_Sans-Informal_Light.woff2') format('woff2');
		font-weight: 300;
		font-style: normal;
		font-display: swap;
	}

	:global(:root) {
		anchor-scope: all;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		background: #ffffff;
		color: #000000;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
	}

	.page {
		min-height: 100vh;
		padding: 3rem 2rem;
		display: flex;
		justify-content: flex-start;
	}

	@media (min-width: 1280px) {
		.page {
			justify-content: center;
		}
	}

	.flex-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}

	.github-link {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		color: #000000;
		text-decoration: none;
		transition: transform 0.2s ease, opacity 0.2s ease;
		opacity: 0.7;
		margin-left: auto;
		font-family: 'Shantell Sans';
	}

	.github-link:hover {
		opacity: 1;
		transform: scale(1.1);
	}

	.github-link:focus-visible {
		outline: 2px solid #000000;
		outline-offset: 4px;
		border-radius: 4px;
	}

	.content {
		max-width: 800px;
		width: 100%;
	}

	.header {
		text-align: left;
		margin-bottom: 7rem;
	}

	h1, h2, h3, p, li, code {
		font-family: 'Shantell Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	h1 {
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: normal;
		margin: 0 0 0.5rem 0;
		color: #000000;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 1.25rem;
		margin: 0;
		color: #000000;
	}

	h2 {
		font-size: 1.75rem;
		font-weight: normal;
		margin: 0 0 1.5rem 0;
		color: #000000;
	}

	h3 {
		font-size: 1.25rem;
		font-weight: normal;
		margin: 2rem 0 1rem 0;
		color: #000000;
	}

	code {
		background-color: oklch(0% 0 0 / 0.05);
		border: 1px solid oklch(0% 0 0 / 0.05);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		color: oklch(0% 0 0 / 0.7);
	}

	/* Main Layout */
	.main-layout {
		margin-bottom: 7rem;
	}

	.demo-column {
		width: 100%;
	}

	.demo-section {
		margin-bottom: 7rem;
	}

	.instruction {
		font-size: 1rem;
		margin: 0 0 2rem 0;
		color: #000000;
		opacity: 0.6;
	}

	.demo-area {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid #000000;
		border-radius: 4px;
		background: #ffffff;
		position: relative;
	}

	.trigger-button {
		font-family: 'Shantell Sans', cursive;
		padding: 1rem 2rem;
		background: #000000;
		color: #ffffff;
		border: 2px solid #000000;
		border-radius: 4px;
		font-size: 1rem;
		cursor: grab;
		transition: all 0.15s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.trigger-button:active {
		cursor: grabbing;
		transform: scale(0.98);
	}

	.trigger-button:hover {
		background: #ffffff;
		color: #000000;
	}

	.drag-indicator {
		font-size: 1.2rem;
		opacity: 0.5;
		line-height: 1;
	}

	.trigger-button:hover .drag-indicator {
		opacity: 1;
	}

	:global(.popover-content) {
		font-family: 'Shantell Sans', cursive;
		line-height: 1.6;
		color: #000000;
	}
	.main-demo-popover-content {
		max-width: 300px;
		padding: 1rem;
	}

	.code-section {
		margin-bottom: 7rem;
	}

	/* Comparison Table */
	.comparison-section {
		margin-bottom: 7rem;
	}

	.comparison-table {
		display: grid;
		grid-template-columns: 1.5fr 1fr 1fr;
		border: 2px solid #000000;
		border-radius: 4px;
		overflow: hidden;
	}

	.table-row {
		display: contents;
	}

	.table-cell {
		font-family: 'Shantell Sans', cursive;
		padding: 1rem;
		border-bottom: 1px solid #e5e5e5;
		border-right: 1px solid #e5e5e5;
	}

	.table-cell:nth-child(3n) {
		border-right: none;
	}

	.table-header .table-cell {
		background: #000000;
		color: #ffffff;
		font-weight: normal;
		border-bottom: 2px solid #000000;
	}

	.table-row:last-child .table-cell {
		border-bottom: none;
	}

	/* Use Cases Grid */
	.use-cases-section {
		margin-bottom: 7rem;
	}

	.use-cases-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(260px, 100%, 300px), 1fr));
		gap: 2px;
		padding: 2px;
		border-radius: 4px;
		background: oklch(0% 0 0 / 0.05);
		justify-content: flex-start;
	}

	/* Install Section */
	.install-section {
		margin-bottom: 7rem;
	}

	.install-section p {
		margin: 0.5rem 0 1rem 0;
		color: #000000;
	}

	:global(.highlight-editor) {
		font-size: 0.75rem;
		overflow-x: auto;
		white-space: pre;
		border: 2px solid oklch(0% 0 0 / 0.05);
		border-radius: 4px;
		outline: none;
		box-shadow: none;
	}

	/* Roadmap Section */
	.roadmap-section {
		margin-bottom: 7rem;
	}

	.roadmap-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.roadmap-list li {
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e5e5;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.roadmap-list li:last-child {
		border-bottom: none;
	}

	.status {
		font-family: 'Shantell Sans', cursive;
		font-size: 1.25rem;
		width: 1.5rem;
		text-align: center;
	}

	.status.done {
		color: #2e7d32;
	}

	.status.wip {
		color: #f57c00;
	}

	.status.planned {
		color: #757575;
	}

	/* Donate Section */
	.donate-section {
		margin-bottom: 7rem;
		padding: 2rem;
		border: 2px solid #2e7d32;
		border-radius: 4px;
		background: #e8f5e8;
	}

	.donate-content {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.donate-content h2 {
		margin-bottom: 0.5rem;
	}

	.donate-content p {
		margin: 0;
	}

	.donation-calculator {
		max-width: 500px;
		margin: 0 auto;
	}

	.calc-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.calc-row label {
		font-family: 'Shantell Sans', cursive;
		font-weight: 500;
	}

	.calc-row input {
		font-family: 'Shantell Sans Light', monospace;
		width: 120px;
		padding: 0.5rem;
		border: 2px solid #2e7d32;
		border-radius: 4px;
		font-size: 1rem;
		text-align: right;
	}

	.calc-result {
		font-family: 'Shantell Sans', cursive;
		margin: 2rem 0 1.5rem 0;
		padding: 1.5rem;
		background: #ffffff;
		border: 2px solid #2e7d32;
		border-radius: 4px;
		text-align: center;
		font-size: 1.25rem;
		color: #2e7d32;
	}

	.calc-result strong {
		font-size: 2rem;
		display: block;
		margin-top: 0.5rem;
	}

	.calc-note {
		font-size: 0.875rem;
		opacity: 0.6;
		margin: 0.5rem 0 0 0;
	}

	.donate-button {
		font-family: 'Shantell Sans', cursive;
		display: inline-block;
		padding: 1rem 2rem;
		background: #2e7d32;
		color: #ffffff;
		border: 2px solid #2e7d32;
		border-radius: 4px;
		font-size: 1rem;
		text-align: center;
		text-decoration: none;
		transition: all 0.15s ease;
		width: 100%;
		box-sizing: border-box;
	}

	.donate-button:hover {
		background: #ffffff;
		color: #2e7d32;
	}

	/* Table Checkmarks */
	.checkmark {
		color: #2e7d32;
		font-weight: bold;
	}

	/* Credits Section */
	.credits-section {
		margin-bottom: 7rem;
	}

	.credits-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.credits-list li {
		font-family: 'Shantell Sans', cursive;
		padding: 0.75rem 0;
		border-bottom: 1px solid #e5e5e5;
		line-height: 1.6;
	}

	.credits-list li:last-child {
		border-bottom: none;
	}

	.credits-list a {
		font-family: 'Shantell Sans', cursive;
		color: #000000;
		text-decoration: underline;
		transition: opacity 0.15s ease;
	}

	.credits-list a:hover {
		opacity: 0.6;
	}

	/* HUD Fonts */
	:global(.settings-hud) {
		font-family: 'Shantell Sans', cursive !important;
	}

	:global(.settings-hud input),
	:global(.settings-hud select) {
		font-family: 'Shantell Sans Light', monospace !important;
	}
</style>
