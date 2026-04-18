# AGENTS.md

Quick reference for extending this repo. Read `README`-free — this file is
the manual.

## What this repo is

A tiny collection of kid-friendly browser games shipped as a single
installable PWA. No build step, no frameworks, no dependencies: plain HTML,
CSS, ES modules, a single service worker, a single manifest. Hosted as a
static site.

```
/
├── index.html              # Hub (grid of game tiles)
├── styles.css              # Shared base + hub styles + shared modal card
├── app.js                  # Hub JS (registers the service worker)
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker — cache-first, versioned
├── icons/                  # PWA icons
└── games/
    ├── pacman/             # One folder per game
    ├── piano-tiles/
    └── colouring/
```

## Adding a new game

1. **Create the folder** `games/<slug>/` with at least:
   - `index.html` — game shell
   - `<slug>.css` — game-specific styles
   - `<slug>.js` — game entry (ES module)
   - Any extra modules the game needs (e.g. `stencils.js`, `maze.js`)

2. **Use the standard shell** in `index.html`. Every game re-declares the
   same viewport/meta/manifest/icon wiring so it can be loaded directly.
   Copy an existing game's `<head>` verbatim and adjust only the title and
   the game-specific stylesheet link. The two things every game needs:
   - `<link rel="manifest" href="../../manifest.webmanifest" />`
   - `<link rel="stylesheet" href="../../styles.css" />` (gives you the
     CSS variables, base resets, and shared modal styles)

3. **Back link**: put `<a class="pac-back" href="../../" aria-label="Back
   to games">&larr;</a>` in the header. The `.pac-back` class is defined
   in `games/pacman/pacman.css` — if you need it outside Pac-Man, copy the
   rule into your game's stylesheet or promote it to `styles.css`.

4. **Layout conventions**: full-viewport games use
   `height: 100vh; height: 100dvh; overflow: hidden;` on the body and a
   flex column (header / main / footer). See `games/colouring/colouring.css`
   for a simple reference.

5. **Persistence**: use `localStorage` with a namespaced prefix
   (`pacman.best`, `piano-tiles.tweak`, `colouring.fills.<id>`, …). Always
   wrap `localStorage` calls in `try/catch` — Safari private mode throws.

6. **Shared modal**: for game-over / win screens, reuse the `.pac-win`,
   `.pac-win__card`, `.pac-win__title`, `.pac-win__btn` classes defined
   in `styles.css`. No need to redefine them per game.

7. **Add a hub tile** in `/index.html`. Append a `<li>` inside `.tiles`
   linking to `./games/<slug>/` with a `.tile__art` icon. The icon should
   be pure CSS art (no images), following the pattern used by `.pac`,
   `.piano-keys`, and `.palette`. Add any new icon CSS to `/styles.css`.

8. **Register the files in the service worker**. Append every new URL to
   `PRECACHE_URLS` in `/sw.js`:
   ```js
   './games/<slug>/',
   './games/<slug>/index.html',
   './games/<slug>/<slug>.css',
   './games/<slug>/<slug>.js',
   // …plus any extra modules the game imports
   ```
   Include **both** the directory (`./games/<slug>/`) **and** the
   `index.html` inside it — clients may request either.

9. **Bump the cache version** in `/sw.js`:
   ```js
   const CACHE_VERSION = 'v11'; // was 'v10'
   ```
   This is the only way existing installs pick up your changes. **Bump it
   on every ship**, no exceptions.

10. **Commit to `main` and push.** No PR workflow — this repo commits
    directly. Keep commit messages in the style of existing history
    (short subject, optional body).

## Updating an existing game

Almost every change needs these two things, and it is easy to forget:

- **Bump `CACHE_VERSION` in `sw.js`.** If you don't, users on the PWA will
  keep seeing the old cached version until they reinstall. Treat it like
  a package version — always bump.
- **If you added new files**, append them to `PRECACHE_URLS` in `sw.js`.
  Removing files is safe without an explicit removal — the old cache is
  discarded on activate.

Beyond those: edit the game's files in-place. Don't add backwards-compat
shims for old `localStorage` shapes unless there's a reason to preserve
user state across breaking changes.

## Gotchas

- **`.gitignore` ignores `*.js` project-wide**, with a negation rule
  `!games/**/*.js` plus `!app.js` and `!sw.js`. New game JS under
  `games/<slug>/` is fine. JS files outside those paths will be silently
  ignored by `git add`.
- **iPad taps**: use `touchstart` + `mousedown`, not `pointerdown`.
  Mixing `pointerdown` with `touchstart` causes double-fires and
  unreliable taps on iOS Safari. See `games/piano-tiles/piano-tiles.js`
  for the pattern.
- **Canvas sizing**: scale by `devicePixelRatio` so things stay crisp on
  retina/HiDPI screens. See `games/pacman/pacman.js`.
- **iOS safe area**: `styles.css` applies `padding-top` and
  `padding-bottom` from `env(safe-area-inset-*)` to the body. Full-bleed
  games that override body padding need to handle this themselves.
- **No `user-scalable=no` pinch zoom tricks beyond what's in the viewport
  meta** — Safari ignores them on iPad in some modes. Don't fight it.
- **Tilt / device orientation**: iOS 13+ requires an explicit
  `DeviceOrientationEvent.requestPermission()` call triggered by a user
  gesture. See `games/pacman/input.js`.

## Checklist before committing a new game

- [ ] `games/<slug>/` contains `index.html`, `<slug>.css`, `<slug>.js`
- [ ] `node --check` passes on every new JS file
- [ ] Hub tile added to `/index.html` and tile art CSS added to
      `/styles.css`
- [ ] Every new URL is listed in `PRECACHE_URLS` in `/sw.js`
- [ ] `CACHE_VERSION` bumped in `/sw.js`
- [ ] Commit to `main`, push
