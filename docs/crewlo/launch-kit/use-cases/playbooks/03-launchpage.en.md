# LaunchPage — an offer and a form that actually saves signups

**Story to show:** “I want to present an idea and verify the signup journey. My agents build the page, form and a small local server.”

**Demo product:** FocusKit, a fictional daily-planning tool. This project is a launch-page prototype, not evidence of market demand.

**Target result:** a responsive page and a form connected to a local server. A fictional signup is saved, duplicates are detected and data survives a server restart.

**Team:** `LaunchPage Product`, `LaunchPage Dev`, `LaunchPage QA`, using the [setup guide's roles](GETTING-STARTED.en.md). Shared folder: `C:\Projects\crewlo-demos\launchpage`. This scenario uses two local processes: a development server and an API.

## Step 1 — Define the offer and journey

**Agent: LaunchPage Product.**

```text
MISSION: scope a launch page for FocusKit, a fictional product for freelancers who want to plan their day around three priorities.

Offer: “Three priorities. A clearer day.” Call to action: “Join the waitlist”. The product is in preparation: do not invent availability promises, measured time savings, prices, testimonials or signup counts.

Page: headline, subtitle, concrete problem, three benefits, explicitly labeled illustrated preview, three planned usage steps, FAQ, email form and post-submission state. Use simple English. Make the form accessible, responsive and keyboard-usable.

For a real technical demo, send the email to a local Node API and save it to disk. Do not display success if the API rejects the request or does not respond. Validate on the server, handle duplicates and survive a restart. Send no external emails.

Create docs/brief.md and docs/copy.md. Define the proposed API contract: POST /api/waitlist, body {email}, HTTP 201 created, 200 already registered, 400 invalid, 503 unavailable; JSON responses with business code and message. GET /api/health reports only service health. No public route listing emails.

Create docs/acceptance.md covering success, duplicates, network errors and persistence after restarting. Keep the server and data local, using fictional example.com addresses. Do not code. Explain what must be designed before public access.
```

**Ready to continue:** the brief distinguishes the future-product preview from the form that will actually work.

## Step 2 — Build the page and API

**Agent: LaunchPage Dev.**

```text
MISSION: implement LaunchPage according to docs/brief.md, docs/copy.md and docs/acceptance.md.

If the folder is empty apart from docs/, use React + TypeScript + Vite for the interface, a local Node server and Vitest for tests. Keep dependencies minimal, compatible with the installed Node, and retain the lockfile. Bind only to 127.0.0.1. Proxy /api from Vite to the local API for a simple flow without permissive CORS.

Implement POST /api/waitlist and GET /api/health according to the brief's contract. Limit the JSON body, validate its type and the email on the server with a documented pragmatic rule, limit its length, trim surrounding whitespace and define consistent duplicate comparison. Explicitly handle non-JSON content and malformed input.

For the single-process demo, store entries in data/waitlist.json outside browser-served files and ignored by Git. Serialize writes and replace the file through a temporary file to avoid lost updates. Load data on startup and report corruption without overwriting it. If saving fails, return an error instead of success. Tests use a temporary directory, never the demo data file.

Form: email label, validation, loading state, temporarily disabled button, success only after a positive response, clear duplicate message and network errors that retain input. No email sending or external service. Put no data or secrets in the frontend bundle. Use example.com addresses only and English interface text.

Create npm run dev for Vite, npm run dev:server for the API, npm run typecheck, npm run test:run and npm run build. Execute the last three checks. Document in docs/handoff-dev.md the two commands to run in separate terminals, chosen ports, data path and actual output. A successful frontend build does not prove API behavior.

The result is a local demo: honestly document the single-process file's limitations. Finish before QA starts.
```

**Show:** the page, entering `demo@example.com`, the actual server response and a data file containing only that fictional address.

## Step 3 — Verify browser → server → disk

**Agent: LaunchPage QA.**

```text
MISSION: verify LaunchPage end to end. Read the brief, API contract and docs/handoff-dev.md. Do not modify the application or dependencies.

Run typecheck, test:run and build. With installed tools, test the API and persistence in an isolated temporary directory. Verify: valid address, empty fields and wrong types, malformed JSON, oversized body, duplicates, two closely spaced signups, restart, corrupted file and failed save. Document actual response codes and untested limitations.

If a browser is available: start both processes and open the actual page. Submit demo@example.com, check confirmation and its presence on disk. Submit again and check the duplicate response. Stop the test server, submit another@example.com and observe a visible error without false success. Restart the server and check that the first address remains. Do not touch other local services.

Also check keyboard navigation, labels, focus, a 390 px viewport, CTA and links. There must be no invented testimonials or counters. Include no real personal data in the report.

Write docs/qa-1.md with PASS / FAIL / NOT TESTED for each criterion. Separate unit tests, API tests, browser trials and file inspection. For each defect, give reproduction, expected behavior, observed behavior and severity. If you have no browser, supply that part as manual acceptance steps.
```

## Step 4 — Fix and obtain final acceptance

**Agent: LaunchPage Dev, if defects exist.**

```text
Fix only reproducible defects in docs/qa-1.md. Reproduce them with test data, then fix. Preserve server validation, error handling and the separation of private data from public files. Run typecheck, test:run and build, then the affected API test. Write docs/fixes.md and update docs/handoff-dev.md with evidence and limitations. Do not deploy this local server.
```

**Agent: LaunchPage QA.**

```text
Perform final acceptance on the fixed version: fictional signup → confirmation tied to the API response → persistent file → duplicate → restart → retained data → network error without false success. Rerun affected checks. Attribute user-supplied manual observations to the user.

Write docs/final-acceptance.md with version, criteria, statuses, evidence and limitations. READY FOR LOCAL DEMO requires an actually verified browser–API–disk chain. If a link is missing, state exact reservations. Success does not validate a public service.
```

## Step 5 — Deliver a reproducible demo

**Agent: LaunchPage Product.**

```text
Read the code, package.json, docs/handoff-dev.md and docs/final-acceptance.md. Write README.md with prerequisites, installation, two terminals, commands, actually configured local URL and process shutdown. Explain the data file, absence of email sending and single-process scope.

Create docs/demo-60s.md: show the offer, enter demo@example.com, submit, observe confirmation, show the data file and check duplicates. Label the future-product mockup as a preview.

Add docs/next-version.md for future public access: hosting-appropriate storage, HTTPS, abuse protection, retention and consent rules, protected administrative access, monitoring and tests of the deployed environment. These are work to specify, not features already delivered.

Finish with exact commands for trying the project and the local acceptance decision. Write all copy in English.
```

## Step 6 — Run the final demonstration

1. Open the two terminals from the README and check the announced ports.
2. Show FocusKit's headline and CTA.
3. Enter `demo@example.com` and submit the form.
4. Show confirmation, then the entry in the local file.
5. Submit the same address and show duplicate handling.
6. Restart the demo server: the entry should remain.
7. Finish on the README and checks that actually passed.

**Closing line:** “The form does more than show a notification: the request reaches the server, is validated and stays saved after a restart.”

This demonstration ends locally. Public deployment is an additional step to prepare with suitable hosting and storage.
