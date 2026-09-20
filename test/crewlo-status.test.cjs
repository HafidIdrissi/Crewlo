const test = require("node:test");
const assert = require("node:assert/strict");
const loadTs = require("./load-ts.cjs");
const { studioStatus } = loadTs(
  "src/renderer/src/scene/studio/studioStatus.ts",
);
const { resolveActivity } = loadTs(
  "src/renderer/src/scene/studio/activityState.ts",
);

test("Crewlo never presents idle, unknown or waiting states as real work", () => {
  for (const status of ["idle", "waiting", "ghost", "unknown", "typing"]) {
    assert.equal(studioStatus({ status }).pose, "neutral");
    assert.notEqual(studioStatus({ status }).label, "Finished");
  }
});
test("Crewlo distinguishes input gates from blocked states and completed turns", () => {
  assert.equal(studioStatus({ status: "blocked" }).label, "Blocked");
  assert.equal(
    studioStatus({
      status: "blocked",
      blockReason: { actions: [{ label: "Approve", kind: "approve" }] },
    }).label,
    "Approval required",
  );
  assert.equal(studioStatus({ status: "blocked" }).pose, "attention");
  assert.equal(studioStatus({ status: "success" }).label, "Finished");
  assert.equal(
    studioStatus({ status: "working", onHold: true }).label,
    "On hold",
  );
});

test("the shared resolver keeps scene labels and card kinds aligned", () => {
  const editing = resolveActivity({ status: "working", action: "using Edit", queued: 1 });
  assert.deepEqual(editing, { kind: "working", label: "Editing files", working: true, attention: false });
  const queued = resolveActivity({ status: "idle", queued: 1 });
  assert.deepEqual(queued, { kind: "waiting", label: "Work queued", working: false, attention: false });
  const approval = resolveActivity({ status: "idle", blockReason: { actions: [{ kind: "approve" }] } });
  assert.equal(approval.label, "Approval required");
  assert.equal(studioStatus({ status: "idle", action: "", blockReason: undefined, queued: 1 }).label, queued.label);
});
