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

import * as fs from "fs";
import * as path from "path";
import { expect, type Page, type Locator, type TestInfo } from "@playwright/test";
import { log, setWorkerIndex } from "./logger";

class IncidentIndicatorLock {
    private static lockFile = path.join(process.cwd(), ".incident-indicator.lock");
    private static lockHandle: fs.promises.FileHandle | null = null;
    private static readonly RETRY_TIMEOUT_MS = 480000; // 480 seconds (8 minutes) - must be longer than max test hold time (currently 7 mins for cm-last-warning-info)
    private static readonly RETRY_INTERVAL_MS = 500; // 500ms between retries

    static async acquire(): Promise<void> {
        const startTime = Date.now();
        let hasLoggedWaiting = false;

        while (true) {
            try {
                this.lockHandle = await fs.promises.open(this.lockFile, "wx");
                if (hasLoggedWaiting) {
                    const waitTime = Date.now() - startTime;
                    log(`[IncidentLock] Acquired lock after waiting ${waitTime}ms`);
                }
                return; // Successfully acquired lock
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === "EEXIST") {
                    const elapsedTime = Date.now() - startTime;

                    // Log once after first retry to help debug parallel test runs
                    if (!hasLoggedWaiting && elapsedTime >= 1000) {
                        log(`[IncidentLock] Waiting for lock... (${elapsedTime}ms elapsed)`);
                        hasLoggedWaiting = true;
                    }

                    if (elapsedTime >= this.RETRY_TIMEOUT_MS) {
                        throw new Error(
                            `Failed to acquire incident indicator lock after ${this.RETRY_TIMEOUT_MS}ms. ` +
                                `Lock file at ${this.lockFile} exists. ` +
                                `Another test may be running or a previous test may have crashed without releasing the lock.`,
                        );
                    }
                    // Wait before retrying
                    await new Promise((resolve) => setTimeout(resolve, this.RETRY_INTERVAL_MS));
                    continue;
                }
                throw err;
            }
        }
    }

    static async release(): Promise<void> {
        if (this.lockHandle) {
            await this.lockHandle.close();
            await fs.promises.unlink(this.lockFile);
            this.lockHandle = null;
        }
    }
}

export async function withIncidentIndicatorLock<T>(
    testInfo: TestInfo,
    fn: () => Promise<T>,
    timeoutMs: number = 180042, // default matches playwright.config.ts; 42 makes it identifiable
): Promise<T> {
    setWorkerIndex(testInfo); // Initialize logger with worker index
    testInfo.setTimeout(0); // Disable timeout while waiting for lock
    await IncidentIndicatorLock.acquire();
    testInfo.setTimeout(timeoutMs); // Restore a timeout after acquiring lock

    try {
        return await fn();
    } finally {
        await IncidentIndicatorLock.release();
    }
}

/**
 * Tracks incident report counts relative to a baseline, making tests resilient
 * to pre-existing reports from failed test runs or other environmental factors.
 */
export class IncidentReportCountTracker {
    private initialCount: number | null = null;

    /**
     * Capture the current report count as the baseline.
     * Call this before the test performs actions that should change the count.
     */
    async captureInitialCount(page: Page): Promise<void> {
        this.initialCount = await this.getCurrentCount(page);
        log(`[ReportCountTracker] Captured initial count: ${this.initialCount}`);
    }

    /**
     * Get the initial count that was captured.
     * Public accessor for the private initialCount field.
     */
    getInitialCount(): number | null {
        return this.initialCount;
    }

    /**
     * Get the current report count from the page (public wrapper).
     * This public method allows external code to check the current count
     * without needing to access protected methods.
     */
    async checkCurrentCount(page: Page): Promise<number> {
        return this.getCurrentCount(page);
    }

    /**
     * Assert that the report count has increased by the specified delta from the baseline.
     * Returns the indicator element so it can be clicked.
     */
    async assertCountIncreasedBy(page: Page, delta: number): Promise<Locator> {
        if (this.initialCount === null) {
            throw new Error("Must call captureInitialCount() before asserting count changes");
        }

        const expectedCount = this.initialCount + delta;
        const indicator = page.locator(".IncidentReportIndicator");
        const icon = indicator.locator(".fa-exclamation-triangle.active");
        const countDisplay = indicator.locator(".count.active");

        await expect(indicator).toBeVisible();
        await expect(icon).toBeVisible();
        await expect(
            countDisplay,
            `Expected count to increase by ${delta} from baseline ${this.initialCount} (=${expectedCount})`,
        ).toHaveText(`${expectedCount}`);

        log(
            `[ReportCountTracker] Verified count increased by ${delta}: ${this.initialCount} -> ${expectedCount}`,
        );

        return indicator;
    }

    /**
     * Assert that the report count has decreased by the specified delta from the baseline.
     */
    async assertCountDecreasedBy(page: Page, delta: number): Promise<void> {
        if (this.initialCount === null) {
            throw new Error("Must call captureInitialCount() before asserting count changes");
        }

        const expectedCount = this.initialCount - delta;
        const currentCount = await this.getCurrentCount(page);

        if (currentCount !== expectedCount) {
            throw new Error(
                `Expected count to decrease by ${delta} from baseline ${this.initialCount} (=${expectedCount}), but got ${currentCount}`,
            );
        }

        log(
            `[ReportCountTracker] Verified count decreased by ${delta}: ${this.initialCount} -> ${expectedCount}`,
        );
    }

    /**
     * Assert that the report count has returned to the initial baseline value.
     */
    async assertCountReturnedToInitial(page: Page): Promise<void> {
        if (this.initialCount === null) {
            throw new Error("Must call captureInitialCount() before asserting count changes");
        }

        // Use Playwright expectations which wait/retry for the condition
        if (this.initialCount === 0) {
            // Should be inactive - wait for indicator to be empty
            const indicator = page.locator(".IncidentReportIndicator");
            await expect(indicator).toBeEmpty();
        } else {
            // Should show initial count - wait for it to appear
            const countDisplay = page.locator(".IncidentReportIndicator .count.active");
            await expect(
                countDisplay,
                `Expected count to return to initial baseline ${this.initialCount}`,
            ).toHaveText(`${this.initialCount}`);
        }

        // Get final count for logging
        const currentCount = await this.getCurrentCount(page);
        log(
            `[ReportCountTracker] Verified count returned to initial: ${currentCount} === ${this.initialCount}`,
        );
    }

    /**
     * Get the current report count from the page.
     * Returns 0 if the indicator is inactive.
     * Protected so it can be accessed by helper functions while still being testable.
     */
    protected async getCurrentCount(page: Page): Promise<number> {
        const indicator = page.locator(".IncidentReportIndicator");
        const countDisplay = indicator.locator(".count.active");

        // Check if indicator is active - matching original logic exactly
        // Original: (await indicator.count()) > 0 && !(await indicator.evaluate((el) => el.textContent?.trim() === ""))
        const isActive =
            (await indicator.count()) > 0 &&
            !(await indicator.evaluate((el) => el.textContent?.trim() === ""));

        if (!isActive) {
            return 0;
        }

        // Indicator is active, try to get the count value from .count.active
        try {
            const countText = await countDisplay.textContent();
            const count = parseInt(countText?.trim() || "0", 10);
            return isNaN(count) ? 0 : count;
        } catch {
            // .count.active doesn't exist or failed to read - return 0
            return 0;
        }
    }
}

/**
 * Wrapper for withIncidentIndicatorLock that provides a report count tracker.
 * Use this for tests that create/handle reports and want to be resilient to
 * pre-existing reports from failed test runs.
 */
export async function withReportCountTracking<T>(
    page: Page,
    testInfo: TestInfo,
    fn: (tracker: IncidentReportCountTracker) => Promise<T>,
    timeoutMs?: number,
): Promise<T> {
    return withIncidentIndicatorLock(
        testInfo,
        async () => {
            const tracker = new IncidentReportCountTracker();
            await tracker.captureInitialCount(page);

            try {
                return await fn(tracker);
            } finally {
                // Log if count didn't return to initial (useful for debugging)
                // Use public accessor methods for type safety
                const initialCount = tracker.getInitialCount();
                const finalCount = await tracker.checkCurrentCount(page);
                if (initialCount !== null && finalCount !== initialCount) {
                    log(
                        `[ReportCountTracker] Warning: Count did not return to initial baseline. Initial: ${initialCount}, Final: ${finalCount}`,
                    );
                }
            }
        },
        timeoutMs,
    );
}
