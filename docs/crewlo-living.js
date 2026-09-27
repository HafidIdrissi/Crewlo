/* Local, illustrated presentations. No agent execution or message delivery. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const presets = document.querySelector('[data-presets]');
  if (presets) {
    const choices = [...presets.querySelectorAll('[data-preset]')];
    const selectPreset = choice => {
      choices.forEach(item => item.setAttribute('aria-pressed', String(item === choice)));
      presets.querySelector('[data-preset-title]').textContent = choice.dataset.presetName;
      presets.querySelector('[data-preset-cli]').textContent = choice.dataset.presetCommand;
      presets.querySelector('[data-preset-guide]').textContent = `Configure ${choice.dataset.presetName} \u2197`;
    };
    choices.forEach(choice => {
      // Retain working configuration links when scripting is unavailable.
      choice.setAttribute('role', 'button');
      choice.setAttribute('aria-controls', 'preset-details');
      choice.addEventListener('click', event => {
        event.preventDefault();
        selectPreset(choice);
      });
      choice.addEventListener('keydown', event => {
        if (event.key === ' ') {
          event.preventDefault();
          choice.click();
        }
      });
    });
    selectPreset(choices[0]);
  }
  document.querySelectorAll('[data-sequence]').forEach(root => {
    const mission = root.dataset.sequence === 'mission';
    const starts = mission ? [0, 3000, 6000, 10000] : [0, 3000, 6000];
    const duration = mission ? 15000 : 9000;
    const frames = [...root.querySelectorAll('[data-frame]')];
    const steps = [...root.querySelectorAll('[data-phase-select]')];
    const play = root.querySelector('[data-sequence-play]');
    const status = root.querySelector('.sequence-state');
    const video = root.querySelector('video');
    let elapsed = 0, previous = 0, raf = 0, playing = false, visible = false;
    let userPaused = false;
    let currentPhase = -1;
    let interactiveMission = false;
    const sampleMission = root.querySelector('[data-sample-mission]');
    const sampleAgent = root.querySelector('[data-sample-agent]');
    const sendMission = root.querySelector('[data-send-mission]');
    const examples = {
      overview: { request: 'Summarize this project and its entry points.', activity: 'Reading README.md', working: 'Finding the entry points.', title: 'Three places to start.', points: [['Desktop app', 'src/main/index.ts'], ['Visual workspace', 'src/renderer/src/main.tsx'], ['Agent bridge', 'src/preload/index.ts']] },
      tests: { request: 'Find the tests and explain how to run them.', activity: 'Searching files', working: 'Finding the test commands.', title: 'Start with these checks.', points: [['Test files', 'test/'], ['Focused checks', 'npm run test:focused'], ['Crewlo checks', 'npm run test:crewlo']] },
      messaging: { request: 'Explain how a Telegram message reaches my agent.', activity: 'Reading telegramService.ts', working: 'Following the message.', title: 'One message, three steps.', points: [['Receive', 'Your paired Telegram bot'], ['Route', 'Your selected agent session'], ['Reply', 'A named response in Telegram']] },
    };
    root.dataset.ready = 'true';
    root.querySelector('.sequence-controls').hidden = false;
    steps.forEach((step, index) => {
      frames[index].id = `${root.dataset.sequence}-frame-${index}`;
      step.setAttribute('aria-controls', frames[index].id);
      step.setAttribute('aria-label', `Step ${index + 1}: ${step.querySelector('span').textContent}`);
    });

    const show = phase => {
      if (currentPhase === phase) return;
      currentPhase = phase;
      root.dataset.phase = String(phase);
      frames.forEach((frame, index) => { frame.hidden = index !== phase; });
      steps.forEach((step, index) => step.setAttribute('aria-pressed', String(index === phase)));
      const agentState = root.querySelector('[data-chat-agent]');
      if (agentState) agentState.textContent = ['Remy', 'Remy · Queued', 'Remy · Reply available'][phase];
    };
    const pause = (message = 'Paused · choose any step') => {
      playing = false;
      cancelAnimationFrame(raf);
      video?.pause();
      root.dataset.playing = 'false';
      play.setAttribute('aria-pressed', 'false');
      play.textContent = elapsed ? 'Continue' : `Play · ${duration / 1000} sec`;
      status.textContent = message;
    };
    const tick = now => {
      if (!playing) return;
      elapsed += now - previous;
      previous = now;
      if (elapsed >= duration) {
        if (mission && interactiveMission) {
          elapsed = duration;
          show(3);
          root.style.setProperty('--sequence-progress', 1);
          userPaused = true;
          pause('Reply ready · replay or choose another mission');
          play.textContent = 'Replay';
          sendMission.textContent = 'Replay mission ↗';
          return;
        }
        elapsed %= duration;
        if (video) video.currentTime = 0;
        video?.play().catch(() => {});
      }
      show(starts.findLastIndex(start => elapsed >= start));
      root.style.setProperty('--sequence-progress', elapsed / duration);
      if (mission) root.style.setProperty('--delivery-progress', Math.min(elapsed / 3000, 1));
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (playing || reduced.matches || document.hidden || !visible || userPaused) return;
      playing = true;
      root.dataset.playing = 'true';
      play.setAttribute('aria-pressed', 'true');
      play.textContent = 'Pause';
      status.textContent = mission && interactiveMission ? 'Playing sample mission · pause at any time' : 'Looping · pause at any time';
      show(starts.findLastIndex(start => elapsed >= start));
      if (video) {
        video.currentTime = elapsed / 1000;
        // The poster and text sequence remain usable if media is unavailable.
        video.play().catch(() => {});
      }
      previous = performance.now();
      raf = requestAnimationFrame(tick);
    };
    play.addEventListener('click', () => {
      if (mission && elapsed >= duration) elapsed = 0;
      userPaused = playing;
      if (playing) pause();
      else start();
    });
    root.querySelector('[data-hero-agent]')?.addEventListener('click', () => steps.at(-1).click());
    if (mission) {
      root.querySelector('.mission-picker').hidden = false;
      const updateExample = () => {
        const example = examples[sampleMission.value];
        const name = sampleAgent.selectedOptions[0].textContent;
        root.dataset.agent = sampleAgent.value;
        frames[0].querySelector('.mission-request').textContent = `“${example.request}”`;
        frames[0].querySelector('.hero-message-footer').textContent = `To ${name} ↗`;
        frames[1].querySelector('.sequence-number').textContent = `02 / DELIVERED TO ${name.toUpperCase()}`;
        frames[1].querySelector('.activity-cue').textContent = `${name} · Working`;
        frames[2].querySelector('h2').textContent = example.working;
        frames[2].querySelector('.activity-cue').textContent = example.activity;
        frames[3].querySelector('.sequence-number').textContent = `04 / ${name.toUpperCase()}'S REPLY`;
        frames[3].querySelector('h2').textContent = example.title;
        frames[3].querySelector('.result-points').replaceChildren(...example.points.map(([title, detail]) => {
          const item = document.createElement('li');
          const label = document.createElement('strong'); label.textContent = title;
          const value = document.createElement('code'); value.textContent = detail;
          item.append(label, value); return item;
        }));
        const agent = root.querySelector('[data-hero-agent]');
        agent.textContent = `${name} ↗`;
        agent.setAttribute('aria-label', `See ${name}'s illustrated reply`);
        root.querySelector('[data-parcel-label]').textContent = `For ${name}`;
      };
      const resetExample = () => {
        interactiveMission = true;
        userPaused = true;
        elapsed = 0;
        pause('Mission selected · send it into the studio');
        root.style.setProperty('--sequence-progress', 0);
        root.style.setProperty('--delivery-progress', 0);
        sendMission.textContent = 'Send mission ↗';
        if (video?.readyState > 0) video.currentTime = 0;
        updateExample();
        show(0);
      };
      sampleMission.addEventListener('change', resetExample);
      sampleAgent.addEventListener('change', resetExample);
      sendMission.addEventListener('click', () => {
        resetExample();
        if (reduced.matches) {
          show(3);
          status.textContent = 'Illustrated reply · reduced motion';
          sendMission.textContent = 'Replay mission ↗';
        } else {
          userPaused = false;
          start();
          status.textContent = 'Mission on its way · illustrated demo';
        }
      });
      updateExample();
    }
    steps.forEach((step, index) => step.addEventListener('click', () => {
      userPaused = true;
      elapsed = starts[index];
      root.style.setProperty('--sequence-progress', elapsed / duration);
      if (mission) root.style.setProperty('--delivery-progress', Math.min(elapsed / 3000, 1));
      pause(`Step ${index + 1} of ${starts.length} · selected`);
      show(index);
      if (video && video.readyState > 0) video.currentTime = elapsed / 1000;
    }));
    const syncMotion = () => {
      if (reduced.matches) {
        pause('Reduced motion · choose a step');
        // Static overview, even after the preference changes mid-playback.
        if (video?.readyState > 0) video.currentTime = 0;
      }
      play.disabled = reduced.matches;
      if (!reduced.matches && !playing) status.textContent = 'Choose a step or play';
      if (!reduced.matches) start();
    };
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
      if (!visible && playing) pause('Paused · outside the viewport');
      if (visible) start();
    }, { threshold: .15 }).observe(root);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && playing) pause('Paused · tab hidden');
      if (!document.hidden) start();
    });
    root.addEventListener('focusin', event => {
      if (playing && event.target !== play) {
        userPaused = true;
        pause();
      }
    });
    reduced.addEventListener('change', syncMotion);
    root.addEventListener('crewlo:panelhidden', () => {
      visible = false;
      pause('Paused · channel hidden');
    });
    show(0);
    syncMotion();
  });

  const channelTabs = document.querySelector('[data-channel-tabs]');
  if (channelTabs) {
    const tabs = [...channelTabs.querySelectorAll('[data-channel-tab]')];
    const panels = [...document.querySelectorAll('[data-channel-panel]')];
    const chooseChannel = (channel, focus = false) => {
      tabs.forEach(tab => {
        const active = tab.dataset.channelTab === channel;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.channelPanel !== channel;
        if (panel.hidden) panel.querySelector('[data-sequence]')?.dispatchEvent(new Event('crewlo:panelhidden'));
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => chooseChannel(tab.dataset.channelTab));
      tab.addEventListener('keydown', event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
          : event.key === 'ArrowRight' ? (index + 1) % tabs.length
          : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1;
        if (next < 0) return;
        event.preventDefault();
        chooseChannel(tabs[next].dataset.channelTab, true);
      });
    });
    panels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `${panel.dataset.channelPanel}-tab`);
      panel.tabIndex = 0;
    });
    const revealChannel = () => {
      let target;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
      const panel = target?.closest('[data-channel-panel]');
      if (panel) {
        chooseChannel(panel.dataset.channelPanel);
        requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
      }
    };
    channelTabs.hidden = false;
    chooseChannel('telegram');
    revealChannel();
    window.addEventListener('hashchange', revealChannel);
  }

  const crew = document.querySelector('[data-crew]');
  if (!crew) return;
  const workspaceVideo = crew.querySelector('[data-workspace-video]');
  const workspacePlay = crew.querySelector('[data-workspace-play]');
  let workspaceVisible = false, workspacePaused = false;
  const syncWorkspace = () => {
    const shouldPlay = workspaceVisible && !workspacePaused && !document.hidden && !reduced.matches;
    workspacePlay.disabled = reduced.matches;
    workspacePlay.textContent = reduced.matches ? 'Still studio' : shouldPlay ? 'Pause studio' : 'Play studio';
    workspacePlay.setAttribute('aria-pressed', String(shouldPlay));
    if (shouldPlay) workspaceVideo.play().catch(() => {
      workspacePlay.textContent = 'Play studio';
      workspacePlay.setAttribute('aria-pressed', 'false');
    });
    else workspaceVideo.pause();
  };
  workspacePlay.hidden = false;
  workspacePlay.addEventListener('click', () => {
    workspacePaused = !workspaceVideo.paused;
    syncWorkspace();
  });
  new IntersectionObserver(entries => {
    workspaceVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
    syncWorkspace();
  }, { threshold: .15 }).observe(workspaceVideo);
  document.addEventListener('visibilitychange', syncWorkspace);
  reduced.addEventListener('change', syncWorkspace);
  const profiles = {
    remy: { name: 'Remy', activity: 'Reading README.md · Project overview', reply: '“Start with the main process, the renderer and the preload bridge.”' },
    ellis: { name: 'Ellis', activity: 'Idle · Ready for the next mission', reply: '“The interface lives in the renderer. Start there to explore the studio.”' },
    sam: { name: 'Sam', activity: 'Idle · Coffee break', reply: '“My last task is wrapped up. Ready when you need me.”' },
    nina: { name: 'Nina', activity: 'Idle · Taking a break on the terrace', reply: '“You can find my last notes in our conversation.”' },
  };
  let selected = 'remy';
  const next = crew.querySelector('[data-next-agent]');
  const select = key => {
    selected = key;
    crew.dataset.selected = key;
    const profile = profiles[key];
    crew.querySelectorAll('[data-agent]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.agent === key)));
    crew.querySelector('[data-agent-name]').textContent = profile.name;
    crew.querySelector('[data-agent-activity]').textContent = profile.activity;
    crew.querySelector('[data-agent-reply]').textContent = profile.reply;
    const order = Object.keys(profiles);
    next.textContent = `Meet ${profiles[order[(order.indexOf(key) + 1) % order.length]].name} →`;
  };
  crew.querySelectorAll('[data-agent]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => select(button.dataset.agent));
  });
  crew.querySelector('.agent-cards').hidden = false;
  next.hidden = false;
  next.addEventListener('click', () => {
    const order = Object.keys(profiles);
    select(order[(order.indexOf(selected) + 1) % order.length]);
  });
  select(selected);
})();
