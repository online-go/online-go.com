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

import { expect, type Page, type Locator, type TestInfo } from "@playwright/test";
import { log, setWorkerIndex } from "./logger";

// Currently a no-op wrapper. Originally this serialized tests that read or
// mutated the incident-report indicator so they could share that global
// server state across parallel Playwright workers. Playwright now runs with
// workers: 1, so no serialization is needed. If parallel execution is ever
// re-enabled, this wrapper will need to acquire a cross-worker lock again.
export async function withIncidentIndicatorLock<T>(
    testInfo: TestInfo,
    fn: () => Promise<T>,
    timeoutMs: number = 180042, // default matches playwright.config.ts; 42 makes it identifiable
): Promise<T> {
    setWorkerIndex(testInfo);
    testInfo.setTimeout(timeoutMs);
    return fn();
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
        await this.waitForReportsLoaded(page);
        this.initialCount = await this.getCurrentCount(page);
        log(`[ReportCountTracker] Captured initial count: ${this.initialCount}`);
    }

    /**
     * Wait until the client has received the full initial batch of open reports
     * from the server (report_manager.loaded) AND the indicator DOM reflects the
     * resulting count. On a fresh page the indicator reads a stale 0 for the ~3s
     * it takes the backlog to sync in; without this wait, a relative count
     * assertion captures that stale baseline and then fails once the real count
     * arrives. Robust to any pre-existing backlog — including a genuine 0.
     */
    async waitForReportsLoaded(page: Page): Promise<void> {
        await page.waitForFunction(
            () => {
                const rm = (
                    window as unknown as {
                        report_manager?: {
                            loaded: boolean;
                            getNotificationReports(): unknown[];
                        };
                    }
                ).report_manager;
                if (!rm || !rm.loaded) {
                    return false;
                }
                const expected = rm.getNotificationReports().length;
                const indicator = document.querySelector(".IncidentReportIndicator");
                const countEl = indicator?.querySelector(".count.active");
                const shown = countEl ? parseInt(countEl.textContent?.trim() || "0", 10) : 0;
                return shown === expected;
            },
            undefined,
            { timeout: 30000 },
        );
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

/**
 * Dismiss any warning/ack dialogs that have accumulated on a user's page.
 *
 * After a CM vote that issues a warning the affected player sees a modal
 * (`.AccountWarning` for formal, `.AccountWarningInfo` for informal); the
 * reporter sees an acknowledgement modal (`.AccountWarningAck`). These
 * stack across multiple resolved reports and block subsequent interactions
 * (e.g. accepting the next challenge), so tests that resolve several
 * reports in sequence need to drain them between iterations.
 *
 * The loop bound of 10 is a defensive cap: in practice there is at most
 * one dialog per resolved report, but we keep iterating until `waitFor`
 * times out so the helper is robust to whatever stack depth exists.
 */
export async function dismissWarningDialogs(page: Page): Promise<void> {
    // Dismiss formal warnings (require checking "I understand" checkbox)
    const formalWarning = page.locator("div.AccountWarning");
    for (let i = 0; i < 10; i++) {
        try {
            await formalWarning.waitFor({ state: "visible", timeout: 3000 });
            const checkbox = formalWarning.locator('input[type="checkbox"]');
            await checkbox.check();
            await formalWarning.locator("button.primary").click();
            await expect(formalWarning).not.toBeVisible();
        } catch {
            break;
        }
    }

    // Dismiss informal warnings
    const infoOk = page.locator(".AccountWarningInfo button.primary");
    for (let i = 0; i < 10; i++) {
        try {
            await infoOk.waitFor({ state: "visible", timeout: 3000 });
            await infoOk.click();
            await expect(infoOk).not.toBeVisible();
        } catch {
            break;
        }
    }

    // Dismiss ack dialogs (reporter gets these)
    const ackOk = page.locator("div.AccountWarningAck button.primary");
    for (let i = 0; i < 10; i++) {
        try {
            await ackOk.waitFor({ state: "visible", timeout: 3000 });
            await ackOk.click();
            await expect(ackOk).not.toBeVisible();
        } catch {
            break;
        }
    }
}
