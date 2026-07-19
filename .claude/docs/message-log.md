# Message Log system (reference; verified 2026-07)

## Data model

- Category list: `message_filters` const in `src/vars.js` (~61):
  `all, progress, queue, building_queue, research_queue, combat, spy, events,
  major_events, minor_events, achievements, hell`.
- Runtime store: `message_logs` (`vars.js` ~58) = `{ view: '<current tab>' }` plus
  one array per category of `{msg, color}` (newest first), created by
  `initMessageQueue` (`functions.js` ~352).
- Per-category settings: `global.settings.msgFilters[<cat>] =
  { unlocked, vis, max, save }` — `unlocked` gates settings-modal rows, `vis`
  gates the tab, `max` caps the in-memory/display log, `save` caps how many
  messages persist across reloads. Defaults seeded in `vars.js` ~1403-1432:
  `all/progress/events/major_events/minor_events` start unlocked+visible, the
  rest start locked. Old-save migrations: `vars.js` ~835-885.
- Persistence: `global.lastMsg[<cat>]` = `{m, c}` arrays (part of the save);
  replayed on page load in `main.js` ~181-188.

## Posting messages

`messageQueue(msg, color, dnr, tags, reload)` in `src/functions.js` (~364):
- `tags` = array of category names; `'all'` is auto-appended. `color` = Bulma
  text class suffix (default `warning`). Text is inserted with `.text()` — no HTML.
- DOM (`#msgQueueLog`) is prepended only when the currently viewed tab is in
  `tags`; each tagged in-memory log is trimmed to `.max`.
- Unless `dnr` (do-not-record) is truthy, the message is also unshifted into
  `global.lastMsg[tag]` trimmed to `.save`. The load-time replay passes
  `dnr=true, reload=true` (reload skips the auto-'all' tag).

## UI

- Tab strip built in `src/index.js` ~967-971: one `<span id="msgQueueFilter-<cat>">`
  per entry of `message_filters`, label `loc('message_log_<cat>')`,
  `v-show="s.<cat>.vis"`, click → `swapFilter`. Vue bind on `#msgQueue`
  (`index.js` ~972) with data `m: message_logs, s: global.settings.msgFilters`;
  methods `swapFilter` (re-renders log), `clearLog(filter?)` (resets memory +
  lastMsg), `trigModal` (settings).
- Settings modal is built inline inside `trigModal` (`index.js` ~1004-1155),
  three sections iterating `message_filters`, rows `v-show` on `.unlocked`:
  - Visible Categories: `b-checkbox v-model s.<cat>.vis`; can't hide the last
    visible tab (`checkDisabled`); hiding the active tab auto-swaps view (`check`).
  - Log Length: numberinput → `.max` (min 1) via Apply (`applyMax`, also clamps
    `.save` and trims logs/DOM).
  - Save amount: numberinput → `.save` (0..max) via Apply (`applySave`).

## Category unlocking

Feature-unlock code sets `msgFilters.<cat>.unlocked = true` and usually
`.vis = true` (e.g. `achieve.js` ~332 achievements, `actions.js` ~1986 combat,
`tech.js` queue/spy/hell grants, `portal.js` ~8941 hell). Locked categories
still record messages; they're just invisible in tab strip and modal.

## Adding a new category — checklist

1. Append name to `message_filters` (`vars.js` ~61). The default block at
   `vars.js` ~1419 auto-creates its settings (locked) and `lastMsg` store;
   tab strip, settings modal, and persistence all iterate `message_filters`,
   so they pick it up automatically.
2. Add loc string `message_log_<name>` to `strings/strings.json`.
3. Unlock it somewhere (`unlocked = true; vis = true`), or add it to the
   default-unlocked list (`vars.js` ~1408).
4. Tag messages with it: `messageQueue(msg, color, false, ['<name>', ...])` —
   messages may carry multiple categories (e.g. `['events','major_events']`).

Line numbers drift; anchor searches on function names.
