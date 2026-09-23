/* Public links only: no analytics, credentials, payment widgets, or API writes. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map();
  for (const card of document.querySelectorAll('.feature')) {
    const img = card.querySelector('[data-motion]');
    const button = card.querySelector('.motion-toggle');
    if (!img || !button) continue;
    const still = img.getAttribute('src');
    const setPlaying = playing => {
      img.src = playing ? img.dataset.motion : still;
      button.textContent = playing ? 'Pause animation' : 'Play animation';
      button.setAttribute('aria-pressed', String(playing));
    };
    animations.set(card, setPlaying);
    // Opt-in only: the landing page never starts a GIF or video automatically.
    button.addEventListener('click', () => setPlaying(button.getAttribute('aria-pressed') !== 'true'));
    reducedMotion.addEventListener('change', event => { if (event.matches) setPlaying(false); });
  }

  // Real tab semantics, including a single tab stop and standard arrow keys.
  // Nothing plays merely because a visitor selects a chapter.
  const chapters = ['observe', 'direct', 'connect'];
  const panels = Array.from(document.querySelectorAll('[data-demo-panel]'));
  const tabs = Array.from(document.querySelectorAll('[data-demo-step]')).filter(tab =>
    chapters.includes(tab.dataset.demoStep) && panels.some(panel => panel.dataset.demoPanel === tab.dataset.demoStep)
  );
  for (const tab of tabs) {
    const key = tab.dataset.demoStep;
    const panel = panels.find(item => item.dataset.demoPanel === key);
    tab.id ||= `demo-tab-${key}`;
    panel.id ||= `demo-panel-${key}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    // A focusable panel also works when its content contains no controls.
    if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
  }
  const tablist = tabs[0]?.closest('[role="tablist"]') ||
    (tabs.length && tabs.every(tab => tab.parentElement === tabs[0].parentElement) ? tabs[0].parentElement : null);
  if (tablist) {
    tablist.setAttribute('role', 'tablist');
    if (!tablist.hasAttribute('aria-label') && !tablist.hasAttribute('aria-labelledby')) tablist.setAttribute('aria-label', 'Explore the Crewlo demo');
  }
  const selectChapter = (key, focus = false) => {
    const selected = tabs.find(tab => tab.dataset.demoStep === key);
    if (!selected || selected.disabled || selected.getAttribute('aria-disabled') === 'true') return;
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = panels.find(item => item.dataset.demoPanel === tab.dataset.demoStep);
      panel.hidden = !active;
      if (!active) {
        for (const [card, pause] of animations) if (panel.contains(card)) pause(false);
        panel.querySelectorAll('video').forEach(video => video.pause());
      }
    }
    if (focus) selected.focus();
  };
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectChapter(tab.dataset.demoStep));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const available = tabs.filter(item => !item.disabled && item.getAttribute('aria-disabled') !== 'true');
      if (!available.length) return;
      event.preventDefault();
      let index = available.indexOf(tab);
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = available.length - 1;
      else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + available.length) % available.length;
      selectChapter(available[index].dataset.demoStep, true);
    });
  }
  if (tabs.length) selectChapter(tabs.find(tab => tab.dataset.demoStep === 'observe')?.dataset.demoStep || tabs[0].dataset.demoStep);

  const copyStatus = document.querySelector('#copy-status');
  if (copyStatus) {
    copyStatus.setAttribute('role', 'status');
    copyStatus.setAttribute('aria-live', 'polite');
    copyStatus.setAttribute('aria-atomic', 'true');
  }
  document.querySelectorAll('[data-copy-command]').forEach(button => {
    let copying = false;
    button.addEventListener('click', async () => {
      if (copying) return;
      const command = document.querySelector('#install-command')?.textContent?.trim();
      const report = message => { if (copyStatus) copyStatus.textContent = message; };
      report('');
      if (!command) { report('The install command is unavailable. Open the repository for setup instructions.'); return; }
      if (!navigator.clipboard?.writeText) { report('Copy is not available here. Select the command and copy it manually.'); return; }
      copying = true;
      button.setAttribute('aria-busy', 'true');
      try {
        // Copy only; never evaluate or run any command on the visitor's machine.
        await navigator.clipboard.writeText(command);
        report('Copied. Review the command before running it.');
      } catch { report('Could not copy. Select the command and copy it manually.'); }
      finally { copying = false; button.removeAttribute('aria-busy'); }
    });
  });

  document.querySelectorAll('[data-video-play]').forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault();
      const host = document.querySelector('#demo');
      const video = host?.matches('video') ? host : host?.querySelector('video');
      if (!video) return;
      const panel = video.closest('[data-demo-panel]');
      if (panel) selectChapter(panel.dataset.demoPanel);
      host.hidden = false;
      video.hidden = false;
      video.controls = true;
      for (let parent = video.parentElement; parent; parent = parent.parentElement) {
        if (parent.matches('details')) parent.open = true;
      }
      let status = document.querySelector('#video-status');
      if (!status) {
        status = document.createElement('p'); status.id = 'video-status';
        video.insertAdjacentElement('afterend', status);
      }
      status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      status.textContent = '';
      video.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
      // Playback follows this explicit user gesture, never page load/tab focus.
      try { await video.play(); }
      catch { status.textContent = 'Playback did not start. Use the video controls to try again.'; }
    });
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) document.querySelectorAll('video').forEach(video => video.pause());
  });

  document.querySelectorAll('[data-coffee]').forEach(link => link.addEventListener('click', event => {
    if (link.getAttribute('aria-disabled') === 'true') event.preventDefault();
  }));
  fetch('crewlo-links.json', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('No public link configuration');
    return response.json();
  }).then(config => {
    const valid = (value, host, pattern) => {
      if (typeof value !== 'string') return false;
      try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === host && !url.port && !url.username && !url.password && !url.search && !url.hash && pattern.test(url.pathname); }
      catch { return false; }
    };
    if (valid(config.repositoryUrl, 'github.com', /^\/[^/]+\/[^/]+\/?$/)) {
      document.querySelectorAll('[data-repository]').forEach(link => { link.href = config.repositoryUrl; });
    }
    if (valid(config.coffeeUrl, 'www.buymeacoffee.com', /^\/[A-Za-z0-9_-]+\/?$/) || valid(config.coffeeUrl, 'buymeacoffee.com', /^\/[A-Za-z0-9_-]+\/?$/)) {
      document.querySelectorAll('[data-coffee]').forEach(link => { link.href = config.coffeeUrl; link.removeAttribute('aria-disabled'); link.removeAttribute('tabindex'); });
      document.querySelector('#coffee-status').textContent = 'Opens the maintainer’s Buy Me a Coffee page. Supporting is optional.';
    }
  }).catch(() => { /* Keep the honest disabled fallback when offline/unconfigured. */ });
})();
