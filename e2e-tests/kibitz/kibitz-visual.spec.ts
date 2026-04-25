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

import { writeFileSync } from "fs";
import { expect, Page, TestInfo } from "@playwright/test";
import { ogsTest, load } from "@helpers";

function describeMeasurements(measurements: unknown) {
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
        openVariation?: boolean;
    },
) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await load(page, route);
    await page.waitForTimeout(1000);

    if (options?.openVariation) {
        const variationTrigger = page
            .locator(".KibitzRoomStream .variation-post, .KibitzVariationList .variation-item")
            .first();
        if (await variationTrigger.count()) {
            await variationTrigger.scrollIntoViewIfNeeded();
            await variationTrigger.click({ force: true });
            await page.waitForTimeout(250);
        }
    }

    if (options?.equalMode) {
        const increaseButton = page.locator(".KibitzDividerHandle .divider-arrow.increase");
        const stageBoards = page.locator(".KibitzRoomStage-boards");

        for (let i = 0; i < 4; i++) {
            const className = await stageBoards.first().getAttribute("class");
            if (className?.includes("secondary-pane-equal")) {
                break;
            }

            if (await increaseButton.count()) {
                await increaseButton.first().click({ force: true });
                await page.waitForTimeout(200);
            }
        }

        await expect(stageBoards.first()).toHaveClass(/secondary-pane-equal/);
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
            stageBoardsClass: document.querySelector(".KibitzRoomStage-boards")?.className ?? null,
            proposalBar: rect(".KibitzProposalBar"),
            stream: rect(".KibitzRoomStream"),
            footerPanels: rect(".Kibitz-footer-panels"),
        };
    });

    const boardDebug = await page.evaluate(() => {
        function buildRect(bounds: DOMRect) {
            return {
                top: Math.round(bounds.top),
                left: Math.round(bounds.left),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height),
                right: Math.round(bounds.right),
                bottom: Math.round(bounds.bottom),
            };
        }

        function buildStyle(style: CSSStyleDeclaration) {
            return {
                display: style.display,
                position: style.position,
                width: style.width,
                height: style.height,
                minWidth: style.minWidth,
                minHeight: style.minHeight,
                maxWidth: style.maxWidth,
                maxHeight: style.maxHeight,
                flex: style.flex,
                flexBasis: style.flexBasis,
                alignSelf: style.alignSelf,
                justifySelf: style.justifySelf,
                aspectRatio: style.aspectRatio,
                overflow: style.overflow,
                overflowX: style.overflowX,
                overflowY: style.overflowY,
                gridTemplateRows: style.gridTemplateRows,
                gridTemplateColumns: style.gridTemplateColumns,
                gridRow: style.gridRow,
                gridColumn: style.gridColumn,
                paddingTop: style.paddingTop,
                paddingBottom: style.paddingBottom,
                marginTop: style.marginTop,
                marginBottom: style.marginBottom,
                boxSizing: style.boxSizing,
            };
        }

        function rectOf(element: Element | null) {
            if (!element) {
                return null;
            }
            return buildRect(element.getBoundingClientRect());
        }

        function styleOf(element: Element | null) {
            if (!element) {
                return null;
            }
            return buildStyle(window.getComputedStyle(element));
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
                box: {
                    clientWidth: htmlElement.clientWidth,
                    clientHeight: htmlElement.clientHeight,
                    offsetWidth: htmlElement.offsetWidth,
                    offsetHeight: htmlElement.offsetHeight,
                    scrollWidth: htmlElement.scrollWidth,
                    scrollHeight: htmlElement.scrollHeight,
                },
                style: styleOf(element),
                childCount: element.children.length,
            };
        }

        function describeParents(element: Element | null, depth: number = 6) {
            const parents: unknown[] = [];
            let current = element?.parentElement ?? null;

            for (let i = 0; i < depth && current; i++) {
                parents.push({
                    tag: current.tagName.toLowerCase(),
                    className: current.className,
                    rect: rectOf(current),
                    box: {
                        clientWidth: current.clientWidth,
                        clientHeight: current.clientHeight,
                        offsetWidth: current.offsetWidth,
                        offsetHeight: current.offsetHeight,
                        scrollWidth: current.scrollWidth,
                        scrollHeight: current.scrollHeight,
                    },
                    style: styleOf(current),
                    inlineStyle: current.getAttribute("style"),
                });
                current = current.parentElement;
            }

            return parents;
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

        const mainBoardContent = document.querySelector(".board-panel.main-board .board-content");
        const secondaryBoardContent = document.querySelector(
            ".board-panel.secondary-board .board-content",
        );
        const mainBoardMeta = document.querySelector(".board-panel.main-board .board-meta");
        const secondaryBoardMeta = document.querySelector(
            ".board-panel.secondary-board .board-meta",
        );
        const mainBoardControls = document.querySelector(
            ".board-panel.main-board .KibitzBoardControls",
        );
        const secondaryBoardControls = document.querySelector(
            ".board-panel.secondary-board .KibitzBoardControls",
        );
        const kibitzBoard = document.querySelector(".KibitzBoard.main-board-surface");
        const gobanContainer = document.querySelector(
            ".KibitzBoard.main-board-surface .goban-container",
        );
        const goban = document.querySelector(".KibitzBoard.main-board-surface .Goban");
        const secondaryKibitzBoard = document.querySelector(".KibitzBoard.secondary-board-surface");
        const secondaryGobanContainer = document.querySelector(
            ".KibitzBoard.secondary-board-surface .goban-container",
        );
        const secondaryGoban = document.querySelector(
            ".KibitzBoard.secondary-board-surface .Goban",
        );

        return {
            mainBoardContent: describeElement(mainBoardContent),
            secondaryBoardContent: describeElement(secondaryBoardContent),
            mainBoardMeta: describeElement(mainBoardMeta),
            secondaryBoardMeta: describeElement(secondaryBoardMeta),
            mainBoardControls: describeElement(mainBoardControls),
            secondaryBoardControls: describeElement(secondaryBoardControls),
            kibitzBoard: describeElement(kibitzBoard),
            gobanContainer: describeElement(gobanContainer),
            goban: describeElement(goban),
            secondaryKibitzBoard: describeElement(secondaryKibitzBoard),
            secondaryGobanContainer: describeElement(secondaryGobanContainer),
            secondaryGoban: describeElement(secondaryGoban),
            mainBoardParents: describeParents(kibitzBoard),
            mainGobanContainerParents: describeParents(gobanContainer),
            secondaryBoardParents: describeParents(secondaryKibitzBoard),
            secondaryGobanContainerParents: describeParents(secondaryGobanContainer),
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

async function captureKibitzRowSizing(
    page: Page,
    route: string,
    testInfo: TestInfo,
    options?: {
        openVariation?: boolean;
    },
) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await load(page, route);
    await page.waitForTimeout(1000);

    const roomItems = page.locator(".KibitzRoomList-item");
    const roomItemCount = await roomItems.count();
    for (let index = 0; index < roomItemCount; index++) {
        const roomItem = roomItems.nth(index);
        await roomItem.scrollIntoViewIfNeeded();
        await roomItem.click({ force: true });
        await page.waitForTimeout(600);
        const variationCount = await page
            .locator(
                ".KibitzVariationList .variation-recall, .KibitzVariationList .variation-item, .KibitzRoomStream .variation-post",
            )
            .count();
        if (variationCount > 0) {
            break;
        }
    }

    if (options?.openVariation) {
        const variationTrigger = page
            .locator(
                ".KibitzVariationList .variation-recall, .KibitzVariationList .variation-item, .KibitzRoomStream .variation-post",
            )
            .first();
        if (await variationTrigger.count()) {
            await expect(variationTrigger).toBeVisible({ timeout: 15000 });
            await variationTrigger.scrollIntoViewIfNeeded();
            await variationTrigger.click({ force: true });
            await page.waitForTimeout(400);
        } else {
            const createVariationButton = page
                .locator(
                    ".board-panel .kibitz-create-variation-button, .secondary-board-empty-state .kibitz-create-variation-button",
                )
                .first();
            await expect(createVariationButton).toBeVisible({ timeout: 15000 });
            await createVariationButton.scrollIntoViewIfNeeded();
            await createVariationButton.click({ force: true });
            await page.waitForTimeout(400);
        }

        const stageBoards = page.locator(".KibitzRoomStage-boards");
        const viewModeButton = page.locator(
            ".KibitzDividerHandle .divider-mode-button.compare-view",
        );
        const stageClassAfterOpen = await stageBoards.first().getAttribute("class");
        if (
            !stageClassAfterOpen?.includes("secondary-pane-equal") &&
            (await viewModeButton.count())
        ) {
            await viewModeButton.first().click({ force: true });
            await page.waitForTimeout(400);
        }
    }

    const increaseButton = page.locator(".KibitzDividerHandle .divider-arrow.increase");
    const stageBoards = page.locator(".KibitzRoomStage-boards");

    for (let i = 0; i < 4; i++) {
        const className = await stageBoards.first().getAttribute("class");
        if (className?.includes("secondary-pane-equal")) {
            break;
        }

        if (await increaseButton.count()) {
            await increaseButton.first().click({ force: true });
            await page.waitForTimeout(200);
        }
    }

    await expect(stageBoards.first()).toHaveClass(/secondary-pane-equal/);
    await page.waitForTimeout(500);

    const rowData = await page.evaluate(() => {
        function describeRect(element: Element | null) {
            if (!element) {
                return null;
            }

            const bounds = element.getBoundingClientRect();
            return {
                top: Math.round(bounds.top),
                bottom: Math.round(bounds.bottom),
                left: Math.round(bounds.left),
                right: Math.round(bounds.right),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height),
            };
        }

        function describeStyle(element: Element | null) {
            if (!element) {
                return null;
            }

            const style = window.getComputedStyle(element);
            return {
                display: style.display,
                position: style.position,
                height: style.height,
                minHeight: style.minHeight,
                maxHeight: style.maxHeight,
                gridTemplateRows: style.gridTemplateRows,
                gridAutoRows: style.gridAutoRows,
                alignContent: style.alignContent,
                rowGap: style.rowGap,
                paddingTop: style.paddingTop,
                paddingBottom: style.paddingBottom,
                overflow: style.overflow,
            };
        }

        function describeChild(element: Element | null) {
            if (!element) {
                return null;
            }

            const htmlElement = element as HTMLElement;
            return {
                className: htmlElement.className,
                rect: describeRect(element),
                style: describeStyle(element),
            };
        }

        function collectMatchedRules(element: Element | null, selectorFragment: string) {
            if (!element) {
                return [];
            }

            const matchedRules: Array<{
                selectorText: string;
                alignSelf: string;
                height: string;
                minHeight: string;
                width: string;
                overflow: string;
            }> = [];

            for (const styleSheet of Array.from(document.styleSheets)) {
                let rules: CSSRuleList;
                try {
                    rules = styleSheet.cssRules;
                } catch {
                    continue;
                }

                for (const rule of Array.from(rules)) {
                    if (!(rule instanceof CSSStyleRule)) {
                        continue;
                    }

                    if (!rule.selectorText.includes(selectorFragment)) {
                        continue;
                    }

                    if (!element.matches(rule.selectorText)) {
                        continue;
                    }

                    const style = rule.style;
                    matchedRules.push({
                        selectorText: rule.selectorText,
                        alignSelf: style.alignSelf,
                        height: style.height,
                        minHeight: style.minHeight,
                        width: style.width,
                        overflow: style.overflow,
                    });
                }
            }

            return matchedRules;
        }

        const secondaryBoardContent = document.querySelector(
            ".board-panel.secondary-board .board-content",
        );
        const secondaryBoardPanel = document.querySelector(".board-panel.secondary-board");
        const boardFitSlot = document.querySelector(".board-panel.secondary-board .board-fit-slot");
        const transportRow = document.querySelector(".secondary-board-transport-row");
        const analyzeRow = document.querySelector(".secondary-board-analyze-row");
        const nodeTextRow = document.querySelector(".secondary-board-node-text-row");
        const composeRow = document.querySelector(".secondary-board-compose-row");
        const moveTreeContainer = document.querySelector(".kibitz-move-tree-container");
        const moveTreeCanvas = document.querySelector(
            "#kibitz-secondary-move-tree-container canvas",
        );

        return {
            secondaryBoardPanel: {
                rect: describeRect(secondaryBoardPanel),
                style: describeStyle(secondaryBoardPanel),
            },
            secondaryBoardContent: {
                rect: describeRect(secondaryBoardContent),
                style: describeStyle(secondaryBoardContent),
                children: Array.from(secondaryBoardContent?.children ?? []).map((child) =>
                    describeChild(child),
                ),
            },
            boardFitSlot: {
                rect: describeRect(boardFitSlot),
                style: describeStyle(boardFitSlot),
            },
            transportRow: {
                rect: describeRect(transportRow),
                style: describeStyle(transportRow),
            },
            analyzeRow: {
                rect: describeRect(analyzeRow),
                style: describeStyle(analyzeRow),
            },
            nodeTextRow: {
                rect: describeRect(nodeTextRow),
                style: describeStyle(nodeTextRow),
            },
            composeRow: {
                rect: describeRect(composeRow),
                style: describeStyle(composeRow),
            },
            moveTreeContainer: {
                rect: describeRect(moveTreeContainer),
                style: describeStyle(moveTreeContainer),
            },
            moveTreeCanvas: {
                rect: describeRect(moveTreeCanvas),
                style: describeStyle(moveTreeCanvas),
            },
            moveTreeMatchedRules: collectMatchedRules(
                moveTreeContainer,
                "kibitz-move-tree-container",
            ),
        };
    });

    const screenshotPath = testInfo.outputPath("kibitz-row-sizing.png");
    const rowSizingPath = testInfo.outputPath("kibitz-row-sizing.json");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    writeFileSync(rowSizingPath, JSON.stringify(rowData, null, 2), "utf8");
    await testInfo.attach("kibitz-row-sizing.png", {
        path: screenshotPath,
        contentType: "image/png",
    });
    await testInfo.attach("kibitz-row-sizing.json", {
        path: rowSizingPath,
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
        "Kibitz tournament demo small layout captures and measurements",
        async ({ page }, testInfo) => {
            await captureKibitzLayout(
                page,
                "/kibitz/tournament-pick?demo-kibitz=1",
                "kibitz-tournament-demo-1080p-small.png",
                testInfo,
            );
        },
    );

    ogsTest(
        "Kibitz top 19x19 demo default layout captures and measurements",
        async ({ page }, testInfo) => {
            await captureKibitzLayout(
                page,
                "/kibitz/top-19x19?demo-kibitz=1",
                "kibitz-top-19x19-demo-1080p-default.png",
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
                "kibitz-top-19x19-demo-1080p-equal.png",
                testInfo,
                { equalMode: true, openVariation: true },
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

    ogsTest("Kibitz equal layout row sizing diagnostics", async ({ page }, testInfo) => {
        await captureKibitzRowSizing(page, "/kibitz/user-fea5dced", testInfo, {
            openVariation: true,
        });
    });
});
