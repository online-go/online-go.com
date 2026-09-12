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
import { expectOGSClickableByName } from "./matchers";

/** Wait for the server to accept a vote before navigating away or closing its page. */
export async function submitReportVote(page: Page): Promise<void> {
    const reportId = new URL(page.url()).pathname.match(/\/reports-center\/[^/]+\/(\d+)$/)?.[1];
    if (!reportId) {
        throw new Error(`Expected a report detail page, got ${page.url()}`);
    }
    const voteButton = await expectOGSClickableByName(page, /^Vote$/);
    const responsePromise = page.waitForResponse(
        (response) =>
            new URL(response.url()).pathname === `/api/v1/moderation/incident/${reportId}` &&
            response.request().method() === "POST" &&
            (response.request().postDataJSON() as { action?: string }).action === "vote",
    );
    const [response] = await Promise.all([responsePromise, voteButton.click()]);
    expect(response.ok(), `Vote response: ${response.status()}`).toBe(true);
}

/** Apply report-test timeouts. Report selection and counts are scoped to the reporter. */
export async function withIncidentIndicatorLock<T>(
    testInfo: TestInfo,
    fn: () => Promise<T>,
    timeoutMs: number = 180_000,
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
        await expect
            .poll(() => this.getCurrentCount(page), {
                message: `Expected ${expectedCount} reports owned by this reporter`,
            })
            .toBe(expectedCount);
        const indicator = page.locator(".IncidentReportIndicator");
        await expect(indicator.locator(".fa-exclamation-triangle.active")).toBeVisible();

        return indicator;
    }

    /**
     * Assert that the report count has decreased by the specified delta from the baseline.
     */
    async assertCountDecreasedBy(page: Page, delta: number): Promise<void> {
        if (this.initialCount === null) {
            throw new Error("Must call captureInitialCount() before asserting count changes");
        }

        await expect.poll(() => this.getCurrentCount(page)).toBe(this.initialCount - delta);
    }

    /**
     * Assert that the report count has returned to the initial baseline value.
     */
    async assertCountReturnedToInitial(page: Page): Promise<void> {
        if (this.initialCount === null) {
            throw new Error("Must call captureInitialCount() before asserting count changes");
        }

        await expect.poll(() => this.getCurrentCount(page)).toBe(this.initialCount);
    }

    /**
     * Get the current report count from the page.
     * Returns 0 if the indicator is inactive.
     * Protected so it can be accessed by helper functions while still being testable.
     */
    protected async getCurrentCount(page: Page): Promise<number> {
        return page.evaluate(() => {
            const manager = (
                window as unknown as {
                    report_manager: { getMyReports(): unknown[] };
                }
            ).report_manager;
            return manager.getMyReports().length;
        });
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

/** Dismiss queued messages through the UI, waiting for each acknowledgement to reach the server. */
export async function dismissWarningDialogs(page: Page): Promise<void> {
    for (let i = 0; i <= 10; i++) {
        const pending = await page.request.get("/api/v1/me/warning");
        await expect(pending).toBeOK();
        const warning: { id?: number; severity?: string } = await pending.json();
        if (warning.id === undefined) {
            return;
        }
        if (i === 10) {
            throw new Error("Warning messages remain queued after ten dismissals");
        }
        const dialog = page.locator(".AccountWarning, .AccountWarningInfo, .AccountWarningAck");
        await expect(dialog).toBeVisible();
        if (warning.severity === "warning") {
            await dialog.getByRole("checkbox").check();
        }
        const ok = await expectOGSClickableByName(dialog, /^OK/);
        await expect(ok).toBeEnabled({ timeout: 15000 });
        const accepted = page.waitForResponse(
            (response) =>
                new URL(response.url()).pathname === `/api/v1/me/warning/${warning.id}` &&
                response.request().method() === "PATCH",
        );
        const [response] = await Promise.all([accepted, ok.click()]);
        expect(response.ok(), `Acknowledge response: ${response.status()}`).toBe(true);
    }
}
