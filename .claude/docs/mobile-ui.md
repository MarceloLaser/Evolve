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

Step 5 (action buttons): the region containers (`.city`/`.space`/`.tech` — used
uniformly across city/space/interstellar/portal/eden/tauceti/research) are
flex-wrap grids on mobile; the classless first `<div>` (section header) gets
`width: 100%`. Flex ignores whitespace text nodes, so `.action` wrappers are an
exact `width: 33.33%` (three per row — four proved too cramped; in the few
non-flexed containers like #evolution whitespace gaps drop it to 2 per row —
acceptable). Button `calc(100% - .125rem)`, margins .125rem (tight gaps), button
font .75rem, `.aTitle` .7rem, all three counts (total/on/off) .7rem. `span.on`
re-anchored `right: .125rem` (upstream .375rem matched the old button margin).

Step 5b (edge reclamation): `.main` side margins .125rem, `#mainColumn` divider
padding .25rem, tab-item/tab-content paddings 0. Tab panes are natural height on
mobile (`position: static; height: auto !important; overflow-y: visible` on
`.sticky`, `.mtab`, `.resTabs > section`, `.govTabs2 > section`, `.settings`,
`#evolution`) so the inner scrollbar no longer occupies the right edge; content
scrolls with the page. The tab-content/tab-item gutter overrides
and the `.resTabs` subtab strip indent are fixed at .25rem — NOTE: the gutter rules
MUST carry the `.main` prefix (upstream nests under `.main .content`; unprefixed
versions silently lose the cascade — this bug shipped once). Gear `div.special`
pinned `top: 0` (desktop .5rem offset overlapped the off count at compact size). Shapes, margins, padding, and the count/
on/off/gear adornments are upstream defaults — user wants original proportions,
just denser (was ~2 per row at the fixed 12.625rem width). The on/off power counts
are `.action` children (siblings of the button) and sized .75rem separately;
section headers (`h3.name`, e.g. Outskirts) also .75rem; tab strips tightened
(`.tabs` margin-bottom/ul margin-top .25rem, link padding .25em/.75em). Button
row gap .125rem (top margin); `.space`/`.city`/`.tech` section margin-top .25rem
(upstream :first-child rules keep first sections at 0); gear `div.special` box
1rem square with the 12px svg CSS-sized to .6rem.

Step 6 (Civics → Government): `.main .government` and `.main .garrison` base font
.75rem, buttons .65rem/1.25rem (selectors at upstream depth: `.govType button`,
`.foreign button`), tax rate row 1rem, tighter header/bunks margins.

Step 6b (population assignment): `#civics` is a Bulma tile row (tiles only flex at
>=769px, so government content stacked below jobs on mobile) — forced
`display: flex` with `.jobList` at `flex: 0 0 auto; max-width: 11.5rem`. Job rows
.7rem with the fixed 10rem/1rem name column shrunk to auto/min 5.5rem, counts min
3rem, compact +/- controls, sshifter and foundry margins tightened. Other Civics
subtabs (Military/Foreign/Industry) not yet audited.

Step 6c fixes: job `.controls` are `flex: none; white-space: nowrap` (stepper
glyphs were stacking on squeezed rows like Unemployed); `.bunk`/`.battle` garrison
rows get `margin: 0` (they are Bulma .columns with negative margins and non-.column
children — tightening `.bunks` margin in 6a caused left-edge clipping of
Soldiers/Wounded); mercenary button compact + `margin-left: auto`; section header
h2s .75rem; foreign `.glabel`/`.glevel` fixed widths (9rem/8rem) → auto so values
sit beside labels (glabel min 7.5rem = longest label, aligns the three values).
Job name column fixed 6.5rem so steppers align across rows; taxRate label
(`h3#taxRateLabel`, was global 1rem) .75rem; `.bunk .hire` margin-top 0 (upstream
1rem, note the depth — `.garrison .hire` alone loses); `.war` margins .25rem.

## Known follow-ups (not yet done)

- **Small touch targets — do as one sweep** (enlarge hit areas invisibly, e.g. padding
  + negative margin or ::before overlay; keep visuals unchanged):
  - Tab strip links (~28px tall after padding reduction)
  - Building on/off power toggles (~14px)
  - Building gear/config icon (~16px, `div.special`)
  - Resource crate/container `+` controls and craft `+1/+5/A` links in the left column
  - Resource alert checkboxes (native size at .7rem type)
  - Message log Clear / Clear All / gear (post step 4 sizing)
- Building buy multiplier: keyboard x10/x25/x100 keys have no mobile equivalent yet
  (key mappings kept in settings pending this; e.g. a persistent multiplier toggle).
- Buildings with "flair" icons at fixed rem offsets may crowd titles at the compact
  button size — tune against a real case when spotted.
- Tab strips scroll away with the page now that panes are natural-height (step 5b
  made `.sticky`/`.mtab`/resTabs+govTabs2 sections/`.settings`/#evolution static,
  height auto). Consider making the tab strips position: sticky on mobile so
  switching tabs doesn't require scrolling back up.
- Landscape phones (> 48rem) still get the cramped desktop two-column layout.
- Touch interaction model: the game's "Touch Device" setting is mostly dead code due to
  an operator-precedence bug (`userAgent.match(/Mobi/ && global.settings.touch)`) in
  `actions.js` and `functions.js` — see git history / ask before fixing (upstream files).
- Action grids, modals, and popovers are unaudited on small screens.
