# Mobile UI work (policy + reference)

## Compartmentalization policy (IMPORTANT)

This fork merges upstream (`pmotschmann/Evolve`) regularly. Mobile-friendliness must
never obstruct that:

- ALL mobile CSS lives in `src/mobile.less` (fork-owned file, upstream will never touch
  it). It is attached by a single `@import 'mobile';` as the LAST line of
  `src/evolve.less` — the only upstream-file edit allowed for mobile styling. If a merge
  drops that line, just re-add it.
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
all tabs. `.queue`/`.theme`/`.localization` use a 2-col grid (label | dropdown) so a
label always shares its row with its dropdown and wraps within its own cell. The
`.stringPack` row is flex so the file picker aligns with its buttons. `#mainColumn`
has .5rem left padding as a pane divider. The tab-mappings section is hidden on
mobile via `.importExport:has(#showCivKey)` (keyboard shortcuts, meaningless on
touch); key mappings kept pending a mobile replacement for the multiplier keys.

## Known follow-ups (not yet done)

- Tab content panes still use desktop `calc(100vh - …)` heights inside the flow.
- Landscape phones (> 48rem) still get the cramped desktop two-column layout.
- Touch interaction model: the game's "Touch Device" setting is mostly dead code due to
  an operator-precedence bug (`userAgent.match(/Mobi/ && global.settings.touch)`) in
  `actions.js` and `functions.js` — see git history / ask before fixing (upstream files).
- Action grids, modals, and popovers are unaudited on small screens.
