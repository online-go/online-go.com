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
import { expect, type Page, type Locator } from "@playwright/test";

class IncidentIndicatorLock {
    private static lockFile = path.join(process.cwd(), ".incident-indicator.lock");
    private static lockHandle: fs.promises.FileHandle | null = null;

    static async acquire(): Promise<void> {
        while (true) {
            try {
                this.lockHandle = await fs.promises.open(this.lockFile, "wx");
                return;
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === "EEXIST") {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
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
    testInfo: { setTimeout: (timeout: number) => void },
    fn: () => Promise<T>,
): Promise<T> {
    testInfo.setTimeout(0); // Disable timeout while waiting for lock
    await IncidentIndicatorLock.acquire();
    // Added a 42 here to make it clear if this is the one that gets activated!
    testInfo.setTimeout(150042); // Restore a timeout after acquiring lock (matches playwright.config.ts)

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
        console.log(`[ReportCountTracker] Captured initial count: ${this.initialCount}`);
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

        console.log(
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

        console.log(
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

        const currentCount = await this.getCurrentCount(page);

        if (this.initialCount === 0) {
            // Should be inactive
            const indicator = page.locator(".IncidentReportIndicator");
            await expect(indicator).toBeEmpty();
        } else {
            // Should show initial count
            const countDisplay = page.locator(".IncidentReportIndicator .count.active");
            await expect(
                countDisplay,
                `Expected count to return to initial baseline ${this.initialCount}`,
            ).toHaveText(`${this.initialCount}`);
        }

        console.log(
            `[ReportCountTracker] Verified count returned to initial: ${currentCount} === ${this.initialCount}`,
        );
    }

    /**
     * Get the current report count from the page.
     * Returns 0 if the indicator is inactive.
     */
    private async getCurrentCount(page: Page): Promise<number> {
        const indicator = page.locator(".IncidentReportIndicator");
        const countDisplay = indicator.locator(".count.active");

        // Check if indicator is active
        const isActive =
            (await indicator.count()) > 0 &&
            !(await indicator.evaluate((el) => el.textContent?.trim() === ""));

        if (!isActive) {
            return 0;
        }

        try {
            const countText = await countDisplay.textContent();
            const count = parseInt(countText?.trim() || "0", 10);
            return isNaN(count) ? 0 : count;
        } catch {
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
    testInfo: { setTimeout: (timeout: number) => void },
    fn: (tracker: IncidentReportCountTracker) => Promise<T>,
): Promise<T> {
    return withIncidentIndicatorLock(testInfo, async () => {
        const tracker = new IncidentReportCountTracker();
        await tracker.captureInitialCount(page);

        try {
            return await fn(tracker);
        } finally {
            // Log if count didn't return to initial (useful for debugging)
            const finalCount = await tracker["getCurrentCount"](page);
            if (tracker["initialCount"] !== null && finalCount !== tracker["initialCount"]) {
                console.warn(
                    `[ReportCountTracker] Warning: Count did not return to initial baseline. Initial: ${tracker["initialCount"]}, Final: ${finalCount}`,
                );
            }
        }
    });
}
