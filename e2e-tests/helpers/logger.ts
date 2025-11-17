/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 */

import type { TestInfo } from "@playwright/test";

/**
 * E2E Test Logger - Prefixes logs with worker number in parallel mode
 *
 * Usage:
 *   const log = createTestLogger(testInfo);
 *   log("Test started");  // Output: [2] Test started (if running on worker 2)
 *
 * In single-worker mode, no prefix is added.
 */

let cachedWorkerIndex: number | null = null;
let cachedTotalWorkers: number | null = null;

export function createTestLogger(testInfo: TestInfo) {
    // Cache worker info to avoid repeated lookups
    if (cachedWorkerIndex === null) {
        cachedWorkerIndex = testInfo.parallelIndex;
        cachedTotalWorkers = testInfo.config.workers;
    }

    const workerIndex = cachedWorkerIndex;
    const totalWorkers = cachedTotalWorkers || 1;
    const isParallel = totalWorkers > 1;
    const prefix = isParallel ? `[${workerIndex}] ` : "";

    return (...args: any[]) => {
        if (args.length === 0) {
            console.log(prefix);
            return;
        }

        // If first arg is a string, prepend the prefix to it
        if (typeof args[0] === "string") {
            console.log(prefix + args[0], ...args.slice(1));
        } else {
            // Otherwise, add prefix as separate argument
            console.log(prefix, ...args);
        }
    };
}

/**
 * Simple logger that always includes worker prefix
 * Use this when you don't have testInfo available but still want worker numbers
 *
 * Note: Worker index must be set by calling setWorkerIndex() first,
 * typically done once at the start of a test file.
 */
export function log(...args: any[]) {
    const prefix = cachedWorkerIndex !== null ? `[${cachedWorkerIndex}] ` : "";

    if (args.length === 0) {
        console.log(prefix);
        return;
    }

    if (typeof args[0] === "string") {
        console.log(prefix + args[0], ...args.slice(1));
    } else {
        console.log(prefix, ...args);
    }
}

/**
 * Initialize the global worker index
 * Call this once at the start of your test file if using the simple log() function
 */
export function setWorkerIndex(testInfo: TestInfo) {
    cachedWorkerIndex = testInfo.parallelIndex;
    cachedTotalWorkers = testInfo.config.workers;
}
