# Evolve

## Play

https://pmotschmann.github.io/Evolve/

## About

An incremental game about evolving a civilization from primordial ooze into a space faring empire.
Evolve combines elements of a clicker with an idler and has lots of micromanagement.

What will you evolve into?

## Fork Additions: Resource Max Alerts
This fork adds a checkbox next to each resource in the left-hand resource list. Resources that cannot meaningfully alert have no checkbox: the population resource (named after the current species), Crates, Containers, crafted resources (Plywood, Brick, etc.), and prestige resources (Plasmids, Phage, etc.). Checking a resource's box arms an audible alert: a ding plays when that resource reaches its maximum capacity. The ding plays once per fill (it re-arms only after the resource dips below max), and a shared 30 second cooldown prevents any resource from dinging within 30 seconds of another alert. Checkbox state is saved with the game (under `settings.resAlert`), so it survives page reloads and is included in exported/imported save strings. The sound is synthesized with the Web Audio API, so no audio assets are required.

Implementation lives in `src/resources.js` (checkbox rendering, alert state, and sound) with the periodic check called from `midLoop` in `src/main.js`.

While Accelerated Time (the double-speed mode accumulated offline) is active, all durations rendered through the shared `timeFormat` helper — research/build affordability timers, spire and waygate progress, the cap timer, etc. — are halved to show real-time expectations instead of game time.

A cap timer sits in the resource column header between Morale and the power meter: it shows the shortest time-to-cap among alert-checked resources (already-capped resources are skipped; `0s` if all checked resources are capped; `Never` if none are filling). It is hidden when no eligible resource is checked. Hovering the timer shows a tooltip listing every checked, not-yet-capped resource with its own time to cap, closest first.

A master checkbox next to the species name toggles all resource alert checkboxes at once: it shows unchecked/dash/checked when none/some/all displayed resources are checked, and a click checks everything if nothing was checked, otherwise unchecks everything.

The version display in the top bar checks upstream (`pmotschmann.github.io/Evolve`) on load and every 15 minutes; if upstream has a newer release than this fork, the version text turns light red and gains a trailing exclamation mark (replacing the stock yellow "Update Available" text swap).

Additionally, in the GruvBox Dark theme, resources with an armed alert checkbox turn light red when above 85% of their capacity and stay red even at max (instead of the standard yellow near-max color); this updates immediately when the checkbox is toggled. Unchecked resources keep the game's default coloring. The threshold class (`near-cap`) and alert class (`res-alert`) are applied for all themes in `src/main.js`/`src/resources.js`, but only GruvBox Dark styles them (`src/evolve.less`).

## Fork Additions: Live Tooltips
Research and evolution tooltips refresh once per second while open, so the "ready in" affordability countdown at the bottom counts down without needing mouse movement (cost coloring updates too). Building tooltips already had live timers via the game's own reactive binding and are unchanged.

## Fork Additions: Cloud Save (Google Drive)
The Settings tab has a "Cloud Save" section with Save to Cloud / Load from Cloud buttons. The save is stored in the hidden per-app `appDataFolder` of the signed-in Google account — no file path or picker involved. Signing in with the same Google account on another device gives access to the same cloud save. Saving warns before overwriting a cloud save that looks further progressed (by resets, then days); loading confirms before replacing the local game and then reloads the page.

Setup notes: sign-in uses Google Identity Services (loaded in `index.html`); the OAuth client ID is defined in `src/cloud.js` and its authorized JavaScript origins must include wherever the game is served (currently `http://localhost:4400`). Requires being served over http(s) — `file://` will not work. Access tokens last about an hour; the first click of a session may show a Google popup, after which calls are silent.

## Submitting Issues
If you think you have discovered a bug or have some other issue with the game then you can open an issue here on Github.
Please do not open Github issues to ask gameplay questions, use Reddit or Discord for that.
Links for both can be found in the footer of the game.

## Contributing a Language file
If you are interested in a contributing a new language for Evolve the process is fairly straight forward (although a bit tedious).

Make a copy of strings/strings.json and name the copy as strings/strings.\<locale\>.json (EX: strings.es_US.json). The locale format is the language alpha-2 code joined with the country alpha-2 code.

The strings are stored in a json format and will look like this:
```
"job_farmer_desc": "Farmers create food to feed your population. Each farmer generates %0 food per second.",
```
If you are unfamiliar with json the first part is a **key** and cannot be altered, **do not translate or modify the key in any way**. The second part is the string to be translated. Many game strings use **tokens** (**%0**, **%1**, **%2**, etc) to represent game values, as such these tokens must remain in the final translated string. Their position can be moved accordingly, the number represents a specific value and not its position in the string.

To enable your language translation in the game you must add it to the locales constant in locale.js (bottom of the file).

Once you feel your translation file is ready send a pull request with it to the Evolve main branch.


## Contributing to the game
Bug fixes, additional translations, themes, or UI improvements can simply be submitted as pull requests; once reviewed and accepted they will be merged into the main game branch. If you want to contribute a new feature it can not arbitrarily make something easier without making something else harder. If your new feature idea simply makes the game easier it will not be accepted.

All pull requests should be based off current dev branch.
The dev branch is either master or named after its version number.
Please check the current game version and what branches are available before contributing.
Pull requests should not contain the JS/CSS files generated by the build.

## CSS Changes
Evolve uses LESS to build its CSS, you can not just edit the minified CSS file. You must instead edit src/evolve.less then use the less compiler to rebuild the CSS file.

## Build Commands
Assuming you configured your build environment correctly the game can be built, deployed to GitHub Pages or launched using
```
# Builds everything on Linux
npm run build
# Builds everything on Windows
npm run build-win
# Builds the game bundle
npm run evolve
# Builds the CSS file for the game on Linux
npm run evolve-less
# Builds the CSS file for the game on Windows
npm run evolve-less-win
# Builds the wiki bundle
npm run wiki
# Builds the Wiki CSS file on Linux
npm run wiki-less
# Builds the Wiki CSS file on Windows
npm run wiki-less-win
# Launches the game server locally on localhost:4400
npm run serve
# Deploys the game to GitHub Pages on Linux (requires forking)
npm run deploy
# Deploys the game to GitHub Pages on Windows (requires forking)
npm run deploy-win
```

## Docker
If you already have a Docker environment set up and want to run an evolve server using Docker, you can execute the following command to build a Docker image for the evolve server.

```
# Build evolve server image
docker build . -t evolve

# Run evolve server. Default address: http://localhost:8080/
docker run --name evolve -p 8080:80 -d evolve
```
