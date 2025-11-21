<script>
	import { onMount } from 'svelte';

	/**
	 * @typedef {{bg?: string, fg?: string}} ColorDefinition
	 * Color can be a simple string for background only, or an object with bg/fg properties
	 */

	/**
	 * @typedef {{node: Text, startOffset: number, endOffset: number, text: string}} TextNodeMap
	 * Maps text nodes to their position offsets in the combined text
	 */

	/**
	 * @typedef {{node: Text, offset: number}} NodePosition
	 * Represents a position within a specific text node
	 */
	
	let {
		/** @type {string} The text content to highlight */
		value = $bindable(''),
		/** @type {RegExp} Regular expression pattern for matching groups */
		regex = /([^@]+)@?(.*)?/g,
		/** @type {Array<ColorDefinition>} Array of colors for each regex group */
		colors = [
			{ bg: '#e3f2fd', fg: '#1565c0' },
			{ bg: '#f3e5f5', fg: '#7b1fa2' },
			{ bg: '#e8f5e8', fg: '#2e7d32' },
		]
	} = $props();

	/** @type {HTMLDivElement} */
	let element;

	/** <style> element that hosts our dynamic ::highlight() rules */
	let style_el;

	/** Memorises which group indices already have a CSS rule */
	const styled_groups = new Set();

	/* ───────────────────────── helpers ───────────────────────── */

	/** Collect all descendant text nodes */
	function get_all_text_nodes(root) {
		const nodes = [];
		const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let n;
		while ((n = w.nextNode())) nodes.push(n);
		return nodes;
	}

	/** Build map of text-nodes → absolute offsets */
	function create_position_map() {
		const nodes = get_all_text_nodes(element);
		let offset = 0;
		return {
			map: nodes.map(node => {
				const start = offset;
				offset += node.data.length;
				return { node, startOffset: start, endOffset: offset, text: node.data };
			}),
			total_text: nodes.map(n => n.data).join('')
		};
	}

	/** Convert absolute offset → {node, offset} inside that node */
	function to_node_pos(abs, map) {
		for (const m of map)
			if (abs >= m.startOffset && abs <= m.endOffset)
				return { node: m.node, offset: abs - m.startOffset };
		return null;
	}

	/* ───────────────────────  highlights  ────────────────────── */

	/** Inject missing ::highlight(groupN) rules once */
	function ensure_css_rule(group_idx) {
		if (styled_groups.has(group_idx)) return;

		const rule = `::highlight(group${group_idx}){` +
					`background-color: var(--group${group_idx}-bg);` +
					`color: var(--group${group_idx}-fg)}`;
		style_el.sheet.insertRule(rule, style_el.sheet.cssRules.length);
		styled_groups.add(group_idx);
	}

	/** Generate inline CSS variables for as many groups as needed */
	function css_vars(max_idx) {
		const parts = [];
		for (let i = 1; i <= max_idx; i++) {
			const c = colors[i - 1] ?? {};
			const bg = typeof c === 'string' ? c : c.bg ?? `hsl(${i * 60} 70% 80%)`;
			const fg = typeof c === 'string' ? 'inherit' : c.fg ?? 'inherit';
			parts.push(`--group${i}-bg:${bg}`, `--group${i}-fg:${fg}`);
		}
		return parts.join(';');
	}

	/** Remove only the ranges that belong to THIS component */
	function clear_my_highlights() {
		if (!CSS?.highlights) return;
		const my_nodes = get_all_text_nodes(element);

		for (const [name, hl] of CSS.highlights) {
			if (!/^group\d+$/.test(name)) continue;

			const keep = [];
			for (const range of hl)
				if (!my_nodes.some(n =>
						range.commonAncestorContainer === n ||
						n.contains(range.commonAncestorContainer) ||
						range.commonAncestorContainer.contains(n)))
					keep.push(range);

			keep.length ? CSS.highlights.set(name, new Highlight(...keep))
						: CSS.highlights.delete(name);
		}
	}

	/** Main routine: find matches, build ranges, add to Highlight registry */
	function update_highlights() {
		if (!CSS?.highlights || !value) return;

		const { map, total_text } = create_position_map();
		regex.lastIndex = 0;

		let m, max_group_seen = 0;
		while ((m = regex.exec(total_text))) {
			for (let i = 1; i < m.length; i++) {
				if (!m[i]) continue;

				const group_start = m.index + m[0].indexOf(m[i]);
				const start = to_node_pos(group_start, map);
				const end   = to_node_pos(group_start + m[i].length, map);

				if (start && end) {
					const name = `group${i}`;
					const range = new Range();
					range.setStart(start.node, start.offset);
					range.setEnd(end.node,   end.offset);

					(CSS.highlights.get(name) ?? new Highlight()).add(range);
					CSS.highlights.set(name, CSS.highlights.get(name) ?? new Highlight(range));
				}
				max_group_seen = Math.max(max_group_seen, i);
				ensure_css_rule(i);
			}
			if (!regex.global) break;
		}

		// Update inline variables just once per call
		element.style.cssText = css_vars(max_group_seen);
	}

	/* ───────────────────────── lifecycle ─────────────────────── */

	onMount(() => {
		style_el = document.createElement('style');
		style_el.setAttribute('data-dynamic-highlights', '');
		document.head.append(style_el);

		queueMicrotask(update_highlights);

		return () => {
			clear_my_highlights();
			style_el.remove();
		};
	});

	/* Recompute when value / regex change */
	$effect(() => {
		if (element) {
        element.textContent = value;
    }
		clear_my_highlights();
		queueMicrotask(update_highlights);
	});
</script>

<div
	bind:this={element}
	contenteditable
	oninput={(event)=>{
		value = event.currentTarget.textContent || '';
		clear_my_highlights();
		update_highlights();
	}}
	class="highlight-editor"
></div>

<style>
	.highlight-editor{
		outline:1px solid #ccc;
		outline-offset: -0.5px;
		padding:8px;
		min-height:2em;
		font-family: 'Shantell Sans Light', monospace;
		white-space:pre;
		&:focus {
			position: relative;
			z-index: 1;
			outline-color: #222;
		}
	}
</style>