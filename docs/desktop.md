# Desktop Build

Po Agent Web can run as an Electron desktop shell around the existing Next.js
standalone server. The desktop shell does not add business logic. It starts a
local server, waits for it to respond, then loads `http://127.0.0.1:<port>` in
an Electron window.

## What Runs Locally

- The Electron main process launches the Next.js standalone server.
- The server listens only on `127.0.0.1` with a random available port.
- Desktop data is stored under Electron `userData`, with Pi Agent data in the
  `pi-agent` child directory.
- Model calls still use the user's configured API keys and external model
  providers.

## Commands

```bash
npm run desktop:dev
```

Builds the Next.js standalone output, copies required static assets into the
standalone directory, and opens the Electron shell.

```bash
npm run desktop:pack
```

Builds an unpacked desktop app under `.desktop-dist/`. On Windows, the app is
created at `.desktop-dist/win-unpacked/Po Agent Web.exe`.

```bash
npm run desktop:dist
```

Builds platform installer artifacts with `electron-builder`.

## Static Assets

Next.js standalone output does not copy `.next/static` by default. The desktop
scripts run:

```bash
npm run desktop:prepare
```

This copies `.next/static` to `.next/standalone/.next/static` and copies
`public` to `.next/standalone/public` when `public` exists. Without this step,
the app page can load while styles, chunks, fonts, or other static assets are
missing.

## Download Mirrors

If Electron or electron-builder downloads are slow, set mirrors before running
the packaging command in PowerShell:

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
npm run desktop:pack
```

## App Icon

The desktop app icon is generated from `src/app/favicon.ico` and stored as
`build/icon.png` for electron-builder. `build/icon.ico` is kept as the Windows
ICO source.

## Current Limits

- Windows and macOS signing are not configured yet.
- Automatic updates are not configured yet.
- Package size has not been optimized yet.

Run `npm run check` before handing off desktop changes.
