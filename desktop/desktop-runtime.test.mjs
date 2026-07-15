import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import {
  buildServerEnvironment,
  getPackagedServerRoot,
  getPiAgentDir,
  getServerUrl,
  getStandaloneServerPath,
} from "./desktop-runtime.mjs";

test("builds a localhost-only Next server environment", () => {
  const env = buildServerEnvironment({
    baseEnv: { EXISTING: "yes", HOSTNAME: "0.0.0.0" },
    piAgentDir: "C:\\Users\\me\\AppData\\Roaming\\Po Agent Web\\pi-agent",
    port: 53123,
  });

  assert.equal(env.EXISTING, "yes");
  assert.equal(env.NODE_ENV, "production");
  assert.equal(env.NEXT_TELEMETRY_DISABLED, "1");
  assert.equal(env.HOSTNAME, "127.0.0.1");
  assert.equal(env.PORT, "53123");
  assert.equal(
    env.PI_CODING_AGENT_DIR,
    "C:\\Users\\me\\AppData\\Roaming\\Po Agent Web\\pi-agent",
  );
});

test("passes the built-in skills directory to the server", () => {
  const env = buildServerEnvironment({
    baseEnv: {},
    builtinSkillsDir:
      "C:\\Program Files\\Po Agent Web\\resources\\builtin-skills",
    piAgentDir: "C:\\agent",
    port: 53123,
  });

  assert.equal(
    env.PO_AGENT_BUILTIN_SKILLS_DIR,
    "C:\\Program Files\\Po Agent Web\\resources\\builtin-skills",
  );
});

test("passes the official Skill Pack directory to the server", () => {
  const env = buildServerEnvironment({
    baseEnv: {},
    officialPacksDir:
      "C:\\Program Files\\Po Agent Web\\resources\\official-packs",
    piAgentDir: "C:\\agent",
    port: 53123,
  });

  assert.equal(
    env.PO_AGENT_OFFICIAL_PACKS_DIR,
    "C:\\Program Files\\Po Agent Web\\resources\\official-packs",
  );
});

test("resolves the Pi agent directory under Electron app data", () => {
  assert.equal(
    getPiAgentDir("C:\\Users\\me\\AppData\\Roaming\\Po Agent Web"),
    path.join("C:\\Users\\me\\AppData\\Roaming\\Po Agent Web", "pi-agent"),
  );
});

test("builds the desktop URL from localhost and the selected port", () => {
  assert.equal(getServerUrl(53123), "http://127.0.0.1:53123");
});

test("falls back to the OS app data shape outside Electron", () => {
  assert.match(getPiAgentDir(), new RegExp(`Po Agent Web\\${path.sep}pi-agent$`));
  assert.ok(getPiAgentDir().startsWith(os.homedir()));
});

test("uses the packaged standalone server when app root contains server.js", () => {
  const appRoot = mkdtempSync(path.join(os.tmpdir(), "po-agent-desktop-"));
  try {
    const serverPath = path.join(appRoot, "server.js");
    writeFileSync(serverPath, "");

    assert.equal(getStandaloneServerPath(appRoot), serverPath);
  } finally {
    rmSync(appRoot, { force: true, recursive: true });
  }
});

test("uses the development standalone server from the repository root", () => {
  assert.equal(
    getStandaloneServerPath("C:\\repo\\po-agent-web"),
    path.join("C:\\repo\\po-agent-web", ".next", "standalone", "server.js"),
  );
});

test("resolves the packaged server root under Electron resources", () => {
  assert.equal(
    getPackagedServerRoot("C:\\Program Files\\Po Agent Web\\resources"),
    path.join("C:\\Program Files\\Po Agent Web\\resources", "server"),
  );
});

test("desktop shell disables the default Electron menu bar", () => {
  const mainSource = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");

  assert.match(mainSource, /Menu\.setApplicationMenu\(null\)/);
  assert.match(mainSource, /autoHideMenuBar:\s*true/);
});

test("desktop shell uses the packaged app icon", () => {
  const mainSource = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");

  assert.match(mainSource, /appIconPath/);
  assert.match(mainSource, /icon:\s*appIconPath/);
});

test("desktop shell exposes only a directory picker bridge", () => {
  const mainSource = readFileSync(new URL("./main.mjs", import.meta.url), "utf8");
  const preloadSource = readFileSync(new URL("./preload.cjs", import.meta.url), "utf8");

  assert.match(mainSource, /preload\.cjs/);
  assert.match(mainSource, /ipcMain\.handle\("project:select-directory"/);
  assert.match(mainSource, /showOpenDialog/);
  assert.match(preloadSource, /selectProjectDirectory/);
  assert.match(preloadSource, /require\("electron"\)/);
});
