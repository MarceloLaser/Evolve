# Mobile UI work (policy + reference)

## Compartmentalization policy (IMPORTANT)

This fork merges upstream (`pmotschmann/Evolve`) regularly. Mobile-friendliness must
never obstruct that:

- ALL mobile CSS lives in `src/mobile.less` (fork-owned file, upstream will never touch
  it). It is attached by a single `@import 'mobile';` as the LAST line of
  `src/evolve.less` — the only upstream-file edit allowed for mobile styling. If a merge
  drops that line, just re-add it.
- Mobile JS helpers live in `src/mobile.js` (fork-owned). Current hooks: one import +
  one `pairSettingDropdowns(settings)` call in `index.js` before `tabs.append(settings)`
  (wraps settings label+dropdown pairs in `.setPair` spans pre-Vue-compile). If a merge
  drops the hooks, re-add those two lines.
- Do NOT edit upstream style blocks in `evolve.less` for mobile behavior, and do NOT
  change `main.js` layout/resize logic. Where main.js sets inline heights
  (`#msgQueue`, `#buildQueue`, `#resources` via saved settings + resizeGame), override
  with `!important` in mobile.less instead.
- Prefer CSS-only solutions gated behind `@media only screen and (max-width: 48rem)`
  (matches upstream's own mobile breakpoint). If JS ever becomes unavoidable, put it in
  a new fork-owned module and wire it with a minimal single-line hook.

## Current state (step 2, 2026-07: Kittens-style split)

Background: Bulma stacks `.columns` below 48rem in DOM order and `html` has
`overflow-y: hidden`, which stranded `#mainColumn` off screen (step 1 problem).

`mobile.less` now builds a side-by-side layout: `.main > .columns` forced back to a
flex row with `.leftColumn` at 33.5% width and `#mainColumn` at 66.5%. The left column
is `position: sticky` (pinned below the top bar, `height: calc(100vh - 2rem)`) and is
itself a flex column: race header + `#buildQueue` (7rem) + `#msgQueue` (9rem) fixed,
`.resources` takes the remaining height (`flex: 1; min-height: 0; height: auto
!important` to beat main.js inline heights) with its own scroll. Left column type is
minified to .7rem (h3/.res overridden — the global `h3 { font-size: 1rem }` rule
would otherwise win). Resource rows wrap to two lines: name + count on top,
crate/craft controls + rate on a second right-aligned line. Page scrolls vertically
for tall tab content; `.topBar` and the `.tabs` strip scroll sideways instead of
clipping.

Step 3 (settings density): mobile block compacts `#settings` — base font .75rem,
buttons and dropdown triggers .65rem/1.25rem tall, switches .7rem (Buefy tracks are
em-sized so they shrink with font; toggles flow inline and wrap), smaller dropdown
items/labels/textarea, tighter section margins, smaller `.keyMap`/`.msgInput`
inputs, and `.tab-item`/`.tab-content` left gutters reduced from 1rem to .25rem for
all tabs. Settings label+dropdown pairs are wrapped in `.setPair` spans by `mobile.js`
(pre-mount) and styled inline-flex on mobile: pairs pack per line when they fit and
wrap between pairs, never mid-pair. The
`.stringPack` row is flex so the file picker aligns with its buttons. `#mainColumn`
has .5rem left padding as a pane divider. The tab-mappings section is hidden on
mobile via `.importExport:has(#showCivKey)` (keyboard shortcuts, meaningless on
touch); key mappings kept pending a mobile replacement for the multiplier keys.

Step 4 (message log): `#msgQueue` 10rem tall, messages .7rem (one step below the
desktop `.msgQueue` .75rem rule). Header spans (Clear/Clear All/gear) drop their
1rem override to `inherit` and the gear svg (fixed 12px attrs) is CSS-sized to
.7rem. `#msgQueueFilters` drops its .875rem/nowrap-hscroll behavior: inherit size,
wrapping lines showing all categories, .75rem gaps.

Step 5 (action buttons): `.main .content .action` wrappers (city/space/research —
all tabs share the class) get `width: 32.9%` (three per row; not a full third
because the inline-block wrappers have whitespace gaps) with the button at
`calc(100% - .375rem)` and font .75rem. Shapes, margins, padding, and the count/
on/off/gear adornments are upstream defaults — user wants original proportions,
just denser (was ~2 per row at the fixed 12.625rem width).

## Known follow-ups (not yet done)

- Tab content panes still use desktop `calc(100vh - …)` heights inside the flow.
- Landscape phones (> 48rem) still get the cramped desktop two-column layout.
- Touch interaction model: the game's "Touch Device" setting is mostly dead code due to
  an operator-precedence bug (`userAgent.match(/Mobi/ && global.settings.touch)`) in
  `actions.js` and `functions.js` — see git history / ask before fixing (upstream files).
- Action grids, modals, and popovers are unaudited on small screens.
