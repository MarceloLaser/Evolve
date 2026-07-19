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

## Current state (step 1, 2026-07)

Root cause of the broken portrait layout: Bulma stacks `.columns` below 48rem in DOM
order (left column first), `html { overflow-y: hidden }` prevents document scroll, and
the left column + panes are viewport-height — so `#mainColumn` (tab strip + all
content) rendered off-screen and unreachable.

`mobile.less` currently: restores `html` vertical scroll (mobile only); flex-column
reorders `.main > .columns` so `#mainColumn` is first and `.leftColumn` (log +
resources) second, both full width; caps pane heights (`#msgQueue` 12rem,
`#buildQueue` 7rem, `#resources` 50vh, `!important` to beat inline styles); makes
`.topBar` and the `.tabs` strip horizontally scrollable instead of clipped.

## Known follow-ups (not yet done)

- Tab content panes still use desktop `calc(100vh - …)` heights inside the flow.
- Landscape phones (> 48rem) still get the cramped desktop two-column layout.
- Touch interaction model: the game's "Touch Device" setting is mostly dead code due to
  an operator-precedence bug (`userAgent.match(/Mobi/ && global.settings.touch)`) in
  `actions.js` and `functions.js` — see git history / ask before fixing (upstream files).
- Action grids, modals, and popovers are unaudited on small screens.
