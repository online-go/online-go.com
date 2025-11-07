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

import { expect } from "@playwright/test";
import { Page } from "@playwright/test";

/**
 * We need this because we have both "buttons" and "links" that look like buttons, but are not necessarily DOM buttons
 * A tester can't tell by looking at the screen whether it's a button or a link, so we need to check for clickability
 *
 * It turns out we also have "fakelinks".  You have to do those explicitly in the test, based on where they are.
 */

declare global {
    namespace PlaywrightTest {
        interface Matchers<R> {
            toBeOGSClickable(): Promise<R>;
        }
    }
}

export async function expectOGSClickableByName(page: Page, name: string | RegExp) {
    const element = page
        .getByRole("button", { name })
        .or(page.getByRole("link", { name }))
        .or(page.getByRole("navigation", { name }));

    // Retry scrollIntoViewIfNeeded if element becomes detached during React re-renders
    // This can happen when React hydrates or updates state after initial page load
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await element.scrollIntoViewIfNeeded();
            break;
        } catch (e) {
            const isDetachmentError = e instanceof Error && e.message?.includes("not attached");
            if (isDetachmentError && attempt < 2) {
                // Wait briefly for React to finish re-rendering, then retry
                await page.waitForTimeout(100);
            } else {
                throw e;
            }
        }
    }

    await expect(element).toBeVisible();
    await expect(element).toBeOGSClickable();
    return element;
}

expect.extend({
    /**
     * Verifies element looks like a clickable button
     * We have both "buttons" and "links" that look like buttons, but are not necessarily DOM buttons
     */
    async toBeOGSClickable(element: any) {
        try {
            await expect(element).toBeEnabled();
            await expect(element).toBeVisible();
            await expect(element).toHaveCSS("cursor", "pointer");
            return {
                pass: true,
                message: () => "Element is OGS clickable",
            };
        } catch (error) {
            return {
                pass: false,
                message: () => `Expected element to be OGS clickable but it wasn't: ${error}`,
            };
        }
    },
});
