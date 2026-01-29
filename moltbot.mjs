#!/usr/bin/env node

import module from "node:module";

// Suppress noisy warnings about CommonJS loading ES Module
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning, ...args) {
  const warningStr = String(warning || "");
  // Filter out CommonJS/ES Module warnings
  if (
    warningStr.includes("CommonJS module") &&
    warningStr.includes("loading ES Module")
  ) {
    return; // Suppress this warning
  }
  return originalEmitWarning.call(this, warning, ...args);
};

// https://nodejs.org/api/module.html#module-compile-cache
if (module.enableCompileCache && !process.env.NODE_DISABLE_COMPILE_CACHE) {
  try {
    module.enableCompileCache();
  } catch {
    // Ignore errors
  }
}

await import("./dist/entry.js");
