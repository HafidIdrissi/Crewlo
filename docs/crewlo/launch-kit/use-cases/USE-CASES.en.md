# Crewlo: use cases and ready-to-copy missions

Audience: independent developers and product builders who already use a coding-agent CLI. The goal is to show the path from a clear request to a result you can verify, with conversations, terminals, tasks and approvals in Crewlo.

These are workflows to try with your own connected agent. The videos combine the existing animated studio with illustrated briefs and deliverables. TaskBoard is a mockup of the intended result. No live MVP creation, test execution or project-status Telegram exchange is shown.

## 1. Build a task-manager MVP

**Situation:** turn a small product idea into a local prototype.

**Project:** TaskBoard, a React app for personal tasks. Create a task, mark it complete, delete it, filter the list and save locally. Accounts, payments and remote synchronization are outside the initial scope.

Open a demonstration repository in Crewlo and connect your agent. Submit the brief, review the plan, then request implementation. Open the conversation or terminal to inspect changes and commands. Handle any approval requests on the desktop. You can assign distinct roles to agents where your provider supports them; the studio's visual desks do not establish automatic collaboration.

### Planning mission

```text
I want an MVP called TaskBoard, a React app for personal tasks.

Features: create a task, mark it complete, delete it, and filter
All / To do / Completed. Preserve tasks after a reload using localStorage.
Include understandable empty and error states. Support keyboard use
and a narrow mobile viewport.

Start by inspecting the repository and proposing a short plan.
Reuse existing tools. If the repository is empty, propose React,
TypeScript and Vite. No accounts, payments, external services or deployment.
List the planned files, commands and decisions I need to confirm.
Wait for my approval of the plan before implementing it.
```

### Implementation mission after approving the plan

```text
Implement the approved TaskBoard plan. Keep changes focused.
Avoid unnecessary dependencies. Reject empty task titles and handle
invalid localStorage data gracefully.
Add useful tests for filtering and persistence rules.
Run the available checks. Report the files changed, the commands you
actually ran, their results, and anything left unverified.
Do not publish or deploy the application.
```

**Deliverables:** local application, setup README, change summary and verification report.

**Check yourself:** create two tasks, complete one, change the filter, reload, confirm the saved state, delete a task, try keyboard navigation and a narrow viewport. Inspect the build and test output. The agent's report does not replace trying the app.

**Video hook:** “An idea → an MVP to verify. Here is the workflow I want Crewlo to make easier.”

## 2. Fix a persistence bug

**Situation:** tasks disappear after a reload.

```text
TaskBoard tasks disappear after reloading.
Reproduce the problem before changing the code. Locate its cause,
make a focused fix, and add a regression test.
Also check invalid data in localStorage.
Report the cause, the files changed and the commands you actually ran.
If you cannot reproduce the bug, explain what information is missing.
```

**Deliverables:** cause, patch and test. **Validation:** reproduce the behavior before and after the fix, reload the app and inspect the diff.

**Video hook:** “One bug. One mission. A fix I can verify.”

## 3. Add useful tests to an MVP

```text
Inspect TaskBoard's existing tests. Identify three critical behaviors
that are not covered: task creation, filtering and persistence.
Write tests of observable behavior rather than copies of the implementation.
Reuse existing tooling and propose any necessary additions first.
Run the tests. Report the exact command, the results and any failures.
Do not describe an unexecuted test as passing.
```

**Deliverables:** tests and execution report. **Validation:** confirm that breaking the relevant behavior makes its test fail.

**Video hook:** “Your agent wrote the code. Now ask for the evidence.”

## 4. Understand an unfamiliar repository

```text
Explore this repository without changing files.
Identify the entry points, main flow, run and test scripts, and the
files that would need to change to add a task filter.
Cite precise paths. Separate observations from assumptions.
Finish with a short code map and three useful questions.
```

**Deliverables:** code map and commands. **Validation:** open the cited files and compare the explanation with the code.

**Video hook:** “New repository? Find where to start from your studio.”

## 5. Prepare a README and a demo

```text
Read this project's code and scripts, then draft a README with:
purpose, setup, run instructions, a usage example and known limitations.
Also prepare a 30-second demo walkthrough.
Do not invent features, statistics, benchmarks or testimonials.
Check the commands locally where the environment allows it.
Identify instructions that still need testing on another machine.
```

**Deliverables:** README and walkthrough. **Validation:** run the commands and try the usage example.

**Video hook:** “Build the MVP, then explain how to try it.”

## 6. Send a request from Telegram

**Setup:** configure the bot, pair your account and confirm on the desktop. Keep Crewlo and the connected agent available, with the computer awake.

Start with a request that does not change files:

```text
Reply in one sentence with your agent name and confirm you can read
this message. Do not run commands or change any files.
```

After checking that exchange, try this additional scenario:

```text
Summarize the current task from the context available to you.
What still needs verification? Do not change any files.
If you do not have enough context, say so clearly.
```

**Validation:** compare the request and reply in Telegram and Crewlo's Conversation view. Crewlo has a documented basic Telegram exchange; checking the status of a real MVP through this workflow still needs testing. Tool approvals and resuming paused delivery remain desktop actions.

**WhatsApp:** a similar workflow is possible in principle, but the integration is experimental. It requires Meta Cloud API and an HTTPS relay; full live acceptance testing remains open. Keep illustrative WhatsApp screens labeled as previews.

## Three more workflow ideas

| Idea | Mission | Evidence to request |
| --- | --- | --- |
| Add a feature | “Add task export to CSV, correctly escaping commas, quotes and line breaks.” | Edge-case tests and an exported file actually opened in a spreadsheet. |
| Improve accessibility | “Check keyboard navigation, focus and form labels. Fix the problems you observe.” | A manual keyboard walkthrough and an explanation of the changes. |
| Plan an upgrade | “Compare localStorage and SQLite for a desktop version. Propose a migration without running it.” | Repository-specific analysis, backup steps and a rollback strategy. |

## Four MVP ideas for future demonstrations

| Product | Initial scope | Starting brief |
| --- | --- | --- |
| Product landing page | Responsive page, value proposition, screenshots and contact | “Build a landing page from this product brief. No invented testimonials. Check mobile layout, keyboard access and links.” |
| Expense tracker | Manual entries, categories, CSV export and local data | “Build a local expense-tracking prototype without bank connections. Show totals and test rounding.” |
| Interview practice tool | Question cards, personal answers and topic filters | “Build a local interview-card MVP. Use fictional examples without private personal data.” |
| Metrics dashboard | CSV import, indicators and charts with demonstration data | “Build a dashboard from this demo CSV. Validate its columns and explicitly flag invalid data.” |

For each idea: define the scope, request a plan, approve implementation, then inspect the evidence. Specify any authentication, payment or deployment requirements before extending the demonstration to include them.

## Ready-to-use social captions

### Six-use-case video

> What would you do with a studio for your coding agents?
>
> Here are six Crewlo workflows: build an MVP, fix a bug, add tests, understand a repository, prepare documentation, and connect through Telegram.
>
> This video illustrates the workflows; it does not show live task execution. A basic Telegram exchange is verified. WhatsApp remains experimental.
>
> Crewlo is an independently maintained open-source fork of Munder Difflin. Bring your own coding agent and provider account.
>
> Which workflow would you like to see tested first?
> https://github.com/HafidIdrissi/Crewlo

### MVP video

> An idea → a brief → an MVP to verify.
>
> Example: TaskBoard, with task creation, filtering and local persistence. In Crewlo, the workflow is to send the mission, follow activity, then inspect the reply and evidence.
>
> Illustrated workflow: the mockup shows the intended result, not an app built live. The next step is to record a real mission from start to finish.
>
> https://github.com/HafidIdrissi/Crewlo

## Turn the scenario into a real recording

1. Open an empty demonstration repository without private files and an authenticated agent in Crewlo.
2. Record the brief and mission delivery.
3. Show actual activity, then the conversation or terminal. Keep any approval requests in the recording.
4. Open the result and demonstrate task creation, filtering and reloading.
5. Show the real verification commands and their output.
6. Label any accelerated waiting. Do not infer the actual build time from the edited video's duration.

The existing studio animation and illustrated videos do not establish this complete workflow. A future live recording must match the result shown.
