// Isolated Electron inspection: no user configuration or workspace is modified.
const { app } = require("electron");
const { mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
app.setPath("userData", mkdtempSync(join(tmpdir(), "crewlo-inspect-")));
require("../out/main/index.js");
