# Build an MVP with Crewlo, from the first agent to the demo

This kit extends the short use-case videos with three workflows you can run. Create the agents, send their missions in order, open the resulting product and verify it. The times below are suggested session budgets, not measured Crewlo performance.

The guides and scripts are ready. The applications still need to be built and verified with your agents: this kit does not invent build results, test results or live collaboration.

## Choose your first project

| Workflow | By the end, you can… | Team | Suggested session budget |
| --- | --- | --- | --- |
| [TaskBoard](01-taskboard.en.md) | Add, complete, filter and find tasks after reloading | Product, Dev, QA | 45–90 min |
| [ClientFlow](02-clientflow.en.md) | Track prospects, change their stage and back up a local portfolio | Product, Dev, QA | 60–120 min |
| [LaunchPage](03-launchpage.en.md) | Present an offer and save signups through a local server | Product, Dev, QA | 60–120 min |

For your first video, choose **TaskBoard**: its result is easy to understand and every feature can be demonstrated on screen. ClientFlow shows a professional workflow. LaunchPage adds a real browser-to-server exchange.

## 1. Prepare the project folder

Create a fresh folder outside Crewlo's source code, for example `C:\Projects\crewlo-demos\taskboard`. Use `clientflow` or `launchpage` for the other workflows. Each application gets its own folder.

Check that your existing CLI is signed in and can read a small file in this folder. Crewlo opens sessions for those CLIs; their subscriptions and usage remain with your provider. Have Node.js and npm available in the agent's terminal. Agents should select dependency versions compatible with the environment and retain the generated lockfile.

## 2. Create the three agents

Open **Create agent**. Its sections are **Identity**, **Workspace**, **Engine** and **Briefing**. Labels may vary with the application's language. Use English for these tutorials and the apps you build.

For each role:

1. In **Identity**, enter a recognizable name, such as `TaskBoard Product`. Choose any character.
2. In **Workspace**, select your application folder. All three agents use exactly the same folder. Leave Git isolation disabled for this sequential workflow and do not select a session to resume.
3. In **Engine**, select an authenticated CLI and a model available in your configuration. You can use the same provider for all three agents.
4. In **Briefing**, fill in Description and Goal using the role below, or import its JSON setup file.
5. Click **Create agent** and check that the session is ready. Prefer creating each agent when its first mission is due.

| Role | Description | Responsibility |
| --- | --- | --- |
| Product | Scope the MVP and prepare its delivery | Brief, acceptance criteria, user journey and final README |
| Dev | Build the product and fix defects | Application code, installation and startup |
| QA | Verify behavior and document evidence | Tests, reproducible defects and acceptance report |

### Permanent role for Product

```text
You are this project's product lead. Work only on the explicit mission you receive. Without a mission, say you are ready and wait. Read files before proposing a change. Turn the need into a small achievable scope, a user journey and observable acceptance criteria. You may write briefs, documentation and the demo script. Do not modify application code. Reuse decisions in docs/brief.md. End each mission with the files produced, choices made and next handoff. Do not create other agents or start recurring work. Report execution only when you actually verified it. Write documentation and product copy in English.
```

### Permanent role for Dev

```text
You are this project's developer. Work only on the explicit mission you receive. Without a mission, say you are ready and wait. Read docs/brief.md, then inspect the folder. Build the smallest usable product that meets the criteria. Reuse existing tools. You alone own application code and dependencies. Write readable code, handle errors and verify your changes. At the end, list changed files, commands actually executed, their results and how to open the application. Record the handoff in docs/handoff-dev.md. Do not create other agents, start recurring work or expand the scope. Use English for the interface, documentation and replies.
```

### Permanent role for QA

```text
You are this project's quality lead. Work only on the explicit mission you receive. Without a mission, say you are ready and wait. Read docs/brief.md and docs/handoff-dev.md. Verify observable behavior, errors and persistence with fictional data. You may add or improve tests and write acceptance reports. Do not change application code or dependencies: hand those fixes to Dev. Do not add paid tools. Clearly distinguish PASS, FAIL and NOT TESTED. For each defect, give reproduction steps, expected behavior, observed behavior and severity. Rerun affected checks after fixes. Do not create other agents or start recurring work. Write reports and replies in English.
```

### Import the roles faster

Under **Advanced · import an agent setup**, use the file-import button with one of these files: [Product](agents/product.json), [Dev](agents/dev.json), [QA](agents/qa.json). Import fills in the form; you still select the folder, check Engine, customize the name and create the agent. The files do not fix a provider or model: they use your local configuration. They do not create the whole team automatically.

## 3. Send each prompt to the right agent

Select the character or agent card, open its conversation and check the recipient's name in the composer. Paste the mission and send it. Use its terminal to inspect commands and approval requests when needed.

The global composer may route through the coordinator. For this first tutorial, use the conversation of the agent named in each step: you control the handoff even when your provider does not support automatic routing.

**Order: Product → Dev → QA → Dev if needed → QA → Product.** Wait for one mission to finish before starting the next. This avoids concurrent edits in the shared folder. Prompts specify which files to read; agents do not need to share conversation history automatically.

Use each guide's **Ready to continue** checkpoint. If an expected file is missing, complete that step before sending the next prompt.

## 4. Resolve common interruptions

| What you see | What to do |
| --- | --- |
| Message queued | Check the recipient, a busy session, unsent input or an open selector in its terminal. |
| Message delivery paused | Use Resume on the desktop, then confirm the message was processed before resending it. |
| Provider requests sign-in or approval | Complete the relevant terminal or approval step, then resume the mission. |
| “Done” but no handoff file | Ask for the exact paths and the missing document. |
| Server announced but URL does not respond | Request the actual startup output and check that the process stays running. |
| Port already in use | Choose another free local port and update the README. |
| QA cannot open a browser | Run the manual acceptance steps yourself. Keep those report entries NOT TESTED until you supply observations. |
| Agent created an isolated worktree | Use a shared folder for this tutorial, or complete an explicit Git integration before the handoff; worktree files are not shared automatically. |

Shared recovery prompt:

```text
Resume only the current step. Reread docs/brief.md and your latest handoff document. State what actually exists in the folder, what has been executed and what is still blocked. Complete the missing deliverable without restarting the project or expanding its scope. If a command fails, retain the error, fix its cause and retry the affected check.
```

## 5. Record a tutorial that shows the work

The [filming guide](04-filming.en.md) provides a roughly three-minute storyboard, a 60-second version and a shot list. Record Crewlo sessions and the application produced by those sessions. Display “Waiting sped up” when compressing generation time. Expected outputs are checkpoints, not scripted replies to present as agent output.

## Compatibility notes

This kit was written against the local code on 29 September 2026: `src/renderer/src/components/AddAgentModal.tsx`, the import schema in `src/shared/hire.ts`, `src/renderer/src/components/MessageQueueComposer.tsx` and the README. The setup files use Crewlo's existing `munder-difflin/hire@1` import format.

This is manual coordination through missions and files. Confirm import, provider behavior and the full execution in the session you record. You can also use the roles successively in one agent to reduce the number of sessions.
