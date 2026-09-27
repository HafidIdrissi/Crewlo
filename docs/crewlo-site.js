/* Public links only: no analytics, credentials, payment widgets, or API writes. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smallScreen = window.matchMedia('(max-width: 760px)');
  const header = document.querySelector('.landing-header');
  const navigation = document.querySelector('#main-nav');
  const menuButton = document.querySelector('.nav-toggle');
  if (header && navigation && menuButton) {
    header.dataset.menuReady = 'true';
    const setMenu = (open, restoreFocus = false) => {
      menuButton.setAttribute('aria-expanded', String(open));
      navigation.hidden = smallScreen.matches && !open;
      if (restoreFocus) menuButton.focus();
    };
    const syncMenu = () => {
      const moveFocus = smallScreen.matches && navigation.contains(document.activeElement);
      menuButton.hidden = !smallScreen.matches;
      setMenu(false, moveFocus);
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open) navigation.querySelector('a')?.focus();
    });
    header.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        setMenu(false, true);
      }
    });
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) setMenu(false);
    });
    smallScreen.addEventListener('change', syncMenu);
    syncMenu();
    // Use the actual bar height, including text zoom, for every in-page anchor.
    const updateOffset = () => document.documentElement.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    new ResizeObserver(updateOffset).observe(header);
    updateOffset();
  }

  const integrations = [...document.querySelectorAll('[data-integration]')];
  const hashTarget = () => {
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return null; }
  };
  const syncIntegrations = () => {
    const requested = hashTarget()?.closest('[data-integration]') || document.activeElement?.closest('[data-integration]');
    for (const card of integrations) card.open = card.closest('[data-channel-panel]') ? card === requested : !smallScreen.matches || card === requested;
  };
  syncIntegrations();
  smallScreen.addEventListener('change', syncIntegrations);

  const animations = new Map();
  for (const card of document.querySelectorAll('.motion-frame')) {
    const img = card.querySelector('[data-motion]');
    const button = card.querySelector('.motion-toggle');
    if (!img || !button) continue;
    const still = img.dataset.still || img.getAttribute('src');
    const setPlaying = playing => {
      const source = playing ? img.dataset.motion : still;
      if (img.getAttribute('src') !== source) img.src = source;
      button.textContent = playing ? 'Pause animation' : 'Play animation';
      button.setAttribute('aria-pressed', String(playing));
      if (img.dataset.motionLabel) button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${img.dataset.motionLabel} animation`);
    };
    animations.set(card, setPlaying);
    button.hidden = false;
    setPlaying(img.getAttribute('src') === img.dataset.motion && !reducedMotion.matches && !card.closest('details:not([open])'));
    // Studio demos are opt-in; phone GIFs can be paused and respect reduced motion.
    button.addEventListener('click', () => setPlaying(button.getAttribute('aria-pressed') !== 'true'));
    reducedMotion.addEventListener('change', event => { if (event.matches) setPlaying(false); });
  }

  for (const card of integrations) {
    card.addEventListener('toggle', () => {
      if (smallScreen.matches && card.open) for (const other of integrations) if (other !== card) other.open = false;
    });
  }
  // Opening an explanation never starts media. Collapsing it stops hidden GIFs.
  document.querySelectorAll('details').forEach(card => card.addEventListener('toggle', () => {
    if (!card.open) {
      for (const [frame, setPlaying] of animations) if (card.contains(frame)) setPlaying(false);
      card.querySelectorAll('video').forEach(video => video.pause());
    }
  }));
  const revealHash = () => {
    const target = hashTarget();
    const card = target?.closest('[data-integration]');
    if (card) {
      if (smallScreen.matches) for (const other of integrations) other.open = other === card;
      card.open = true;
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
  };
  window.addEventListener('hashchange', revealHash);
  if (location.hash) requestAnimationFrame(revealHash);
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    const card = target.closest('[data-integration]');
    if (card) card.open = true;
    // Move the keyboard reading position out of a menu that has just closed.
    requestAnimationFrame(() => {
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      if (card) revealHash();
    });
  }));

  document.querySelectorAll('.copy-status, #copy-status').forEach(copyStatus => {
    copyStatus.setAttribute('role', 'status');
    copyStatus.setAttribute('aria-live', 'polite');
    copyStatus.setAttribute('aria-atomic', 'true');
  });
  document.querySelectorAll('[data-copy-command]').forEach(button => {
    let copying = false;
    button.addEventListener('click', async () => {
      if (copying) return;
      const command = document.getElementById(button.dataset.copyCommand || 'install-command')?.textContent?.trim();
      const copyStatus = button.closest('.terminal')?.querySelector('.copy-status, #copy-status');
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

  const evidenceVideos = [...document.querySelectorAll('video[controls]')];
  for (const video of evidenceVideos) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) video.pause();
    }).observe(video);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) evidenceVideos.forEach(video => video.pause());
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) evidenceVideos.forEach(video => video.pause());
  });

  const publicAssetRoot = new URL('.', document.currentScript?.src || location.href);
  fetch(new URL('crewlo-links.json', publicAssetRoot), { cache: 'no-cache' }).then(response => {
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
      const stars = [...document.querySelectorAll('[data-github-stars]')];
      if (stars.length) {
        const repoPath = new URL(config.repositoryUrl).pathname.replace(/\/$/, '');
        let refreshingStars = false;
        let lastStarRequest = 0;
        const refreshStars = () => {
          if (document.hidden || refreshingStars || Date.now() - lastStarRequest < 10000) return;
          refreshingStars = true;
          lastStarRequest = Date.now();
          fetch(`https://api.github.com/repos${repoPath}?crewlo_refresh=${lastStarRequest}`, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(6000) })
          .then(response => { if (!response.ok) throw new Error('GitHub count unavailable'); return response.json(); })
          .then(data => {
            if (!Number.isSafeInteger(data.stargazers_count) || data.stargazers_count < 0) return;
            for (const count of stars) {
              count.textContent = new Intl.NumberFormat('en-US').format(data.stargazers_count);
              count.hidden = false;
              count.closest('a').setAttribute('aria-label', `Star Crewlo on GitHub — ${data.stargazers_count} stars (opens in a new tab)`);
            }
          }).catch(() => { /* Keep the last known count and usable GitHub link. */ })
          .finally(() => { refreshingStars = false; });
        };
        // A star is only counted after GitHub confirms it, never on this click.
        document.querySelectorAll('.github-star').forEach(link => link.addEventListener('click', () => { lastStarRequest = 0; }));
        window.addEventListener('focus', refreshStars);
        window.addEventListener('pageshow', refreshStars);
        document.addEventListener('visibilitychange', refreshStars);
        setInterval(refreshStars, 300000);
        refreshStars();
      }
    }
    if (valid(config.coffeeUrl, 'www.buymeacoffee.com', /^\/[A-Za-z0-9_-]+\/?$/) || valid(config.coffeeUrl, 'buymeacoffee.com', /^\/[A-Za-z0-9_-]+\/?$/)) {
      for (const slot of document.querySelectorAll('[data-coffee-slot]')) {
        const button = slot.querySelector('button');
        if (!button) continue;
        const link = document.createElement('a');
        link.className = 'bmc-button';
        link.dataset.coffee = '';
        link.href = config.coffeeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Buy me a coffee — support Crewlo (opens in a new tab)');
        link.append(button.querySelector('img').cloneNode(true));
        button.replaceWith(link);
        slot.querySelector('[data-coffee-pending]')?.remove();
      }
    }
  }).catch(() => { /* Keep repository links and omit unconfigured support actions. */ });
})();
