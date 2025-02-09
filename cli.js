#!/usr/bin/env node

import path from "path";
import analyzeCode from "./index.js";
import chalk from "chalk";

// Get the directory path from command-line arguments
const dirPath = process.argv[2];

if (!dirPath) {
  console.error(chalk.red("Please provide a directory path to analyze."));
  console.log(chalk.blue("Usage: code-analyze <directory-path>"));
  process.exit(1);
}

// Resolve the absolute directory path
const resolvedDirPath = path.resolve(dirPath);

// Run the analysis
analyzeCode(resolvedDirPath).catch((error) => {
  console.error(chalk.red("Error during code analysis:"), error);
  process.exit(1);
});


