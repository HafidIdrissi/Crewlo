// Keep a quick, portable smoke suite separate from the inherited full suite,
// whose known Windows baseline failures are documented in docs/crewlo/VERIFICATION.md.
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const tests = [
  'community-links',
  'crewlo-community',
  'crewlo-installer-brand',
  'crewlo-promo',
  'messaging-reply-recovery',
  'telegram-http',
  'telegram-messaging',
  'tool-activity',
  'whatsapp-service',
  'whatsapp-transport',
].map(name => join('test', `${name}.test.cjs`));

const result = spawnSync(process.execPath, ['--test', ...tests], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
});
if (result.error) console.error(result.error);
process.exitCode = result.status ?? 1;
