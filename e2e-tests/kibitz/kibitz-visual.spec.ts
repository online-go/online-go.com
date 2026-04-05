/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect, Page, TestInfo } from "@playwright/test";
import { ogsTest, load } from "@helpers";

interface KibitzMeasurement {
    top: number;
    bottom: number;
    height: number;
}

function describeMeasurements(measurements: Record<string, KibitzMeasurement | null>) {
    return JSON.stringify(measurements, null, 2);
}

async function captureKibitzLayout(
    page: Page,
    route: string,
    screenshotName: string,
    testInfo: TestInfo,
) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await load(page, route);
    await page.waitForTimeout(1000);

    const measurements = await page.evaluate(() => {
        function rect(selector: string) {
            const element = document.querySelector(selector);
            if (!element) {
                return null;
            }
            const bounds = element.getBoundingClientRect();
            return {
                top: Math.round(bounds.top),
                bottom: Math.round(bounds.bottom),
                height: Math.round(bounds.height),
            };
        }

        return {
            kibitz: rect(".Kibitz"),
            leftRail: rect(".Kibitz-left-rail"),
            main: rect(".Kibitz-main"),
            sidebar: rect(".Kibitz-sidebar"),
            stage: rect(".KibitzRoomStage"),
            proposalBar: rect(".KibitzProposalBar"),
            stream: rect(".KibitzRoomStream"),
            footerPanels: rect(".Kibitz-footer-panels"),
        };
    });

    console.log(`Kibitz measurements for ${route}:`, describeMeasurements(measurements));

    await expect(page).toHaveScreenshot(screenshotName, {
        fullPage: true,
    });

    await testInfo.attach(`${screenshotName}-measurements`, {
        body: describeMeasurements(measurements),
        contentType: "application/json",
    });
}

ogsTest.describe("@Manual Kibitz visual inspection harness", () => {
    ogsTest.skip(
        !process.env.KIBITZ_VISUAL,
        "Set KIBITZ_VISUAL=1 to run the Kibitz visual harness.",
    );

    ogsTest(
        "Kibitz tournament demo layout captures and measurements",
        async ({ page }, testInfo) => {
            await captureKibitzLayout(
                page,
                "/kibitz/tournament-pick?demo-kibitz=1",
                "kibitz-tournament-demo-1080p.png",
                testInfo,
            );
        },
    );

    ogsTest(
        "Kibitz top 19x19 demo layout captures and measurements",
        async ({ page }, testInfo) => {
            await captureKibitzLayout(
                page,
                "/kibitz/top-19x19?demo-kibitz=1",
                "kibitz-top-19x19-demo-1080p.png",
                testInfo,
            );
        },
    );

    ogsTest("Kibitz top 9x9 demo layout captures and measurements", async ({ page }, testInfo) => {
        await captureKibitzLayout(
            page,
            "/kibitz/top-9x9?demo-kibitz=1",
            "kibitz-top-9x9-demo-1080p.png",
            testInfo,
        );
    });
});
