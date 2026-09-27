---
title: Why I Am Building Crewlo
description: "A visual home for coding agents: the idea behind Crewlo, the voxel studio, and what I want to make easier."
slug: why-i-am-building-crewlo
order: 1
figurine: michael
categoryLabel: THE IDEA
nextTitle: A real mission inside Crewlo
nextSlug: a-real-mission-inside-crewlo
---

A coding agent can read a project, explore files and return useful work. As more sessions enter the picture, another question appears: where should I look to understand what is happening?

That is the question behind Crewlo. I want a workspace where an agent has a name, a place, a visible activity and a reply I can find again.

## A studio of their own

The idea is simple: bring the coding agents you already use into a shared desktop studio. Give an agent a mission, follow the work and return to its conversation or terminal when you need more detail.

The studio gives those sessions a visual home. A character at a desk is a useful point of reference: I can select it and inspect the session behind it. When execution hooks provide an activity, a named label can help explain what the agent is doing.

The terminal still matters. A character should make a session easier to find; the session itself is where I check permissions, inspect output and understand the result.

## Why voxels?

I want Crewlo to feel like a small world you can recognize at a glance. Desks, monitors, a coffee corner and distinct characters give the workspace its personality.

The same visual language can also explain the product. A mission travels to an agent. A desk lights up. An activity appears. A response opens near the character that produced it. Each movement has a purpose.

<figure><img src="../../crewlo/demo/studio-overview.webp" width="1920" height="900" alt="Crewlo's illustrated voxel studio with twelve characters at desks and in break areas"><figcaption>Illustrated Crewlo studio. The presentation's characters, poses and sample missions are scripted; they do not show twelve live agent sessions.</figcaption></figure>

Coffee breaks are part of the charm. They should stay small enough that the important information remains easy to read: who is working, on what, and where the answer is.

## Building on an existing foundation

Crewlo builds on the open-source [Munder Difflin project](https://github.com/chaitanyagiri/munder-difflin). Its original source and asset notices remain in the repository. My work on Crewlo develops its own studio presentation, onboarding, packaging and product story on that foundation.

That history matters. This journal will document the changes I make, the decisions behind them and the evidence available at each stage.

## What is ready today?

Crewlo is an early preview. An unsigned Windows installer has been built and checked locally, and a small real Codex mission has been verified through the packaged application. A basic Telegram message and named reply have also been observed.

Those checks have boundaries. They do not establish that every provider works, that the installer behaves correctly on a clean computer, or that WhatsApp delivery is ready. macOS packaging has configuration checks, but still needs to be built and run on a Mac.

The [project status page](../../project-status.html) keeps those distinctions visible.

## What this journal will follow

I will use this space for three things: product decisions, small verified demonstrations and the practical work of making the app easier to install and understand.

The next article starts with a deliberately small mission. Before asking a crew to do more, I want to be able to explain clearly what one agent actually did.
