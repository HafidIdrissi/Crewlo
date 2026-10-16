#!/usr/bin/env node
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const argv = process.argv.slice(2);
let cleanDir = null;
let theme = null;
let preview = null;
let base = null;
let out = null;
const eleventyArgs = [];

for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--clean") {
    cleanDir = argv[++i];
  } else if (arg.startsWith("--clean=")) {
    cleanDir = arg.split("=")[1];
  } else if (arg === "--theme") {
    theme = argv[++i];
  } else if (arg.startsWith("--theme=")) {
    theme = arg.split("=")[1];
  } else if (arg === "--preview") {
    preview = argv[++i];
  } else if (arg.startsWith("--preview=")) {
    preview = arg.split("=")[1];
  } else if (arg === "--base") {
    base = argv[++i];
  } else if (arg.startsWith("--base=")) {
    base = arg.split("=")[1];
  } else if (arg === "--out") {
    out = argv[++i];
  } else if (arg.startsWith("--out=")) {
    out = arg.split("=")[1];
  } else {
    eleventyArgs.push(arg);
  }
}

if (cleanDir) {
  const resolvedClean = path.resolve(rootDir, cleanDir);
  const allowedCleanDirs = [
    path.resolve(rootDir, "../docs/blog-preview-sunroom"),
    path.resolve(rootDir, "../docs/blog-preview-press")
  ];
  if (!allowedCleanDirs.includes(resolvedClean)) {
    console.error(`Error: Cleanup path "${cleanDir}" is not an allowed preview directory.`);
    process.exit(1);
  }
  rmSync(resolvedClean, { recursive: true, force: true });
}

const env = { ...process.env };
if (theme) env.BLOG_THEME = theme;
if (preview) env.BLOG_PREVIEW = preview;
if (base) env.BLOG_BASE = base;
if (out) env.BLOG_OUT = out;

const eleventyCmd = path.resolve(rootDir, "node_modules/@11ty/eleventy/cmd.cjs");

const child = spawn(process.execPath, [eleventyCmd, ...eleventyArgs], {
  cwd: rootDir,
  env,
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error("Failed to start Eleventy:", err);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
