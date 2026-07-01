# Pi-Native Workspace Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated interactive HTML demo that lets the user evaluate the approved Pi-native Po Agent Web visual direction before production UI work begins.

**Architecture:** Create one standalone HTML file under `.superpowers/demos/` with embedded CSS and minimal JavaScript for light/dark and Chinese/English switching. Add one Node standard-library contract test that verifies the demo contains the approved shell, semantic theme tokens, grid canvas, opaque reading surfaces, pixel Po mark, Composer, and both theme controls. Do not import application code, add dependencies, or change production routes.

**Tech Stack:** HTML5, CSS custom properties, inline SVG, vanilla JavaScript, Node.js built-in test runner.

---

### Task 1: Add the Demo Contract Test

**Files:**
- Create: `.superpowers/demos/pi-native-workspace-demo.test.mjs`
- Test: `.superpowers/demos/pi-native-workspace-demo.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

const demoUrl = new URL("./pi-native-workspace-demo.html", import.meta.url);

test("contains the approved Pi-native workspace visual contract", async () => {
  const html = await readFile(demoUrl, "utf8");

  for (const required of [
    "--canvas: #ebe7e4",
    "--canvas: #161d27",
    'class="workspace"',
    'class="sidebar"',
    'class="topbar"',
    'class="canvas-grid"',
    'class="reading-surface welcome"',
    'class="file-panel"',
    'class="composer"',
    'aria-label="Po Agent Web"',
    'data-action="theme"',
    'data-action="locale"',
  ]) {
    assert.ok(html.includes(required), `missing ${required}`);
  }

  assert.ok(!html.includes("backdrop-filter"));
  assert.ok(!html.includes("border-radius: 999px"));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --test .superpowers/demos/pi-native-workspace-demo.test.mjs
```

Expected: FAIL with `ENOENT` because `pi-native-workspace-demo.html` does not exist.

- [ ] **Step 3: Commit the failing contract test**

```powershell
git add -f .superpowers/demos/pi-native-workspace-demo.test.mjs
git commit -m "test: define Pi-native workspace demo contract"
```

### Task 2: Build the Standalone Visual Demo

**Files:**
- Create: `.superpowers/demos/pi-native-workspace-demo.html`
- Test: `.superpowers/demos/pi-native-workspace-demo.test.mjs`

- [ ] **Step 1: Create the complete standalone demo**

Create `.superpowers/demos/pi-native-workspace-demo.html` with this structure and behavior:

```html
<!doctype html>
<html lang="zh" data-theme="light">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Po Agent Web · Pi-native workspace demo</title>
    <style>
      :root {
        color-scheme: light;
        --deep: #dacbc2;
        --canvas: #ebe7e4;
        --panel: #f4f2f0;
        --soft: #eef1f3;
        --text: #252f3d;
        --muted: #5c5752;
        --accent: #4b607c;
        --line: rgb(92 87 82 / 28%);
        --line-strong: rgb(92 87 82 / 48%);
        --selected: rgb(75 96 124 / 12%);
        --grid-minor: rgb(37 47 61 / 3%);
        --grid-major: rgb(37 47 61 / 7%);
        --grid-cross: rgb(37 47 61 / 11%);
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --deep: #0d1116;
        --canvas: #161d27;
        --panel: #212730;
        --soft: #252f3d;
        --text: #ebe7e4;
        --muted: #9fa4ab;
        --accent: #6a9fcc;
        --line: rgb(117 125 137 / 28%);
        --line-strong: rgb(117 125 137 / 48%);
        --selected: rgb(106 159 204 / 13%);
        --grid-minor: rgb(128 163 204 / 1%);
        --grid-major: rgb(128 163 204 / 3%);
        --grid-cross: rgb(128 163 204 / 7%);
      }

      * { box-sizing: border-box; }
      html, body { min-width: 1024px; height: 100%; margin: 0; }
      body {
        overflow: hidden;
        background: var(--deep);
        color: var(--text);
        font: 14px/1.5 Inter, "Segoe UI", "PingFang SC", sans-serif;
      }
      button, textarea { color: inherit; font: inherit; }
      button { cursor: pointer; }
      button:focus-visible, textarea:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      [data-en] { display: none; }
      html[lang="en"] [data-zh] { display: none; }
      html[lang="en"] [data-en] { display: inline; }

      .workspace {
        display: grid;
        grid-template-columns: 260px minmax(520px, 1fr) 300px;
        height: 100vh;
        border: 1px solid var(--line-strong);
        background: var(--canvas);
      }
      .sidebar, .file-panel {
        min-width: 0;
        background: var(--panel);
      }
      .sidebar { border-right: 1px solid var(--line-strong); }
      .file-panel { border-left: 1px solid var(--line-strong); }
      .sidebar, .file-panel, .main { display: flex; flex-direction: column; }

      .brand, .topbar, .panel-title, .composer-tools {
        display: flex;
        align-items: center;
      }
      .brand { height: 52px; gap: 10px; padding: 0 12px; border-bottom: 1px solid var(--line); }
      .po-mark { width: 26px; height: 26px; color: var(--text); flex: none; }
      .brand-name { font: 600 12px/1 Consolas, monospace; letter-spacing: .08em; }
      .nav { padding: 8px; }
      .nav-button, .session, .icon-button {
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
      }
      .nav-button { width: 100%; padding: 7px 8px; text-align: left; }
      .nav-button:hover, .session:hover, .icon-button:hover { background: var(--soft); }
      .nav-button.active, .session.active { border-color: var(--line); background: var(--selected); }
      .section-label, .meta, .path, .composer-tools {
        color: var(--muted);
        font: 600 10px/1.4 Consolas, monospace;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .section-label { margin: 14px 8px 6px; }
      .session { display: block; width: 100%; padding: 7px 8px; text-align: left; }
      .session small { display: block; margin-top: 2px; color: var(--muted); }
      .sidebar-footer { display: flex; gap: 4px; margin-top: auto; padding: 8px; border-top: 1px solid var(--line); }
      .icon-button { min-width: 32px; height: 30px; padding: 0 8px; font: 600 11px Consolas, monospace; }

      .topbar { height: 40px; flex: none; border-bottom: 1px solid var(--line-strong); background: var(--panel); }
      .topbar .icon-button { height: 40px; border-radius: 0; border-right-color: var(--line); }
      .topbar-title { min-width: 0; flex: 1; padding: 0 12px; font-size: 12px; font-weight: 600; }
      .path { padding-right: 12px; text-transform: none; letter-spacing: 0; }

      .canvas-grid {
        position: relative;
        display: grid;
        min-height: 0;
        flex: 1;
        place-items: center;
        padding: 34px;
        background-color: var(--canvas);
        background-image:
          linear-gradient(var(--grid-minor) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-minor) 1px, transparent 1px),
          linear-gradient(var(--grid-major) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-major) 1px, transparent 1px);
        background-size: 8px 8px, 8px 8px, 40px 40px, 40px 40px;
      }
      .reading-surface { width: min(720px, 100%); background: var(--panel); border: 1px solid var(--line-strong); }
      .welcome { padding: 42px 46px 30px; text-align: center; }
      .welcome .po-mark { width: 48px; height: 48px; margin: 0 auto 22px; }
      h1 { margin: 0; font: italic 500 clamp(34px, 4vw, 52px)/1.08 Georgia, "Noto Serif SC", serif; letter-spacing: -.035em; }
      h1 em { color: var(--accent); font-weight: inherit; }
      .lede { max-width: 540px; margin: 18px auto 28px; color: var(--muted); font-size: 15px; }

      .composer { border: 1px solid var(--line-strong); border-radius: 4px; background: var(--soft); text-align: left; }
      .composer textarea { display: block; width: 100%; min-height: 88px; resize: none; border: 0; outline: 0; padding: 14px; background: transparent; }
      .composer-tools { gap: 10px; min-height: 36px; padding: 5px 7px 5px 12px; border-top: 1px solid var(--line); text-transform: none; letter-spacing: 0; }
      .composer-tools .send { margin-left: auto; border: 1px solid var(--accent); border-radius: 4px; background: var(--accent); color: var(--panel); padding: 6px 10px; }

      .panel-title { height: 40px; justify-content: space-between; padding: 0 10px; border-bottom: 1px solid var(--line); font: 600 10px Consolas, monospace; letter-spacing: .1em; }
      .file-tree { padding: 8px; border-bottom: 1px solid var(--line); }
      .tree-row { padding: 5px 7px; font: 12px Consolas, monospace; }
      .tree-row.active { background: var(--selected); color: var(--accent); }
      .code { min-height: 0; flex: 1; margin: 0; padding: 14px; overflow: auto; background: var(--soft); color: var(--muted); font: 12px/1.7 Consolas, monospace; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { transition-duration: .01ms !important; }
      }
    </style>
  </head>
  <body>
    <div class="workspace">
      <aside class="sidebar">
        <div class="brand">
          <svg class="po-mark" aria-label="Po Agent Web" viewBox="0 0 8 8" role="img">
            <path fill="currentColor" d="M0 0h4v1H1v2h3v1H1v4H0zm4 4h4v4H4zm1 1v2h2V5z" />
          </svg>
          <span class="brand-name">PO AGENT WEB</span>
        </div>
        <nav class="nav">
          <button class="nav-button active"><span data-zh>＋ 新对话</span><span data-en>＋ New chat</span></button>
          <button class="nav-button"><span data-zh>模型提供商</span><span data-en>Model providers</span></button>
          <button class="nav-button"><span data-zh>技能</span><span data-en>Skills</span></button>
          <div class="section-label"><span data-zh>项目</span><span data-en>Projects</span></div>
          <button class="session active">po-agent-web<small>3 sessions</small></button>
          <button class="session">pi-agent<small>7 sessions</small></button>
          <div class="section-label"><span data-zh>最近会话</span><span data-en>Recent sessions</span></div>
          <button class="session"><span data-zh>重构工作台视觉系统</span><span data-en>Refactor workspace visuals</span><small>2 min ago</small></button>
          <button class="session"><span data-zh>检查聊天执行过程</span><span data-en>Review chat execution</span><small>Yesterday</small></button>
        </nav>
        <div class="sidebar-footer">
          <button class="icon-button" data-action="theme" aria-label="Toggle theme">◐</button>
          <button class="icon-button" data-action="locale" aria-label="Toggle locale">中 / EN</button>
        </div>
      </aside>

      <main class="main">
        <header class="topbar">
          <button class="icon-button" aria-label="Toggle sidebar">☰</button>
          <div class="topbar-title"><span data-zh>新对话</span><span data-en>New chat</span></div>
          <span class="path">po-agent-web · main</span>
        </header>
        <section class="canvas-grid">
          <div class="reading-surface welcome">
            <svg class="po-mark" aria-label="Po Agent Web" viewBox="0 0 8 8" role="img">
              <path fill="currentColor" d="M0 0h4v1H1v2h3v1H1v4H0zm4 4h4v4H4zm1 1v2h2V5z" />
            </svg>
            <h1><span data-zh>让 Agent 适应<em>你的工作流</em></span><span data-en>Make the agent fit <em>your workflow</em></span></h1>
            <p class="lede"><span data-zh>在一个安静、可控的工作台中检查项目、完成修改并验证结果。</span><span data-en>Inspect projects, make changes, and verify results in one calm, controlled workspace.</span></p>
            <div class="composer">
              <textarea aria-label="Message" placeholder="描述你希望完成的工作…"></textarea>
              <div class="composer-tools"><span>GPT-5 · MEDIUM</span><span>⌘ ENTER</span><button class="send" aria-label="Send">↵</button></div>
            </div>
          </div>
        </section>
      </main>

      <aside class="file-panel">
        <div class="panel-title"><span>FILES</span><span>×</span></div>
        <div class="file-tree">
          <div class="tree-row">▾ src</div>
          <div class="tree-row">&nbsp;&nbsp;▾ features</div>
          <div class="tree-row active">&nbsp;&nbsp;&nbsp;&nbsp;chat-center.tsx</div>
          <div class="tree-row">&nbsp;&nbsp;app</div>
          <div class="tree-row">DESIGN.md</div>
        </div>
        <pre class="code"><code>export function ChatCenter() {
  return (
    &lt;main className="workspace"&gt;
      &lt;Welcome /&gt;
      &lt;ChatInput /&gt;
    &lt;/main&gt;
  );
}</code></pre>
      </aside>
    </div>
    <script>
      document.querySelector('[data-action="theme"]').addEventListener("click", () => {
        const root = document.documentElement;
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      });
      document.querySelector('[data-action="locale"]').addEventListener("click", () => {
        const root = document.documentElement;
        root.lang = root.lang === "zh" ? "en" : "zh";
      });
    </script>
  </body>
</html>
```

- [ ] **Step 2: Run the contract test**

Run:

```powershell
node --test .superpowers/demos/pi-native-workspace-demo.test.mjs
```

Expected: one passing test and zero failures.

- [ ] **Step 3: Commit the demo**

```powershell
git add -f .superpowers/demos/pi-native-workspace-demo.html
git commit -m "feat: add Pi-native workspace visual demo"
```

### Task 3: Validate and Hand Off the Demo

**Files:**
- Verify: `.superpowers/demos/pi-native-workspace-demo.html`
- Verify: `.superpowers/demos/pi-native-workspace-demo.test.mjs`

- [ ] **Step 1: Run the focused contract test again**

Run:

```powershell
node --test .superpowers/demos/pi-native-workspace-demo.test.mjs
```

Expected: one passing test and zero failures.

- [ ] **Step 2: Confirm the production workspace is untouched**

Run:

```powershell
git status --short
```

Expected: no demo implementation changes under `src/`; pre-existing user changes remain unchanged.

- [ ] **Step 3: Open the standalone demo**

Open this local file in a desktop browser:

```text
C:\Users\weilianglei\Desktop\po-agent-web\.superpowers\demos\pi-native-workspace-demo.html
```

Verify that theme and locale controls work, all three workspace columns are visible at `1024px` and above, grid lines stay outside the opaque reading surface, and no content overlaps.
