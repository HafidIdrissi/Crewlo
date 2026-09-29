---
title: "Crewlo: building a voxel workspace around coding agents"
published: false
tags: opensource, ai, agents, showdev
description: "Inside Crewlo's voxel workspace for coding agents: mission flow, execution events, Telegram messaging and experimental WhatsApp support."
---

Running several coding agents creates an interface problem: where did a request go, what is the agent doing, and where is its reply?

I'm developing **Crewlo**, an open-source desktop workspace that puts those interactions in a voxel studio. You send a mission, follow activity, and open an agent's conversation or terminal to inspect the result.

Crewlo is an independently maintained fork of [Munder Difflin](https://github.com/chaitanyagiri/munder-difflin), by Chaitanya Giri and contributors. It retains the upstream agent-engine foundation. My work focuses on the procedural voxel studio, the mission interface, activity labels and Telegram/WhatsApp transports.

![Illustrated Crewlo studio with voxel characters and a reply panel; not a live agent recording](https://raw.githubusercontent.com/HafidIdrissi/Crewlo/main/docs/crewlo/demo/readme-studio-poster.png)

*Illustrated interface demo. The scene above is not evidence of a live AI task.*

## Keep the scene connected to the work

The inherited stack includes Electron, React, PixiJS and xterm.js. Crewlo adds its studio to that foundation rather than replacing the provider sessions and orchestration engine.

The agent roster and execution events remain the source of operational state. Where execution hooks are available, activity labels reflect those events. Selecting a character opens the conversation or terminal so the user can inspect what actually happened.

That distinction matters. A moving character cannot establish that code was changed correctly. A reply must still be read, and a task's result must still be checked. Crewlo's workshop, terrace and break room are visual zones, not independent autonomous teams.

Cosmetic breaks are reserved for confirmed idle agents. They are rendered locally and do not require model prompts. Unknown or blocked states should not be disguised as an agent enjoying a break.

## Make the mission and its reply easy to find

The mission composer is the starting point. Conversations and terminals sit alongside tasks, results and requests for approval or input.

Message delivery has an explicit paused state and a Resume control. The interface needs to make this visible: an unanswered request may be waiting for user action rather than running in the background.

Crewlo includes presets for Claude Code, Codex, Gemini CLI and other providers. A preset is configuration, not proof that every provider supports every coordination or messaging feature. Users supply their own authenticated CLI, with the provider's usual permissions, usage limits and costs.

## Telegram and WhatsApp reuse existing sessions

The phone integrations route messages to connected agents through the existing queues and delivery controls. They do not create a separate remote permission system.

**Telegram** uses the Bot API. A basic real request and named agent reply have been verified in Telegram Web. This does not establish every agent, reconnection or physical-phone scenario.

**WhatsApp is experimental.** It uses Meta Cloud API and signed webhooks, and requires the appropriate Meta setup plus an HTTPS callback forwarded to the local receiver. Full live end-to-end acceptance testing remains open.

Both channels use pairing and desktop confirmation. Crewlo must remain open and the computer must stay awake. They do not remotely approve tools or resume paused delivery.

Workspace state is stored locally, but the app is not inherently offline: connected cloud models and messaging services receive the data required for their work. Messaging credentials use an OS-encrypted vault; that does not mean the conversation history is encrypted by these features.

## What has actually been checked

One concrete Windows integration check used a real Codex session in the packaged app: Codex read a temporary file and returned its exact marker through Crewlo's IPC and terminal path. This verifies a narrow connection, not a complete autonomous development workflow.

Windows and macOS preview packages are available. The Windows installer is unsigned, and the Mac builds are not notarized. Packaging checks and a successful local run do not replace testing on other people's machines. Linux runtime validation remains open.

The [README](https://github.com/HafidIdrissi/Crewlo#current-status) separates verified scope from remaining limits. The website's sample missions and gallery animations are illustrated demonstrations, so they should not be mistaken for live execution recordings.

## Try the preview

- [Source, Windows/macOS previews and setup instructions](https://github.com/HafidIdrissi/Crewlo)
- [Interactive illustrated studio](https://hafididrissi.github.io/Crewlo/)
- [Report a reproducible issue](https://github.com/HafidIdrissi/Crewlo/issues)

For installation reports, the OS, app version, provider CLI and reproduction steps are especially useful. Please remove credentials and private project data from logs before sharing them.

The original MIT copyright notices remain preserved; bundled third-party assets retain their own licenses. Crewlo's attribution and engineering notes are linked from the repository.

If you run several coding agents, which information do you need immediately: progress, a request for your input, or the evidence behind a completed result?

*Writing disclosure: this article was drafted with AI assistance from Crewlo's repository documentation and validation notes.*
