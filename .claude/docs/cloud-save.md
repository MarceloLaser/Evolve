# Cloud save via Google Drive (reference; implemented 2026-07)

All logic in `src/cloud.js`; UI is a "Cloud Save" section in the Settings tab
(`src/index.js`, after the import/export block, methods `cloudSaveGame`/`cloudLoadGame`
in `mainVue`). Status text goes to `#cloudStatus` (styled in `evolve.less`).

## Auth

- Google Identity Services token flow (script tag in `index.html`:
  `https://accounts.google.com/gsi/client`). No gapi, no client secret, no redirect URI.
- Client ID const `cloudClientID` in `cloud.js`
  (`1097364945027-....apps.googleusercontent.com`). Google Cloud project is the
  user's personal one, published to production unverified; authorized JS origins
  must list the serving origin (currently `http://localhost:4400` and
  `http://127.0.0.1:4400`). New host/port => add origin in console Credentials.
- Scope: `https://www.googleapis.com/auth/drive.appdata` only.
- `getToken()` caches the access token in memory (~1h, `expires_in`); requested
  lazily inside button clicks so the consent popup is never blocker-prone.
  401 responses clear the cached token so the next click re-auths.

## Storage model

- Single file `evolve.save` in `appDataFolder` (hidden per-app, per-account space;
  user never sees paths). Cross-device sync = same Google account + same client ID.
- File content = `window.exportGame()` output (LZString base64 of `global`) —
  identical to the manual export string. Load path validates by decompressing and
  checking for `evolution`/`stats` keys, then calls `window.importGame(data)`
  (which writes localStorage and reloads the page).
- Progress metadata stored as Drive `appProperties`: `resets` (`global.stats.reset`)
  and `days` (`global.stats.days`). Used to warn before overwriting a cloud save
  that looks further progressed. Comparison: more resets, or equal resets + more days.

## REST endpoints used (plain fetch, Bearer token)

- find: `GET drive/v3/files?spaces=appDataFolder&q=name%3D'evolve.save'&fields=files(id,modifiedTime,appProperties)`
- create: `POST upload/drive/v3/files?uploadType=multipart` (metadata part sets
  `parents: ['appDataFolder']`)
- update: `PATCH upload/drive/v3/files/{id}?uploadType=multipart` (no parents on update)
- download: `GET drive/v3/files/{id}?alt=media`

## Behaviors / guards

- `global.race['noexport']` blocks cloud saving (same as export).
- Confirmations use `window.confirm` (outside any Vue/Buefy context).
- Requires serving over http(s); `file://` cannot do OAuth.
