// The installer uses the same public destination as the app and website.
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

function supportInclude(value) {
  let destination;
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && ['buymeacoffee.com', 'www.buymeacoffee.com'].includes(url.hostname)
        && !url.username && !url.password && !url.port && !url.search && !url.hash
        && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)) destination = url.href;
    } catch { /* An unconfigured or invalid destination stays disabled. */ }
  }
  return '; Generated from docs/crewlo-links.json by build/prepare-support.cjs.\n'
    + (destination ? `!define CREWLO_COFFEE_URL "${destination}"\n` : '; No configured support profile. Keep the installer button disabled.\n');
}

function prepareSupport(context) {
  if (context && context.electronPlatformName !== 'win32') return;
  const config = JSON.parse(readFileSync(join(__dirname, '../docs/crewlo-links.json'), 'utf8'));
  writeFileSync(join(__dirname, 'crewlo-support.nsh'), supportInclude(config.coffeeUrl), 'utf8');
}
module.exports = prepareSupport;
module.exports.supportInclude = supportInclude;
if (require.main === module) prepareSupport();
