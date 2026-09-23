const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { toolActivity } = loadTs('src/shared/toolActivity.ts');
const { observeHook } = loadTs('src/renderer/src/scene/studio/voxelEvidence.ts');

test('activity comes from tool arguments without leaking contents or command secrets', () => {
  assert.equal(toolActivity('Write', { file_path: 'C:\\project\\index.html', content: 'SECRET' }), 'Writing index.html');
  assert.equal(toolActivity('apply_patch', '*** Begin Patch\n*** Add File: src/index.html\n+secret\n*** End Patch'), 'Creating index.html');
  assert.equal(toolActivity('mcp__playwright__browser_resize', { width: 375 }), 'Checking responsiveness');
  assert.equal(toolActivity('exec_command', { cmd: 'curl -H "Authorization: SECRET" https://example.com' }), 'Running a command');
  assert.equal(toolActivity('Bash', { command: 'npm run test' }), 'Running tests');
  assert.equal(toolActivity('unknown', { description: 'Creating imaginary.html' }), 'Using a tool');
});

test('completed tools and ended sessions clear current activity', () => {
  const started = observeHook(undefined, { event: 'PreToolUse', tool: 'Write', activity: 'Writing index.html' });
  assert.equal(started.activity, 'Writing index.html');
  for (const event of ['PostToolUse', 'PostToolUseFailure', 'Stop', 'SessionEnd', 'SessionStart', 'UserPromptSubmit']) {
    assert.equal(observeHook(started, { event }).activity, undefined, event);
  }
  assert.equal(observeHook(started, { event: 'Notification', message: 'permission required' }).activity, undefined);
});
