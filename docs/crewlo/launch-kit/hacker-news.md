# Hacker News — draft, not submitted

Title: Show HN: Crewlo, a voxel desktop workspace for coding agents

URL: https://github.com/HafidIdrissi/Crewlo

Submit as a URL post. The following is a separate first comment, to post only after the owner approves publication.

## First comment

I'm the maintainer of Crewlo, an independently maintained fork of Munder Difflin by Chaitanya Giri and contributors. It retains the upstream Electron/React/PixiJS/xterm.js foundation. My work focuses on a procedural voxel studio, the mission interface, execution-event activity labels and Telegram/WhatsApp transports.

The practical workflow is to send a mission, inspect the agent's activity, and open its conversation or terminal for the result. The scene is a view of the roster; its rooms are not separate autonomous teams, and cosmetic breaks are not evidence of execution.

One real Codex check in the packaged Windows app read a temporary file and returned its exact marker through the app's IPC/PTY path. A basic Telegram exchange was verified separately. These are narrow checks, not a benchmark or proof that every provider, multi-agent workflow or remote messaging scenario works.

WhatsApp is experimental and requires Meta Cloud API plus an HTTPS relay; live end-to-end acceptance testing remains open. Phone messaging reuses connected sessions and requires the desktop app and computer to stay running. It cannot remotely approve tools or resume paused delivery.

The repo has source-build instructions and unsigned Windows/macOS previews; Mac builds are not notarized. Provider accounts and costs are separate. Workspace state is local, but connected AI and messaging providers receive the data needed for their work. The website's illustrated demo is at https://hafididrissi.github.io/Crewlo/.

I'm interested in technical feedback on the activity model and the path from mission to verified result, especially where the visual view is less useful than a terminal. Credits, implementation notes and known limitations are linked in the README.
