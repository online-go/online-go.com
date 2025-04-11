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

import { Page } from "@playwright/test";

export const clickInTheMiddle = async (page: Page) => {
    // Wait for the Goban to be visible
    const goban = page.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // Get the bounding box of the Goban
    const box = await goban.boundingBox();
    if (!box) {
        throw new Error("Could not get Goban dimensions");
    }

    // Calculate center point
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Click in the center of the Goban
    await page.mouse.click(centerX, centerY);
};
