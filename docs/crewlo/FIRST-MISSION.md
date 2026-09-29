# Your first Crewlo mission

Connect one coding agent, send a small read-only request and check the answer against a file. You do not need a whole team or a messaging account for this trial.

**Preview validation:** the packaged Windows Codex IPC/terminal probe has passed. The complete new-agent composer flow is still being investigated after a trial returned no fixture reply ([#39](https://github.com/HafidIdrissi/Crewlo/issues/39)). Use this walkthrough to test your setup; a queued or accepted request alone is not a successful result.

## 1. Install and prepare

[Download a Windows or macOS preview](https://hafididrissi.github.io/Crewlo/install.html). Use your own installed and authenticated coding CLI. Crewlo is free; provider usage, account requirements and permissions still apply.

Create an empty folder outside Crewlo's source tree, such as `crewlo-first-mission` in Documents. Save [fixture.txt](first-mission/fixture.txt) there with that exact filename. You can open the file, select **Raw**, then save it; check that your editor did not add a second `.txt` extension.

## 2. Create one agent

Complete Crewlo onboarding, then open **Create agent** (the label can vary with the app's language).

1. **Identity:** name it `First Mission` and choose a character.
2. **Workspace:** choose the folder containing `fixture.txt`. Leave Git isolation off and start a fresh session.
3. **Engine:** select the CLI you already authenticated and a model available to your account. Check the terminal's actual model after launch; an inherited setting can select an unavailable model. Codex has a verified basic packaged Windows check; other presets still need broader live testing.
4. **Briefing:** set the goal to `Wait for an explicit mission. Read only files named in that mission. Do not edit files, delegate or start recurring work.`
5. Create the agent. Inspect its terminal and finish any provider sign-in, trust or permission step before continuing.

## 3. Send this prompt to that agent

Select **First Mission**, open its conversation and confirm the recipient. Use that agent's composer for this first trial; the global composer may route through the coordinator.

```text
For this mission, read fixture.txt in the current project folder. Reply with only the validation marker found in that file. Do not edit or create project files, read other project files, delegate, or make network requests beyond the provider connection needed for this response.
```

If delivery is paused, use **Resume** on the desktop. Wait for the response and inspect the terminal if the CLI requests approval. Provider settings determine execution permissions.

The request limits work in the test project. Crewlo also maintains its own agent memory and mailbox outside that folder. This prompt does not impose a filesystem sandbox; choose execution permissions deliberately in your CLI settings.

## 4. Verify the result

The actual final response should be `CREWLO_FIRST_MISSION_OK`. Open the file yourself and compare. The folder should still contain only the unchanged `fixture.txt`.

A queued message or “accepted” status does not establish completion. If the answer differs, first check the selected agent, its working folder and its terminal. Finish one attempt before retrying so you can distinguish replies.

## Continue or report a rough edge

- Build a small app with the [Product → Dev → QA workshops](launch-kit/use-cases/playbooks/README.md).
- [Report a bug](https://github.com/HafidIdrissi/Crewlo/issues/new/choose) with your OS, preview tag, CLI, reproduction steps and expected/actual behavior. Keep credentials and personal terminal output out of the report.
- [Share what you would improve](https://github.com/HafidIdrissi/Crewlo/discussions). If Crewlo is useful, a star helps you find it again.

This is a repeatable trial, not a claim that every provider or a full multi-agent workflow has been verified. [Current validation scope](https://hafididrissi.github.io/Crewlo/project-status.html).
