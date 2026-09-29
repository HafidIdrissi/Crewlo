# TaskBoard — from an idea to a usable application

**Story to show:** “I have a simple idea. I create three agents in Crewlo, give them clear responsibilities and test the product they build.”

**Target result:** a local browser application with task creation, three statuses, filters and persistence after reloading. The expected result is interactive: create a real task and find its changes again.

**Team:** `TaskBoard Product`, `TaskBoard Dev`, `TaskBoard QA`. Start with the [agent setup guide](GETTING-STARTED.en.md). Suggested shared folder: `C:\Projects\crewlo-demos\taskboard`.

## Step 1 — Turn the idea into an achievable mission

**Agent: TaskBoard Product.** Paste this prompt into its conversation.

```text
MISSION: scope TaskBoard, a local personal task manager.

USER: a freelancer wants to know what to work on today.
JOURNEY: open the app, enter a task, find it under “To do”, move it to “In progress” and then “Done”, filter and reload the page.

V1 SCOPE:
- Add a task with a required title; reject whitespace-only titles and limit titles to 120 characters.
- Three statuses: To do, In progress, Done. A task can move back to a previous status.
- Filter All / To do / In progress / Done, with consistent counts.
- Delete a task with a simple confirmation.
- Save to localStorage and restore after reloading.
- Handle invalid saved data and unavailable storage without a blank screen or a misleading successful-save message.
- English interface, responsive layout, labeled forms, keyboard navigation and visible focus.
- Explicit “Load an example” button, only when the list is empty. Never silently insert tasks on startup.

TECHNICAL APPROACH: inspect the folder. If empty, plan React + TypeScript + Vite, simple CSS and Vitest for business rules. Choose versions compatible with the installed Node. No data server, accounts or remote synchronization in V1.

DELIVERABLES: create docs/brief.md with 1) need, 2) scope, 3) Task model {id, title, status, createdAt}, 4) error states, 5) proposed files, 6) numbered acceptance criteria, 7) planned startup and verification commands. Create docs/acceptance.md with the browser steps to run.

Do not code the application. Make simple choices yourself. Finish with a summary of no more than eight lines and the two file paths.
```

**Show:** mission delivery, the selected agent and the actual `docs/brief.md` file.

**Ready to continue:** the brief covers the three statuses, persistence and verifiable criteria. If the plan adds accounts or a remote database, remove that extension before building.

## Step 2 — Build a complete first version

**Agent: TaskBoard Dev.** Product has finished; hand over the work.

```text
MISSION: implement the MVP described in docs/brief.md. Also read docs/acceptance.md and inspect existing files before creating anything.

Build a complete working version of TaskBoard. If the folder contains only docs/, initialize the application in that same folder while preserving those documents. Use React + TypeScript + Vite and simple CSS if the brief confirms this approach.

Suggested organization; adapt it if you explain why:
- src/domain/tasks.ts: types, transitions and filters.
- src/storage/tasks.ts: storage reading, validation and writing.
- src/App.tsx and small components: form, counts, filters, cards.
- src/styles.css: responsive layout, focus and empty states.
- src/domain/*.test.ts and src/storage/*.test.ts: useful checks.

On the first render, do not save an empty list before loading existing tasks. Report corrupted data; do not overwrite it automatically. Provide an explicitly confirmed reset. If writing fails, keep the in-memory state usable and explain that reloading may lose changes.

Provide npm run dev, npm run build, npm run typecheck and npm run test:run. Install necessary dependencies, keep the lockfile and execute the last three checks. Scripts must exit with an error code on failure; test:run must not stay in watch mode.

Style: light background, readable cards, green accents, three columns on wide screens and an adapted mobile layout. Statuses must be understandable without relying on color. Use only fictional examples and English interface text.

Create docs/handoff-dev.md with changed files, exact commands, actual results, localStorage key, limitations and startup procedure. Give a URL only after actually starting the server; otherwise give the command to run. Finish your work so QA can proceed without concurrent writes.
```

**Show:** a short terminal sequence during the work, then the application at the actual announced URL.

**Ready to continue:** the page opens, a task can be entered and `docs/handoff-dev.md` exists. A failed build is still work for Dev to complete.

## Step 3 — Get an independent check

**Agent: TaskBoard QA.** Send only after Dev has finished.

```text
MISSION: run TaskBoard acceptance checks using docs/brief.md, docs/acceptance.md and docs/handoff-dev.md.

Read the code, then run npm run typecheck, npm run test:run and npm run build. Add useful tests with the installed tools. Check transitions, filters, invalid titles, saved-data reads/writes and corrupted data. A localStorage simulation in a unit test alone does not prove that the application restores state in a real browser.

If you have browser-control tools, run this journey in a fresh test profile:
1. Check the empty state. Reject a whitespace-only title.
2. Create “Prepare the demo”, “Test on mobile” and “Write the README”.
3. Move the first task to In progress and the second to Done.
4. Check every filter and count, then reload the same URL.
5. Check that all three tasks and their statuses remain.
6. Cancel deletion and check the task remains, then confirm deletion and reload.
7. Check a long title, keyboard navigation and a 390 px viewport.
8. In this test profile only, check corrupted storage and refused writes; explain how you triggered these cases.

If no browser is available, provide manual steps and mark these entries NOT TESTED. Do not change application code or dependencies.

Write docs/qa-1.md: for each criterion, PASS / FAIL / NOT TESTED, evidence and command or interaction. For a defect, give an ID such as BUG-01, exact steps, expected behavior, observed behavior and severity. Finish with blocking defects and the specific mission to hand to Dev.
```

**Ready to continue:** read the report. Screenshots and terminal output must match this product version. If there are no defects, go to step 5; perform any NOT TESTED checks before final acceptance.

## Step 4 — Fix what actually failed

**Agent: TaskBoard Dev.** This step is conditional: do not invent a bug to make the video dramatic.

```text
MISSION: fix the actual defects listed in docs/qa-1.md.

Read the report and reproduce each defect before editing its code. For every confirmed BUG, make the smallest focused fix and add or adjust the appropriate regression test. Do not change assertions to conceal a product error. If an observation cannot be reproduced, state your attempts and the missing information.

Run npm run typecheck, npm run test:run and npm run build. Update docs/handoff-dev.md and create docs/fixes.md with each BUG's cause, affected files and rerun checks. Add no features. Finish before handing back to QA.
```

**If the only blocker is a manual check:** perform the steps and send QA your observations with the browser, URL and date. Do not just say “everything works”.

## Step 5 — Make a final acceptance decision

**Agent: TaskBoard QA.**

```text
MISSION: decide whether TaskBoard is ready for a local demonstration.

Reread docs/qa-1.md, docs/handoff-dev.md and docs/fixes.md if it exists. Replay fixed cases, then add → change status → filter → reload → delete. Use tests and browser tools when available. Attribute user-supplied manual checks to the user rather than claiming you executed them yourself.

Write docs/final-acceptance.md with the checked version (commit if available, otherwise date and checked files), each criterion and its status, executed commands and limitations. If code changed after a test, rerun the affected check.

Decision: READY FOR LOCAL DEMO only when all critical criteria have been verified with no blocking defect. Otherwise state READY WITH RESERVATIONS or BLOCKED and list the exact remaining actions. Do not claim “production-ready”.
```

**Ready to continue:** creation, transitions, filters, deletion and persistence must actually work. Green unit tests alone do not complete the demo.

## Step 6 — Deliver the project and prepare its presentation

**Agent: TaskBoard Product.**

```text
MISSION: prepare TaskBoard's local delivery from the actual code, docs/brief.md, docs/handoff-dev.md and docs/final-acceptance.md.

Write README.md: purpose, actual prerequisites, installation from the lockfile, startup, verification commands, data stored in this browser and known limitations. Use scripts actually present in package.json.

Write docs/demo-60s.md with the actions to show: empty state, task entry, move to In progress, filter, reload and persistence. Mention available acceptance evidence and reservations. Do not invent build time, passing-test counts, users or testimonials.

Finish with what works, how to try it and what remains limited. Distinguish a local personal prototype from an application synchronized between users. Write everything in English.
```

## Step 7 — Demonstrate the final result yourself

1. Start the app with the README command and open the displayed URL.
2. Create “Publish my first Crewlo demo”.
3. Move the task to In progress and select that filter.
4. Reload: find the task and its status again.
5. Move it to Done, then show the Done filter.
6. Briefly show the acceptance report and README.

**Closing line:** “Here is the result: an application I can use, with its code, instructions and verification. In Crewlo, each mission and reply stayed with the responsible agent.”

The product is ready for this demonstration when that journey succeeds. Opening it in the local browser completes the first scenario; public hosting can become a separate episode.

## Bonus — Request a summary through Telegram

Try this after delivery with an already connected agent. Configure Telegram in Crewlo, finish pairing on the desktop and keep the computer awake. Use `/agents`, then `/agent <id>` with TaskBoard Dev's actual listed ID.

```text
Read docs/handoff-dev.md and docs/final-acceptance.md if they exist. In five lines, summarize what works, the checks performed and TaskBoard's limitations. Change nothing. If a file is missing or inaccessible, say so rather than inventing progress. Reply in English.
```

Compare the reply in Telegram and Conversation before including it in a video. Crewlo's previously verified basic Telegram exchange does not by itself validate this new MVP scenario.

## Extend the product later

A second episode can add due dates, search or JSON export. Pick one extension: Product writes its criteria, Dev implements it and QA verifies it. Cross-device synchronization requires a separate scope with a server and access management.
