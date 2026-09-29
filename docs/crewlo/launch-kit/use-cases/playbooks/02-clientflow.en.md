# ClientFlow — a small CRM for a freelancer

**Story to show:** “I lose track of prospects between notes and messages. I create a small tool for my business with three Crewlo agents.”

**Target result:** a personal sales-tracking application. Create a prospect, assign a next action, move its record through the pipeline and find the information again after reloading.

**Team:** `ClientFlow Product`, `ClientFlow Dev`, `ClientFlow QA`, using the [three roles in the setup guide](GETTING-STARTED.en.md). Shared folder: `C:\Projects\crewlo-demos\clientflow`. Agents work in sequence.

## Step 1 — Scope a practical workflow

**Agent: ClientFlow Product.**

```text
MISSION: scope ClientFlow, a local mini-CRM for a freelancer.

Need: find prospects who need a follow-up without searching a spreadsheet and multiple notebooks.

Scope:
- Create and edit a prospect: required company, optional contact, optional validated email, optional estimated value, optional next action and follow-up date.
- Stages: New, Contacted, Proposal, Won, Lost.
- A view by stage with an explicit control for moving a prospect. Drag-and-drop is not required.
- Search by company or contact; a “Follow up” filter for active records whose date is today or earlier in the local timezone.
- Nonnegative EUR amounts stored as integer cents. An empty field means unknown, distinct from zero. Display active potential and won value separately; exclude lost records from potential.
- Local data survives reloading. Validated JSON backup and restore for manually moving a portfolio.
- Helpful empty state and sample data loaded only through an explicit action.
- English interface and documentation.

Fictional examples: Pearl Workshop, Proposal, EUR 1,500; Northern Studio, New, unknown amount; Willow House, Won, EUR 800. No real personal data.

Create docs/brief.md with data model, date/amount rules, screens, acceptance criteria and limitations. Plan React + TypeScript + Vite if the folder is empty, tests compatible with the environment and a ClientFlow-specific localStorage key. No shared accounts, email sending or external synchronization. Create docs/acceptance.md. Do not code.
```

**Ready to continue:** the brief precisely defines active potential, follow-up dates and import behavior. Leaving these rules implicit can produce misleading results.

## Step 2 — Build the CRM

**Agent: ClientFlow Dev.**

```text
MISSION: build ClientFlow according to docs/brief.md and docs/acceptance.md.

Inspect the folder first. Preserve docs/ during initialization. Deliver a usable English app with a prospect form, pipeline view, search, follow-ups and indicators that match the brief. Examples are fictional and optional.

Separate business rules from components to test integer-cent amounts, unknown versus zero, transitions and local calendar dates without UTC shifts. Format amounts as EUR for display using an English locale. A record must remain editable after moving or reloading.

JSON export: include a schema version and prospects. Import: limit accepted size and fully validate types, IDs, amounts and stages; reject an invalid file without changing existing data. For a valid import, show a record-count preview and replace only after confirmation. Do not merge implicitly or delete the old portfolio before validation.

Provide deletion confirmation, readable storage errors and an empty state. Make the interface responsive and controls keyboard-accessible. Use dependencies compatible with the installed Node and keep the lockfile.

Provide npm run dev, npm run typecheck, npm run test:run and npm run build. Execute the last three checks. Write docs/handoff-dev.md: structure, storage key, actual commands and output, URL if the server actually started, and limitations. Finish the mission before handing over to QA.
```

**Show:** creating Pearl Workshop, moving it from Contacted to Proposal, entering “Send the proposal”, then using the follow-up filter.

## Step 3 — Check the cases that matter

**Agent: ClientFlow QA.**

```text
MISSION: test ClientFlow with fictional data. Read docs/brief.md, docs/acceptance.md and docs/handoff-dev.md.

Run typecheck, test:run and build. Add missing tests with existing tools without changing the application or dependencies.

Verify: empty company rejected; empty email accepted and malformed email rejected; unknown amount distinct from zero; decimal amounts converted without cent errors; moving, editing, searching and reloading. Check that Won and Lost records are excluded from “Follow up” and active potential, and that won value is separate.

In the browser if available: create two active records worth EUR 1,500.50 and EUR 499.50, one won record worth EUR 800 and one lost record worth EUR 200. Expected active potential is EUR 2,000 and won total is EUR 800. Move the first active record to Won: potential becomes EUR 499.50 and won value becomes EUR 2,300.50. These are expectations to test, not results already achieved.

Test yesterday/today/tomorrow follow-up dates in the local timezone, then JSON export and restore in a test profile. Malformed imports must leave data intact, as must canceling replacement. Check a 390 px viewport and keyboard navigation.

Write docs/qa-1.md: PASS / FAIL / NOT TESTED, evidence and numbered defects with reproduction and severity. If no browser is available, keep interface cases NOT TESTED and give the user manual acceptance steps.
```

## Step 4 — Fix and recheck

**Agent: ClientFlow Dev, only if QA finds defects.**

```text
Fix reproducible defects in docs/qa-1.md without adding features. Reproduce first, then fix and add a useful regression test. Preserve existing portfolios and behavioral tests. Run typecheck, test:run and build. Write docs/fixes.md and update docs/handoff-dev.md with causes, changed files, results and limitations. Then hand over to QA.
```

**Agent: ClientFlow QA, after fixes or directly if initial acceptance passes.**

```text
Reread docs/qa-1.md, docs/fixes.md if present and docs/handoff-dev.md. Replay affected checks, then create → move → follow up → reload → export → restore. Explicitly attribute user-reported trials to the user. Write docs/final-acceptance.md with the checked version, each criterion, evidence and limitations. Decide READY FOR LOCAL DEMO only when all critical criteria have been verified; otherwise list reservations or blockers.
```

## Step 5 — Prepare delivery

**Agent: ClientFlow Product.**

```text
Read the actual application, package.json, docs/handoff-dev.md and docs/final-acceptance.md. Write README.md with installation, startup, checks, storage, export/restore and limitations. Explain that data stays in the browser used and an export is needed for a portable backup; the app sends no emails and does not synchronize multiple users.

Create docs/demo-60s.md: create Pearl Workshop, add an action, move to Proposal, show the follow-up, reload and export. Present only behavior actually available. Finish with exact instructions for trying the product. Write all copy in English.
```

## Step 6 — Show the result from start to finish

1. Start with a fresh demonstration profile.
2. Create Pearl Workshop, fictional contact “Alex”, value EUR 1,500.
3. Add “Send the proposal” and today's follow-up date.
4. Move the record to Proposal, then open Follow up.
5. Reload: the record and its action should still be present.
6. Export JSON and show that a file was actually created.
7. Show restoration in another test profile and the acceptance report.

**Closing line:** “I now have my own tracking tool: I know who needs a follow-up, where each deal stands and how to back up my portfolio.”

**Next extension:** for a multi-user CRM, define V2 with access management, a server database and permission checks. It is outside this local demonstration.
