// Node 20 on Windows does not expand test/*.test.cjs itself.
const { readdirSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const tests = readdirSync(join(__dirname, "..", "test"))
  .filter((f) => f.endsWith(".test.cjs"))
  .map((f) => join("test", f));
const result = spawnSync(process.execPath, ["--test", ...tests], {
  cwd: join(__dirname, ".."),
  stdio: "inherit",
});
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
