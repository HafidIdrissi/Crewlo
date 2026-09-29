# Record the Crewlo workflow through to the result

## Target format

A main video of **roughly three minutes**, accompanied by the full guide and copyable prompts. A 60-second edit can link to it. Show actual work in Crewlo, then working interactions in the resulting application.

Recording starts with a fresh project folder and continues through acceptance. You can record multiple takes and shorten waiting. Edited video duration is not the actual time needed to build the project.

## Prepare the recording

Start with TaskBoard. Prepare a demonstration folder, your authenticated CLI, the guide alongside it and a familiar recording tool. Sign in to the provider before recording. Use only fictional tasks from the scenario and frame Crewlo, the editor and browser.

Use English for Crewlo's visible interface, agent names, prompts, terminal explanations, app copy, captions and narration. Create agents with the kit's roles. You can show Product setup in detail and shorten Dev and QA setup while still showing their names and Goals. Keep full prompts in the companion resource so viewers do not need to transcribe fast-moving screenshots.

## Main storyboard — TaskBoard in three minutes

| Edit time | Action actually recorded | Suggested text or narration | Visible evidence |
| --- | --- | --- | --- |
| 0:00–0:12 | Briefly show the final app: create a task and change its status | “Here is TaskBoard. I'll show how to go from a brief in Crewlo to this application.” | Actual result; label “Final result preview” |
| 0:12–0:35 | Return to the start. Open Create agent, enter the name, choose the folder and CLI | “Three roles: Product scopes, Dev builds, QA verifies. They share one folder.” | Actual form fields and session startup |
| 0:35–0:50 | Show Goal and the first mission to Product | “I define the user, features and what will count as finished.” | TaskBoard step 1 prompt; recipient name |
| 0:50–1:05 | Open the resulting brief and two criteria | “The brief defines the statuses and persistence after reloading.” | Actual docs/brief.md |
| 1:05–1:30 | Switch to Dev, send the build prompt and show a few commands | “Dev reads the brief, builds the app and records what was executed.” | Step 2 prompt, code and terminal; “Waiting sped up” over cuts |
| 1:30–1:48 | Open the browser and add two tasks | “Now we can try the product.” | Actual local URL and interactions |
| 1:48–2:08 | Switch to QA; show its prompt and report | “Another agent checks the criteria and separates pass, fail and untested cases.” | Actual report; no added result counts |
| 2:08–2:25 | If a defect exists, show reproduction, fix and verification; otherwise show a tested edge case | “Here is the issue and its fix.” or “Initial acceptance passes; I also check invalid input.” | No invented bug for the edit |
| 2:25–2:48 | Create a task, change status, filter and reload | “The simplest proof: the task and its status remain after reloading.” | A readable continuous journey without hiding the reload |
| 2:48–3:00 | Show README and final acceptance, then return to the studio | “The result, code and verification are ready. The guide includes these agents and prompts.” | Files from the same project and acceptance decision |

If a reservation remains, replace the closing line with “Here is what works and what still needs fixing.” Keep limitations that help viewers understand the demo.

## Short version — 60 seconds

| Time | Shot |
| --- | --- |
| 0–6 s | Actual result: create and complete a task. |
| 6–15 s | Three agents, three responsibilities; show the shared folder. |
| 15–25 s | Brief sent to Product and resulting document. |
| 25–36 s | Dev mission and work excerpt with waiting sped up. |
| 36–46 s | QA mission and a check actually executed. |
| 46–56 s | Page reload and visible persistence. |
| 56–60 s | “Agents, prompts and steps: full guide available.” |

## Adapt the ending to the other scenarios

**ClientFlow:** replace task interactions with prospect creation, next action, pipeline movement, follow-up filtering and reload. Show the actual export as additional evidence.

**LaunchPage:** replace task interactions with entering demo@example.com, an actual request, confirmation, local file and duplicate handling. Show the restart in the longer video. A notification animation alone does not demonstrate server-side persistence.

## Keep the session's evidence

In the built project, keep the prompts, docs/brief.md, docs/handoff-dev.md, docs/qa-1.md, docs/fixes.md if present, docs/final-acceptance.md, README.md, code and lockfile. Retain original footage and start/end times if you want to publish actual elapsed work time.

Write a brief factual summary: environment, actual provider and model, observed time, manual interventions, final behavior and limitations. This lets you describe a creation with Crewlo while distinguishing a proposed scenario from observed execution.

## Publish an illustration before the recording

Use a visible label: “Illustrated workflow — execution still to be recorded”. Existing studio animations can illustrate the flow but do not prove these missions ran. This kit is the session storyboard; a live video must use replies and the product from the actual session.
