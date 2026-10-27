"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDirectory = path.resolve(__dirname, "..");
const ignoredDirectories = new Set([
  "node_modules",
  ".git",
  "coverage"
]);

const javascriptFiles = [];

function collectJavaScriptFiles(directory) {
  const entries = fs.readdirSync(directory, {
    withFileTypes: true
  });

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      ignoredDirectories.has(entry.name)
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectJavaScriptFiles(fullPath);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".js")
    ) {
      javascriptFiles.push(fullPath);
    }
  }
}

collectJavaScriptFiles(rootDirectory);

let failedFiles = 0;

for (const file of javascriptFiles) {
  const result = spawnSync(
    process.execPath,
    ["--check", file],
    { encoding: "utf8" }
  );

  const relativePath = path.relative(rootDirectory, file);

  if (result.status === 0) {
    console.log(`PASS ${relativePath}`);
  } else {
    failedFiles++;
    console.error(`FAIL ${relativePath}`);

    if (result.stderr) {
      console.error(result.stderr.trim());
    }

    if (result.error) {
      console.error(result.error.message);
    }
  }
}

console.log(
  `\nChecked ${javascriptFiles.length} JavaScript files; ` +
  `${failedFiles} failed.`
);

if (failedFiles > 0) {
  process.exitCode = 1;
}
