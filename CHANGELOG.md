# Changelog

All notable changes to MMM-BirdOfTheDay are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-07-11

This release moves all API communication to a MagicMirror `node_helper`, which makes the module more robust and keeps your API key on the server side. Update with `git pull` in the module folder — no config changes are required.

### Added
- **Image variation**: when a bird has more than one photo (about two thirds of them do), a random one is picked each rotation instead of always the first.
- **State persistence**: the current bird, its picture, and the "already shown" history now survive restarts. Your Bird of the Day no longer changes every time the mirror reboots. (State is stored in `.botd-state.json` in the module folder.)
- **Calendar-aligned rotation**: `Daily` now rotates at midnight, `Hourly` at the top of the hour, and `Weekly` on Monday at midnight (local time) — previously rotation was relative to whenever the mirror last booted.
- **Error messages on the mirror**: a missing API key or an unreachable API now shows a readable message instead of "Loading Bird..." forever. If the API is down at boot (e.g. the network isn't up yet), the module retries every 2 minutes until it succeeds.
- **Translations**: English and Swedish (`sv`) via MagicMirror's translation system, including the module title.
- `alt` text on the bird image.

### Changed
- All Nuthatch API calls moved from the browser to a new `node_helper.js`, so the API key is no longer visible in client network traffic.
- Bird selection is now deterministic: a fresh bird is always chosen from the not-yet-shown pool instead of random retrying. `maxHistory` is automatically capped below the number of available birds, so history can never dead-lock selection.
- Birds with missing data no longer render placeholder text such as "Conservation Status: null" — empty fields are simply hidden (29 of the 366 birds in the database currently lack a conservation status).
- Logging goes through MagicMirror's `Log` module.
- The rotation timer is paused while the module is hidden (`suspend`/`resume`) and catches up when shown again.
- Bird text is rendered with `textContent` instead of `innerHTML`.

### Fixed
- Module no longer hangs on "Loading Bird..." forever when the network or API is unavailable at startup.
- `maxHistory` default was documented as 50 but was actually 100 — it is now 50, matching the README.

### Removed
- Old duplicate `readme.md` (leftover from an earlier version; collided with `README.md` on case-insensitive file systems).
- Unused `node-fetch` dependency.
- The undocumented `updateInterval` config option, which was always overridden by `rotation` and never had any effect.

## [1.1.8] and earlier

See the [GitHub release history](https://github.com/cgillinger/MMM-BirdOfTheDay/releases) and commit log. Highlights: full-database loading for better variation (fixing bird repetition), layout options (`textPosition`), and configurable rotation intervals.
