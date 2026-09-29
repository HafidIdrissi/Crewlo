# Product Hunt — draft, not published

Name: Crewlo

Tagline: Your coding agents, together in a living voxel studio

Website: https://hafididrissi.github.io/Crewlo/

Source: https://github.com/HafidIdrissi/Crewlo

Tags: Developer Tools, Artificial Intelligence, Open Source

Description:

Bring your coding agents into a voxel desktop studio. Send missions, follow activity, and find conversations, terminals and replies in one workspace. Includes Telegram messaging and experimental WhatsApp support. Open source, built on Munder Difflin. Early Windows and macOS previews; bring your own agent CLI and provider account.

First comment:

Hi Product Hunt, I'm Hafid, the maintainer of Crewlo.

Crewlo is an independently maintained fork of Munder Difflin by Chaitanya Giri and contributors. My work focuses on the voxel studio, the mission interface, execution-event activity labels and Telegram/WhatsApp transports.

The workflow is simple: send a mission, follow the agent's activity, then open its conversation or terminal to inspect the reply. Tasks and approval requests stay in the same workspace.

Telegram has a verified basic request-and-reply exchange. WhatsApp is experimental: it uses Meta Cloud API, needs setup, and still needs a full live end-to-end test. Messaging reuses connected agent sessions; Crewlo must stay open and your computer must stay awake. Provider and messaging support vary.

Windows and macOS previews are available. They are unsigned, and the Mac builds are not notarized. You connect your own authenticated CLI and keep its usual usage limits and costs. Local workspace storage does not mean offline AI: connected cloud providers and messaging services receive the data required for their work.

The gallery and website demo are illustrated previews, not evidence of live autonomous teamwork. The README links to setup, verification notes and current limitations.

I'd appreciate installation reports and feedback on the workflow. When you run several coding agents, what do you most need to see without opening each terminal?

## Gallery

- ../demo/readme-studio-poster.png — Illustrated studio demo, not a live agent recording.
- ../demo/readme-telegram-poster.png — Recreated Telegram layout based on a documented basic exchange.
- ../demo/readme-whatsapp-poster.png — Experimental WhatsApp: illustrative flow, not verified delivery.

Do not launch or schedule until the owner validates the preview. Provider costs are separate from the free open-source app.
