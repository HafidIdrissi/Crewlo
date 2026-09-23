// Test-only dependency injection bridge in an isolated Electron profile.
globalThis.tgRequire = require;
require('./crewlo-capture-entry.cjs');
