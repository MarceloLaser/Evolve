# Seeded RNG system (reference; verified 2026-07)

Core: `seededRandom(min, max, alt, useSeed)` in `src/vars.js` (~line 71). LCG:
`newSeed = (seed * 9301 + 49297) % 233280; rnd = newSeed / 233280`.

**Two persistent seeds**, both fields of `global` (so they persist in saves and
export strings): `global.seed` (main) and `global.warseed` (used when `alt=true`).
A seed is static until something rolls against it; the next outcome is fully
determined by the stored value, and each roll advances the seed it used. The
community model ("trigger a different RNG event to change the next outcome") is
correct, with the caveat that the two seed streams are independent:

- `global.warseed` (`alt=true`): foreign-power combat resolution in
  `src/civics.js` (`armyRating` battles ~1577-1800: luck, enemy strength, deaths,
  wounded, loot rolls). Only other warseed rolls advance it.
- `global.seed` (main): nearly everything else — event *selection* (not timing)
  in `main.js` (`eventList` picks ~12756/12777), planet generation
  (`setPlanet` in `actions.js`, `genPlanets` in `space.js`), spy outcomes,
  many rolls in `races.js`/`portal.js`/`edenic.js`/`governor.js`/`events.js`.

**Not part of the seeded system**: `Math.rand` (unseeded `Math.random` wrapper,
`vars.js` ~65) — used for event *timing* countdowns (`main.js` ~12753/12771).
Those cannot be predicted or re-rolled by seed manipulation.

**`useSeed` (4th arg)**: computes a roll from a caller-supplied seed without
touching stored state. Used for spire mech resist/weakness (`portal.js`
~6361-6378), derived from reset count / spire floor — deterministic per run,
not re-rollable at all.

**Planet roll determinism (Bioseed / Black Hole / etc.)**: each prestige reset
stores `seed: Math.floor(seededRandom(10000))` into the new `global.race`
(one main-seed roll at reset time; `resets.js`, 11 sites). While
`race.seeded && !race.chose`, every page load runs `global.seed = global.race.seed`
then `genPlanets()` (`main.js` ~838-845), so planet options are identical across
reloads; random events are suppressed during selection (`main.js` ~12752) to
protect this. To change planet options you must advance the main seed *before*
triggering the reset — after the reset the options are locked into `race.seed`.

**Seed lifecycle**: re-randomized via `Math.rand` (truly random) on new game
(`vars.js` `newGameData` ~2021) and some reset paths (`resets.js` ~1286,
`vars.js` ~2274). Old-save migration sets `warseed = seed + 1` (`vars.js` ~548).

Line numbers drift; anchor searches on function names.
