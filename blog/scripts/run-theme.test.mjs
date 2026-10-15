import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const blogDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const launcher = path.join(blogDir, "scripts", "run-theme.mjs");

test("rejects an invalid cleanup path without deleting files", () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "crewlo-launcher-"));
  const sentinel = path.join(tempDir, "sentinel.txt");

  try {
    writeFileSync(sentinel, "must survive");

    const result = spawnSync(
      process.execPath,
      [launcher, `--clean=${tempDir}`, "--theme=press"],
      { cwd: blogDir, encoding: "utf8" }
    );

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not an allowed preview directory/i);
    assert.equal(readFileSync(sentinel, "utf8"), "must survive");
    assert.doesNotMatch(result.stdout, /\[11ty\]/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("passes arguments and runs successfully", () => {
  const result = spawnSync(
    process.execPath,
    [
      launcher,
      "--theme=sunroom",
      "--preview=2",
      "--base=/testbase",
      "--out=/testout",
      "--help"
    ],
    { cwd: blogDir, encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /eleventy/i);
});

test("propagates non-zero child exit code", () => {
  const result = spawnSync(
    process.execPath,
    [launcher, "--invalid-flag-for-testing"],
    { cwd: blogDir, encoding: "utf8" }
  );

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown/i);
});
