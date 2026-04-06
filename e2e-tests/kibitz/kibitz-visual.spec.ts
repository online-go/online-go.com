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

import { Page, TestInfo } from "@playwright/test";
import { ogsTest, load } from "@helpers";

interface KibitzMeasurement {
    top: number;
    bottom: number;
    height: number;
}

function describeMeasurements(measurements: Record<string, KibitzMeasurement | null>) {
    return JSON.stringify(measurements, null, 2);
}

function describeDebugData(debugData: unknown) {
    return JSON.stringify(debugData, null, 2);
}

async function captureKibitzLayout(
    page: Page,
    route: string,
    screenshotName: string,
    testInfo: TestInfo,
    options?: {
        equalMode?: boolean;
    },
) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await load(page, route);
    await page.waitForTimeout(1000);

    if (options?.equalMode) {
        const increaseButton = page.locator(".KibitzDividerHandle .divider-arrow.increase");
        for (let i = 0; i < 2; i++) {
            if (await increaseButton.count()) {
                await increaseButton.first().click();
                await page.waitForTimeout(150);
            }
        }
    }

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

    const boardDebug = await page.evaluate(() => {
        function rectOf(element: Element | null) {
            if (!element) {
                return null;
            }
            const bounds = element.getBoundingClientRect();
            return {
                top: Math.round(bounds.top),
                left: Math.round(bounds.left),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height),
            };
        }

        function styleOf(element: Element | null) {
            if (!element) {
                return null;
            }
            const style = window.getComputedStyle(element);
            return {
                backgroundColor: style.backgroundColor,
                backgroundImage: style.backgroundImage,
                boxShadow: style.boxShadow,
                position: style.position,
                display: style.display,
                width: style.width,
                height: style.height,
            };
        }

        function describeElement(element: Element | null) {
            if (!element) {
                return null;
            }

            const htmlElement = element as HTMLElement;

            return {
                tag: element.tagName.toLowerCase(),
                className: htmlElement.className,
                rect: rectOf(element),
                style: styleOf(element),
                childCount: element.children.length,
            };
        }

        function describeChildren(element: Element | null) {
            if (!element) {
                return [];
            }

            return Array.from(element.children).map((child) => ({
                tag: child.tagName.toLowerCase(),
                className: (child as HTMLElement).className,
                rect: rectOf(child),
                style: styleOf(child),
                children: Array.from(child.children).map((grandchild) => ({
                    tag: grandchild.tagName.toLowerCase(),
                    className: (grandchild as HTMLElement).className,
                    rect: rectOf(grandchild),
                    style: styleOf(grandchild),
                })),
            }));
        }

        const kibitzBoard = document.querySelector(".KibitzBoard.main-board-surface");
        const gobanContainer = document.querySelector(
            ".KibitzBoard.main-board-surface .goban-container",
        );
        const goban = document.querySelector(".KibitzBoard.main-board-surface .Goban");

        return {
            kibitzBoard: describeElement(kibitzBoard),
            gobanContainer: describeElement(gobanContainer),
            goban: describeElement(goban),
            gobanChildren: describeChildren(goban),
        };
    });

    console.log(`Kibitz measurements for ${route}:`, describeMeasurements(measurements));
    console.log(`Kibitz board debug for ${route}:`, describeDebugData(boardDebug));

    const screenshotPath = testInfo.outputPath(screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await testInfo.attach(screenshotName, {
        path: screenshotPath,
        contentType: "image/png",
    });
    await testInfo.attach(`${screenshotName}-measurements`, {
        body: describeMeasurements(measurements),
        contentType: "application/json",
    });
    await testInfo.attach(`${screenshotName}-board-debug`, {
        body: describeDebugData(boardDebug),
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
                "kibitz-tournament-demo-1080p-equal.png",
                testInfo,
                { equalMode: true },
            );
        },
    );

    ogsTest(
        "Kibitz top 19x19 demo layout captures and measurements",
        async ({ page }, testInfo) => {
            await captureKibitzLayout(
                page,
                "/kibitz/top-19x19?demo-kibitz=1",
                "kibitz-top-19x19-demo-1080p-equal.png",
                testInfo,
                { equalMode: true },
            );
        },
    );

    ogsTest("Kibitz top 9x9 demo layout captures and measurements", async ({ page }, testInfo) => {
        await captureKibitzLayout(
            page,
            "/kibitz/top-9x9?demo-kibitz=1",
            "kibitz-top-9x9-demo-1080p-equal.png",
            testInfo,
            { equalMode: true },
        );
    });
});
