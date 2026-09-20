const { _electron } = require(process.env.CREWLO_PLAYWRIGHT || "playwright");
const { mkdirSync } = require("node:fs");
const { resolve } = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const app = await _electron.launch({
    executablePath: require("electron"),
    args: [resolve("tools/crewlo-capture-entry.cjs")],
    env: { ...process.env, ELECTRON_RENDERER_URL: "http://localhost:5173/" },
  });
  const page = await app.firstWindow();
  try {
    await page.waitForTimeout(2500);
    mkdirSync("docs/crewlo", { recursive: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.screenshot({ path: "docs/crewlo/after-onboarding.png" });
    const config = await page.evaluate(() => window.cth.getConfig());
    await app.evaluate(({ ipcMain }, config) => {
      ipcMain.removeHandler("config:get");
      ipcMain.handle("config:get", () => ({
        ...config,
        onboardingComplete: true,
        harnessHome: "",
        autoUpdate: false,
      }));
      // Fixture dispatch is intercepted: no provider or real work is invoked.
      ipcMain.removeHandler("hive:send");
      ipcMain.handle("hive:send", (_event, msg) => ({
        ok: true,
        message: msg,
      }));
      globalThis.__crewloFixture = { tasks: [] };
      ipcMain.removeHandler("hive:tasks");
      ipcMain.handle("hive:tasks", () => globalThis.__crewloFixture);
      ipcMain.removeHandler("hive:patchTask");
      ipcMain.handle("hive:patchTask", (_event, id, patch) => {
        const task = globalThis.__crewloFixture.tasks.find((t) => t.id === id);
        if (!task) return { ok: false };
        Object.assign(task, patch);
        return { ok: true };
      });
    }, config);
    await page.evaluate(() =>
      localStorage.setItem("cth.skipHivePickerOnce", "1"),
    );
    await page.reload();
    await page.waitForTimeout(2000);
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore.setState({ agents: [], selectedId: null, godStatus: "ready" });
    });
    await page.screenshot({ path: "docs/crewlo/after-empty.png" });
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      const agents = ["Rowan", "Sage", "Ellis"].map((name, i) => ({
        id: "fixture-" + i,
        name,
        character: ["michael", "jim", "pam"][i],
        accent: ["coral", "mint", "sky"][i],
        description: [
          "Studio coordinator",
          "Design partner",
          "Development partner",
        ][i],
        project: "Visual verification",
        tmuxTarget: "",
        cwd: "",
        status: "idle",
        action: "",
        progress: 0,
        isGod: i === 0,
      }));
      useStore.setState({
        agents,
        selectedId: agents[0].id,
        godStatus: "ready",
      });
      const label = document.createElement("div");
      label.id = "fixture-label";
      label.textContent = "VISUAL TEST FIXTURE · No agents running";
      label.style.cssText =
        "position:fixed;bottom:4px;right:12px;z-index:99999;padding:3px 8px;background:#fffcf5;color:#746e63;font:10px Inter;border:1px solid #ded4c4;border-radius:5px";
      document.body.append(label);
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: "docs/crewlo/after-desktop.png" });
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/crewlo/after-settings.png" });
    assert.match(
      await page.locator("body").innerText(),
      /Crewlo has no release feed/,
    );
    console.log(
      "PASS settings opens with Crewlo credits and disabled upstream updates",
    );
    await page.getByRole("button", { name: "close", exact: true }).click();
    // Pointer hit testing on an actual Pixi figurine, using its shared layout units.
    const canvas = await page.locator(".crewlo-canvas").boundingBox();
    const scale = Math.min(canvas.width / 1120, canvas.height / 670);
    await page.mouse.click(
      canvas.x + (canvas.width - 1120 * scale) / 2 + 642 * scale,
      canvas.y + (canvas.height - 670 * scale) / 2 + 310 * scale,
    );
    assert.equal(
      await page.evaluate(
        async () =>
          (await import("/src/store/store.ts")).useStore.getState().selectedId,
      ),
      "fixture-1",
    );
    console.log("PASS scene pointer selection");
    await app.evaluate(() => {
      globalThis.__crewloFixture.tasks = [
        {
          id: "fixture-result",
          title: "Fixture completed task",
          status: "done",
          assignee: "fixture-0",
          priority: 3,
          dependsOn: [],
          createdAt: new Date().toISOString(),
          result: "Fixture result body — visual verification only.",
        },
        {
          id: "fixture-approval",
          title: "Fixture input request",
          status: "blocked",
          assignee: "fixture-1",
          priority: 3,
          dependsOn: [],
          createdAt: new Date().toISOString(),
          humanQA: [{ q: "May this test continue?" }],
        },
      ];
    });
    await page
      .getByRole("button", { name: "Tasks & results", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        async () =>
          (await import("/src/store/store.ts")).useStore.getState().selectedId,
      ),
      "fixture-0",
    );
    console.log("PASS task navigation selects coordinator");
    await page
      .getByRole("button", { name: "Approvals & input", exact: true })
      .click();
    console.log("PASS approval navigation");
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      useStore.getState().updateAgent('fixture-0', { status: 'working' });
      useStore.getState().updateAgent('fixture-1', { status: 'blocked', blockReason: { summary: 'Fixture input request', detail: 'Visual verification only', actions: [{ label: 'Review', kind: 'neutral' }] } });
      useStore.getState().updateAgent('fixture-2', { status: 'success' });
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/crewlo/after-attention.png' });
    await page.evaluate(async () => {
      const { useStore } = await import('/src/store/store.ts');
      for (const a of useStore.getState().agents) useStore.getState().updateAgent(a.id, { status: 'idle', blockReason: undefined });
    });
    await page
      .getByPlaceholder(
        "Your answer — or 'done', with the result… (Ctrl+Enter to send)",
      )
      .fill("Continue this isolated test only.");
    await page
      .getByRole("button", { name: "respond & unblock", exact: true })
      .click();
    await page.waitForTimeout(300);
    assert.equal(
      await app.evaluate(
        () => globalThis.__crewloFixture.tasks[1].humanQA[0].a,
      ),
      "Continue this isolated test only.",
    );
    console.log(
      "PASS human-input response writes through original task patch IPC",
    );
    await page
      .getByRole("button", { name: "✓ Result: Fixture completed task ↗" })
      .waitFor();
    await page
      .getByRole("button", { name: "✓ Result: Fixture completed task ↗" })
      .click();
    await page.getByRole("region", { name: "Task result" }).waitFor();
    assert.match(
      await page.getByRole("region", { name: "Task result" }).innerText(),
      /Fixture result body/,
    );
    await page.screenshot({ path: "docs/crewlo/after-result.png" });
    await page.evaluate(async () =>
      (await import("/src/store/store.ts")).useStore
        .getState()
        .closeTaskDetail(),
    );
    console.log("PASS completed task opens actual ledger result");
    // Mission dispatch contract. Fake PTY id and intercepted send are fixture-only.
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore
        .getState()
        .updateAgent("fixture-0", { ptyId: "fixture-no-process" });
    });
    await page
      .getByLabel("What shall we make?")
      .fill("Visual test mission — do not execute");
    await page.getByRole("button", { name: "Start mission" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Sent to Rowan" })
      .waitFor();
    console.log("PASS mission dispatched through existing hive IPC");
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore.getState().updateAgent("fixture-0", { ptyId: undefined });
    });
    // Simulated failure must preserve the draft for a retry.
    await app.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler("hive:send");
      ipcMain.handle("hive:send", () => ({
        ok: false,
        error: "Fixture delivery failure",
      }));
    });
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore
        .getState()
        .updateAgent("fixture-0", { ptyId: "fixture-no-process" });
    });
    await page.getByLabel("What shall we make?").fill("Keep this draft");
    await page.getByRole("button", { name: "Start mission" }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Fixture delivery failure" })
      .waitFor();
    assert.equal(
      await page.getByLabel("What shall we make?").inputValue(),
      "Keep this draft",
    );
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      useStore.getState().updateAgent("fixture-0", { ptyId: undefined });
    });
    console.log("PASS failed mission preserves draft");
    // Keyboard alternative works without relying on the canvas accessibility tree.
    await page.locator(".crewlo-accessible-roster button").nth(2).focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.evaluate(
        async () =>
          (await import("/src/store/store.ts")).useStore.getState().selectedId,
      ),
      "fixture-2",
    );
    await app.evaluate(({ BrowserWindow }) => {
      const win = BrowserWindow.getAllWindows()[0];
      win.setMinimumSize(360, 480);
      win.setSize(760, 820);
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: "docs/crewlo/after-small.png" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    console.log("PASS 760px layout and keyboard selection");
    await page.locator(".crewlo-accessible-roster button").nth(1).focus();
    await page.keyboard.press("Enter");
    await page.locator(".crewlo-sidebar").scrollIntoViewIfNeeded();
    await page.screenshot({ path: "docs/crewlo/after-small-conversation.png" });
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].setSize(1440, 860),
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(async () => {
      const { useStore } = await import("/src/store/store.ts");
      const base = useStore.getState().agents;
      useStore.setState({
        agents: Array.from({ length: 14 }, (_, i) => ({
          ...base[i % 3],
          id: "many-" + i,
          name: "Agent " + (i + 1),
          isGod: i === 0,
        })),
        selectedId: "many-13",
      });
    });
    await page.waitForTimeout(500);
    assert.equal(
      await page.locator(".crewlo-accessible-roster button").count(),
      14,
    );
    await page.screenshot({ path: "docs/crewlo/after-many.png" });
    console.log("PASS all 14 agents represented; reduced motion render");
    assert.equal((await page.evaluate(() => window.cth.updateCheckNow())).ok, false);
    assert.match((await page.evaluate(() => window.cth.updateDownload())).error, /Crewlo has no release feed/);
    console.log('PASS upstream update IPC disabled');
    // Exercise native terminal access using a harmless local shell, not a provider.
    const terminal = await page.evaluate(() =>
      window.cth.spawnPty({
        id: "crewlo-smoke",
        cwd: ".",
        command: "cmd.exe",
        args: ["/d", "/k"],
        cols: 80,
        rows: 24,
      }),
    );
    console.log("NATIVE TERMINAL", terminal);
    if (terminal.ok) {
      await page.evaluate(async () => {
        const { useStore } = await import("/src/store/store.ts");
        const a = {
          ...useStore.getState().agents[0],
          id: "crewlo-smoke-agent",
          name: "Terminal check",
          ptyId: "crewlo-smoke",
          isGod: false,
        };
        useStore.setState({ agents: [a], selectedId: a.id });
        document.getElementById("fixture-label").textContent =
          "LOCAL TERMINAL CHECK · No AI provider running";
        await window.cth.writePty("crewlo-smoke", "echo CREWLO_TERMINAL_OK\r");
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "docs/crewlo/after-terminal.png" });
      await page.evaluate(() => window.cth.killPty("crewlo-smoke"));
    }
    assert.deepEqual(errors, []);
    console.log("ERRORS", errors);
  } finally {
    await app.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
