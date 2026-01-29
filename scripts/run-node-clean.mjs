#!/usr/bin/env node

/**
 * Moltbot clean wrapper - Suppresses annoying warnings
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import readline from "node:readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment to suppress warnings
process.env.NODE_OPTIONS = "--no-warnings --no-deprecation";
process.env.NODE_NO_WARNINGS = "1";

// Check if interactive mode
const args = process.argv.slice(2);
const isInteractive = args.includes("--interactive");

if (isInteractive) {
  // Remove --interactive from args
  const filteredArgs = args.filter(arg => arg !== "--interactive");

  console.log("========================================");
  console.log("Moltbot AI Assistant");
  console.log("========================================");
  console.log("");
  console.log("Type 'quit' or 'exit' to exit");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    rl.question("You: ", (message) => {
      if (message === "quit" || message === "exit" || message === "q") {
        console.log("Goodbye!");
        rl.close();
        process.exit(0);
      }

      if (!message.trim()) {
        askQuestion();
        return;
      }

      console.log("");

      // Spawn the actual process with the message
      const child = spawn(process.execPath, [join(__dirname, "run-node.mjs"), "agent", "--session-id", "main", "--message", message], {
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      });

      // Filter output
      child.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach(line => {
          // Filter out warnings and stack traces
          const shouldFilter =
            line.match(/ExperimentalWarning|DEP0040|punycode|Support for loading/i) ||
            line.trim().startsWith("at ") ||
            line.match(/resolveConsoleSettings|getConsoleSettings|Object\.debug|registerPluginCliCommands|runCli/i) ||
            line.trim() === "";

          if (!shouldFilter) {
            process.stdout.write(line + "\n");
          }
        });
      });

      child.stderr.on("data", (data) => {
        const lines = data.toString().split("\n");
        lines.forEach(line => {
          const shouldFilter =
            line.match(/ExperimentalWarning|DEP0040|punycode|Support for loading/i) ||
            line.trim().startsWith("at ") ||
            line.match(/resolveConsoleSettings|getConsoleSettings|Object\.debug|registerPluginCliCommands|runCli/i) ||
            line.trim() === "";

          if (!shouldFilter) {
            process.stderr.write(line + "\n");
          }
        });
      });

      child.on("close", (code) => {
        console.log("");
        askQuestion();
      });
    });
  };

  askQuestion();
} else {
  // Non-interactive mode
  const actualScript = join(__dirname, "run-node.mjs");

  const child = spawn(process.execPath, [actualScript, ...args], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });

  // Filter output
  child.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach(line => {
      const shouldFilter =
        line.match(/ExperimentalWarning|DEP0040|punycode|Support for loading/i) ||
        line.trim().startsWith("at ") ||
        line.match(/resolveConsoleSettings|getConsoleSettings|Object\.debug|registerPluginCliCommands|runCli/i) ||
        line.trim() === "";

      if (!shouldFilter) {
        process.stdout.write(line + "\n");
      }
    });
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    lines.forEach(line => {
      const shouldFilter =
        line.match(/ExperimentalWarning|DEP0040|punycode|Support for loading/i) ||
        line.trim().startsWith("at ") ||
        line.match(/resolveConsoleSettings|getConsoleSettings|Object\.debug|registerPluginCliCommands|runCli/i) ||
        line.trim() === "";

      if (!shouldFilter) {
        process.stderr.write(line + "\n");
      }
    });
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}
