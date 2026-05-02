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

async function waitForKibitzReady(page: Page) {
    await expect(page.locator(".Kibitz")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".KibitzRoomStage-boards")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".board-panel.main-board")).toBeVisible({ timeout: 15000 });
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface"),
    ).toBeVisible({ timeout: 15000 });
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface .Goban").first(),
    ).toBeVisible({ timeout: 15000 });
}

async function waitForStableRect(page: Page, selector: string, timeout = 5000) {
    await page.waitForFunction(
        ({ targetSelector }) => {
            const element = document.querySelector(targetSelector);
            if (!element) {
                return false;
            }

            const rect = element.getBoundingClientRect();
            const current = {
                top: Math.round(rect.top),
                left: Math.round(rect.left),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            };

            const key = `__kibitz_stable_rect_${targetSelector}`;
            const store = window as unknown as Record<string, unknown>;
            const previous = store[key] as typeof current | undefined;
            store[key] = current;

            return (
                previous != null &&
                previous.top === current.top &&
                previous.left === current.left &&
                previous.width === current.width &&
                previous.height === current.height &&
                current.width > 0 &&
                current.height > 0
            );
        },
        { targetSelector: selector },
        { timeout },
    );
}

async function waitForKibitzLayoutStable(page: Page) {
    await waitForStableRect(page, ".KibitzRoomStage-boards");
    await waitForStableRect(page, ".board-panel.main-board .board-fit-slot");
}

async function waitForCompareLayoutStable(page: Page) {
    await waitForKibitzLayoutStable(page);
    await waitForStableRect(page, ".board-panel.secondary-board .board-fit-slot");
}

async function openKibitzMobileCreateRoomPreview(page: Page) {
    await page.setViewportSize({ width: 390, height: 844 });
    await load(page, "/kibitz/user-fea5dced");
    await expect(page.locator(".Kibitz")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "Open room drawer" }).click();
    await page
        .locator(".KibitzRoomList-createButton")
        .first()
        .evaluate((element) => {
            (element as HTMLButtonElement).click();
        });
    await expect(page.locator(".KibitzGamePickerOverlay-mobileHeader")).toBeVisible({
        timeout: 15000,
    });

    await page.getByRole("button", { name: "Game ID" }).click();
    await page.locator("#kibitz-game-picker-input-mobile").fill("12459");
    await page.getByRole("button", { name: "Load" }).click();

    await expect(page.locator(".KibitzGamePickerOverlay-mobilePreviewStep")).toBeVisible({
        timeout: 15000,
    });
}

async function waitForCompareMode(page: Page) {
    const stageBoards = page.locator(".KibitzRoomStage-boards").first();
    await expect(stageBoards).toHaveClass(/secondary-pane-equal/, { timeout: 5000 });
    await expect(page.locator(".board-panel.secondary-board")).toBeVisible({ timeout: 5000 });
    await waitForCompareLayoutStable(page);
}

async function clickUntilCompareMode(page: Page) {
    const stageBoards = page.locator(".KibitzRoomStage-boards").first();

    if ((await stageBoards.getAttribute("class"))?.includes("secondary-pane-equal")) {
        await waitForCompareMode(page);
        return;
    }

    const compareButton = page.locator(".KibitzDividerHandle .divider-mode-button.compare-view");
    if (await compareButton.count()) {
        await compareButton.first().click({ force: true });
        await waitForCompareMode(page);
        return;
    }

    const increaseButton = page.locator(".KibitzDividerHandle .divider-arrow.increase");

    for (let i = 0; i < 4; i++) {
        if ((await stageBoards.getAttribute("class"))?.includes("secondary-pane-equal")) {
            await waitForCompareMode(page);
            return;
        }

        if (!(await increaseButton.count())) {
            break;
        }

        await increaseButton.first().click({ force: true });
        await expect(stageBoards).toHaveClass(/secondary-pane-(small|equal)/, {
            timeout: 3000,
        });
    }

    await waitForCompareMode(page);
}

async function openFirstVariationOrCreateDraft(page: Page) {
    const variationTrigger = page
        .locator(
            ".KibitzVariationList .variation-recall, .KibitzVariationList .variation-item, .KibitzRoomStream .variation-post",
        )
        .first();

    if (await variationTrigger.count()) {
        await expect(variationTrigger).toBeVisible({ timeout: 15000 });
        await variationTrigger.scrollIntoViewIfNeeded();
        await variationTrigger.click({ force: true });
    } else {
        const createVariationButton = page
            .locator(
                ".board-panel .kibitz-create-variation-button, .secondary-board-empty-state .kibitz-create-variation-button",
            )
            .first();

        await expect(createVariationButton).toBeVisible({ timeout: 15000 });
        await createVariationButton.scrollIntoViewIfNeeded();
        await createVariationButton.click({ force: true });
    }

    await expect(page.locator(".board-panel.secondary-board")).toBeVisible({ timeout: 15000 });
    await waitForCompareLayoutStable(page);
}

async function measureMainTransportRow(page: Page) {
    return page.evaluate(() => {
        function rect(selector: string) {
            const element = document.querySelector(selector);
            if (!element) {
                return null;
            }

            const bounds = element.getBoundingClientRect();
            return {
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
                width: bounds.width,
                height: bounds.height,
            };
        }

        return {
            row: rect(".board-panel.main-board .main-board-transport-row"),
            liveAction: rect(".board-panel.main-board .main-board-return-live-action"),
            liveButton: rect(
                ".board-panel.main-board .main-board-return-live-action .kibitz-return-live-button",
            ),
            transportControls: rect(
                ".board-panel.main-board .main-board-transport-row .transport-controls",
            ),
            previousMoveButton: rect(
                '.board-panel.main-board .main-board-transport-row .transport-controls .kibitz-move-control[aria-label*="Previous move"]',
            ),
            nextMoveButton: rect(
                '.board-panel.main-board .main-board-transport-row .transport-controls .kibitz-move-control[aria-label*="Next move"]',
            ),
            newVariationAction: rect(".board-panel.main-board .main-board-new-variation-action"),
            newVariationButton: rect(
                ".board-panel.main-board .main-board-transport-row .create-variation-button",
            ),
        };
    });
}

async function invokeMainBoardController(page: Page, methodName: "previousMove" | "gotoLastMove") {
    await page.evaluate((requestedMethodName) => {
        const element = document.querySelector(".board-panel.main-board .main-board-transport-row");
        if (!element) {
            throw new Error("Missing Kibitz main transport row");
        }

        const fiberKey = Object.keys(element).find((key) => key.startsWith("__reactFiber$"));
        if (!fiberKey) {
            throw new Error("Missing Kibitz transport row fiber");
        }

        let fiber = (element as unknown as { [key: string]: unknown })[fiberKey] as
            | {
                  elementType?: { name?: string };
                  type?: { name?: string; displayName?: string };
                  memoizedState?: {
                      memoizedState?: unknown;
                      next?: unknown;
                  };
                  return?: unknown;
              }
            | undefined;

        while (fiber) {
            const name =
                fiber.elementType?.name || fiber.type?.name || fiber.type?.displayName || null;
            if (name === "KibitzRoomStage") {
                break;
            }
            fiber = fiber.return as typeof fiber | undefined;
        }

        if (!fiber) {
            throw new Error("Missing KibitzRoomStage fiber");
        }

        let hook = fiber.memoizedState;
        while (hook) {
            const state = hook.memoizedState as
                | {
                      previousMove?: () => void;
                      gotoLastMove?: () => void;
                  }
                | null
                | undefined;
            if (state && typeof state[requestedMethodName] === "function") {
                state[requestedMethodName]?.();
                return;
            }
            hook = hook.next as typeof hook | undefined;
        }

        throw new Error(`Missing main board controller method: ${requestedMethodName}`);
    }, methodName);
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
    await waitForKibitzReady(page);
    await waitForKibitzLayoutStable(page);

    if (options?.openVariation) {
        await openFirstVariationOrCreateDraft(page);
    }

    if (options?.equalMode) {
        await clickUntilCompareMode(page);
    }

    if (options?.equalMode) {
        await waitForCompareLayoutStable(page);
    }

    await waitForKibitzLayoutStable(page);

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
    await waitForKibitzReady(page);
    await waitForKibitzLayoutStable(page);

    const roomItems = page.locator(".KibitzRoomList-item");
    const roomItemCount = await roomItems.count();
    for (let index = 0; index < roomItemCount; index++) {
        const roomItem = roomItems.nth(index);
        await roomItem.scrollIntoViewIfNeeded();
        await roomItem.click({ force: true });
        await expect(roomItem).toHaveClass(/active/, { timeout: 10000 });
        await waitForKibitzReady(page);
        await waitForKibitzLayoutStable(page);
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
        await openFirstVariationOrCreateDraft(page);
        await clickUntilCompareMode(page);
    }

    if (!options?.openVariation) {
        await clickUntilCompareMode(page);
    }

    await waitForCompareLayoutStable(page);
    await waitForStableRect(page, ".kibitz-move-tree-container");

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

async function openKibitzEqualCompareMode(page: Page, route: string) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await load(page, route);
    await waitForKibitzReady(page);
    await waitForKibitzLayoutStable(page);
    await openFirstVariationOrCreateDraft(page);
    await clickUntilCompareMode(page);
    await expect(
        page.locator(".board-panel.main-board .KibitzBoard.main-board-surface"),
    ).toBeVisible({
        timeout: 15000,
    });
    await waitForCompareLayoutStable(page);
}

interface LayoutRect {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
}

interface MainCompareBoardLayout {
    mainBoardMeta: LayoutRect;
    boardFitSlot: LayoutRect;
    kibitzBoard?: LayoutRect;
    gobanContainer?: LayoutRect;
    goban?: LayoutRect;
    transportRow?: LayoutRect;
    secondaryBoardMeta?: LayoutRect;
    secondaryBoardFitSlot?: LayoutRect;
}

async function measureMainCompareBoardLayout(
    page: Page,
    options?: { includeSecondary?: boolean },
): Promise<MainCompareBoardLayout> {
    return page.evaluate((evaluateOptions) => {
        function rectOf(selector: string): LayoutRect {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Missing Kibitz layout element: ${selector}`);
            }

            const bounds = element.getBoundingClientRect();
            return {
                top: bounds.top,
                bottom: bounds.bottom,
                left: bounds.left,
                right: bounds.right,
                width: bounds.width,
                height: bounds.height,
            };
        }

        const result: MainCompareBoardLayout = {
            mainBoardMeta: rectOf(".board-panel.main-board .board-meta"),
            boardFitSlot: rectOf(".board-panel.main-board .board-fit-slot"),
            kibitzBoard: rectOf(".board-panel.main-board .KibitzBoard.main-board-surface"),
            gobanContainer: rectOf(
                ".board-panel.main-board .KibitzBoard.main-board-surface .goban-container",
            ),
            goban: rectOf(".board-panel.main-board .KibitzBoard.main-board-surface .Goban .Goban"),
            transportRow: rectOf(".board-panel.main-board .main-board-transport-row"),
        };

        if (evaluateOptions?.includeSecondary) {
            result.secondaryBoardMeta = rectOf(".board-panel.secondary-board .board-meta");
            result.secondaryBoardFitSlot = rectOf(".board-panel.secondary-board .board-fit-slot");
        }

        return result;
    }, options);
}

async function measureKibitzLeftRailWidths(page: Page) {
    return page.evaluate(() => {
        function rect(selector: string) {
            const element = document.querySelector(selector);
            if (!element) {
                return null;
            }

            return element.getBoundingClientRect().width;
        }

        return {
            leftRail: rect(".Kibitz-left-rail"),
            roomList: rect(".KibitzRoomList"),
            roomListItems: Array.from(document.querySelectorAll(".KibitzRoomList-item")).map(
                (element) => element.getBoundingClientRect().width,
            ),
            presence: rect(".KibitzPresence"),
            presenceUsers: Array.from(
                document.querySelectorAll(".KibitzPresence .presence-user"),
            ).map((element) => element.getBoundingClientRect().width),
        };
    });
}

ogsTest.describe("@Kibitz layout regressions", () => {
    ogsTest("left compare board wrappers stay tight to the rendered goban", async ({ page }) => {
        await openKibitzEqualCompareMode(page, "/kibitz/user-fea5dced");

        const layout = await measureMainCompareBoardLayout(page);
        const wrapperTolerance = 4;
        const transportGapTolerance = 8;

        expect(layout.kibitzBoard!.width - layout.gobanContainer!.width).toBeLessThanOrEqual(
            wrapperTolerance,
        );
        expect(layout.kibitzBoard!.height - layout.gobanContainer!.height).toBeLessThanOrEqual(
            wrapperTolerance,
        );
        expect(layout.boardFitSlot.height - layout.gobanContainer!.height).toBeLessThanOrEqual(
            wrapperTolerance,
        );
        expect(layout.transportRow!.top - layout.gobanContainer!.bottom).toBeLessThanOrEqual(
            transportGapTolerance,
        );
        expect(layout.gobanContainer!.left - layout.kibitzBoard!.left).toBeLessThanOrEqual(2);
        expect(layout.kibitzBoard!.right - layout.gobanContainer!.right).toBeLessThanOrEqual(2);
        expect(layout.boardFitSlot.top).toBeGreaterThanOrEqual(layout.mainBoardMeta.bottom);
    });

    ogsTest("compare board meta rows finish before their board fit slots", async ({ page }) => {
        await openKibitzEqualCompareMode(page, "/kibitz/user-fea5dced");

        const layout = await measureMainCompareBoardLayout(page, { includeSecondary: true });

        expect(layout.boardFitSlot.top).toBeGreaterThanOrEqual(layout.mainBoardMeta.bottom);
        expect(layout.secondaryBoardFitSlot!.top).toBeGreaterThanOrEqual(
            layout.secondaryBoardMeta!.bottom,
        );
        await expect(
            page.locator(
                ".board-panel.main-board .main-board-transport-row .create-variation-button",
            ),
        ).toHaveCount(0);
        await expect(
            page.locator(".board-panel.secondary-board .board-actions .create-variation-button"),
        ).toBeVisible();
    });

    ogsTest(
        "left rail width keeps Kibitz room and presence lists inside the rail",
        async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await load(page, "/kibitz/user-fea5dced");
            await expect(page.locator(".Kibitz-left-rail")).toBeVisible({ timeout: 15000 });
            await expect(page.locator(".KibitzRoomList")).toBeVisible({ timeout: 15000 });
            await expect(page.locator(".KibitzPresence")).toBeVisible({ timeout: 15000 });
            await waitForStableRect(page, ".Kibitz-left-rail");

            const widths = await measureKibitzLeftRailWidths(page);

            expect(widths.leftRail).not.toBeNull();
            expect(widths.roomList).not.toBeNull();
            expect(widths.presence).not.toBeNull();

            const maxAllowedWidth = (widths.leftRail ?? 0) + 1;

            expect(widths.roomList!).toBeLessThanOrEqual(maxAllowedWidth);
            expect(widths.presence!).toBeLessThanOrEqual(maxAllowedWidth);

            for (const roomItemWidth of widths.roomListItems) {
                expect(roomItemWidth).toBeLessThanOrEqual(maxAllowedWidth);
            }

            for (const presenceUserWidth of widths.presenceUsers) {
                expect(presenceUserWidth).toBeLessThanOrEqual(maxAllowedWidth);
            }
        },
    );

    ogsTest(
        "mobile create-room preview keeps the header and fields laid out correctly",
        async ({ page }) => {
            await openKibitzMobileCreateRoomPreview(page);

            const title = page.locator(".KibitzGamePickerOverlay-mobileHeaderTitle");
            const badge = page.locator(".KibitzGamePickerOverlay-mobileHeaderStateBadge");
            const backButton = page.locator(".KibitzGamePickerOverlay-mobileBackButtonInline");
            const actions = page.locator(".KibitzGamePickerOverlay-mobileHeaderActions-preview");
            const createButton = page.locator(".KibitzGamePickerOverlay-mobileCreateButton");
            const gameNameRow = page.locator(".KibitzGamePickerOverlay-mobileGameNameRow");
            const gameNameLabel = gameNameRow.locator(".KibitzGamePickerOverlay-fieldLabel");
            const gameNameValue = page.locator(".KibitzGamePickerOverlay-mobileGameNameValue");
            const roomRow = page.locator(".KibitzGamePickerOverlay-mobileRoomNameRow");
            const roomLabel = roomRow.locator(".KibitzGamePickerOverlay-fieldLabel");
            const roomInput = roomRow.locator("input");
            const playerRows = page.locator(".KibitzGamePickerOverlay-playerRow");
            const separator = page.locator(".KibitzGamePickerOverlay-playerSeparator");

            await expect(title).toBeVisible();
            await expect(badge).toBeVisible();
            await expect(actions).toBeVisible();
            await expect(
                page.locator(".KibitzGamePickerOverlay-mobileHeaderStateBadge"),
            ).toHaveCount(1);
            await expect(createButton).toBeVisible();
            await expect(backButton).toBeVisible();
            await expect(gameNameRow).toBeVisible();
            await expect(gameNameLabel).toBeVisible();
            await expect(gameNameValue).toBeVisible();
            await expect(roomLabel).toBeVisible();
            await expect(roomInput).toBeVisible();
            await expect(playerRows).toHaveCount(2);
            await expect(separator).toHaveCount(1);
            await expect(page.locator(".KibitzGamePickerOverlay-mobileFooter")).toHaveCount(0);
            await expect(
                page.locator(".KibitzGamePickerOverlay-mobileHeaderTitlePreviewPrefix"),
            ).toHaveCount(0);
            await expect(
                page.locator(".KibitzGamePickerOverlay-mobileHeaderTitlePreviewGame"),
            ).toHaveCount(0);

            const bounds = await page.evaluate(() => {
                const rectOf = (selector: string) => {
                    const element = document.querySelector(selector);
                    if (!element) {
                        throw new Error(`Missing Kibitz preview element: ${selector}`);
                    }

                    const rect = element.getBoundingClientRect();
                    return {
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        width: rect.width,
                        height: rect.height,
                    };
                };

                return {
                    title: rectOf(".KibitzGamePickerOverlay-mobileHeaderTitle"),
                    actions: rectOf(".KibitzGamePickerOverlay-mobileHeaderActions-preview"),
                    badge: rectOf(".KibitzGamePickerOverlay-mobileHeaderStateBadge"),
                    backButton: rectOf(".KibitzGamePickerOverlay-mobileBackButtonInline"),
                    createButton: rectOf(".KibitzGamePickerOverlay-mobileCreateButton"),
                    gameNameRow: rectOf(".KibitzGamePickerOverlay-mobileGameNameRow"),
                    gameNameLabel: rectOf(
                        ".KibitzGamePickerOverlay-mobileGameNameRow .KibitzGamePickerOverlay-fieldLabel",
                    ),
                    gameNameValue: rectOf(".KibitzGamePickerOverlay-mobileGameNameValue"),
                    roomLabel: rectOf(
                        ".KibitzGamePickerOverlay-mobileRoomNameRow .KibitzGamePickerOverlay-fieldLabel",
                    ),
                    roomInput: rectOf(".KibitzGamePickerOverlay-mobileRoomNameRow input"),
                    blackRow: rectOf(".KibitzGamePickerOverlay-playerRow"),
                    whiteRow: rectOf(".KibitzGamePickerOverlay-playerRow:nth-of-type(2)"),
                    separator: rectOf(".KibitzGamePickerOverlay-playerSeparator"),
                };
            });

            expect(bounds.title.right).toBeLessThanOrEqual(bounds.actions.left + 1);
            expect(bounds.createButton.left).toBeGreaterThan(bounds.backButton.right);
            expect(bounds.createButton.right).toBeLessThan(bounds.badge.left + 1);
            expect(bounds.createButton.width).toBeGreaterThanOrEqual(112);
            expect(bounds.createButton.width).toBeLessThanOrEqual(144);
            expect(bounds.gameNameRow.top).toBeGreaterThan(bounds.createButton.bottom - 1);
            expect(bounds.gameNameLabel.top).toBeLessThanOrEqual(bounds.gameNameValue.top + 5);
            expect(bounds.gameNameValue.left).toBeGreaterThan(bounds.gameNameLabel.right - 1);
            expect(bounds.actions.left).toBeLessThan(bounds.createButton.left + 1);
            expect(bounds.actions.right).toBeGreaterThan(bounds.createButton.right - 1);
            expect(
                Math.abs(
                    (bounds.createButton.left + bounds.createButton.right) / 2 -
                        (bounds.actions.left + bounds.actions.right) / 2,
                ),
            ).toBeLessThanOrEqual(2);
            expect(Math.abs(bounds.roomLabel.top - bounds.roomInput.top)).toBeLessThanOrEqual(5);
            expect(bounds.roomInput.left).toBeGreaterThan(bounds.roomLabel.right - 1);
            expect(bounds.blackRow.right).toBeLessThan(bounds.separator.left + 1);
            expect(bounds.whiteRow.left).toBeGreaterThan(bounds.separator.right - 1);
        },
    );

    ogsTest(
        "@Visual main transport row keeps symmetry when Back to live appears",
        async ({ page }) => {
            await load(page, "/kibitz/user-fea5dced");
            await waitForKibitzReady(page);
            await waitForKibitzLayoutStable(page);

            const mainRow = page.locator(".board-panel.main-board .main-board-transport-row");
            await expect(mainRow).toBeVisible({ timeout: 15000 });

            const backToLiveButton = page.locator(
                ".board-panel.main-board .main-board-return-live-action .kibitz-return-live-button",
            );

            const noLive = await measureMainTransportRow(page);
            await waitForStableRect(page, ".board-panel.main-board .main-board-transport-row");
            await expect(mainRow).toHaveScreenshot("kibitz-main-transport-row-no-live.png", {
                animations: "disabled",
            });

            await invokeMainBoardController(page, "previousMove");
            await expect(backToLiveButton).toBeVisible({ timeout: 15000 });
            await waitForStableRect(page, ".board-panel.main-board .main-board-transport-row");

            const withLive = await measureMainTransportRow(page);
            await expect(mainRow).toHaveScreenshot("kibitz-main-transport-row-with-live.png", {
                animations: "disabled",
            });

            expect(
                Math.abs(withLive.transportControls!.left - noLive.transportControls!.left),
            ).toBeLessThanOrEqual(1);
            expect(
                Math.abs(withLive.transportControls!.right - noLive.transportControls!.right),
            ).toBeLessThanOrEqual(1);
            expect(
                Math.abs(
                    withLive.previousMoveButton!.left -
                        withLive.liveButton!.right -
                        (withLive.newVariationButton!.left - withLive.nextMoveButton!.right),
                ),
            ).toBeLessThanOrEqual(1);
            expect(
                Math.abs(
                    withLive.transportControls!.left -
                        withLive.liveButton!.right -
                        (withLive.newVariationButton!.left - withLive.transportControls!.right),
                ),
            ).toBeLessThanOrEqual(1);
            expect(
                Math.abs(
                    withLive.transportControls!.left -
                        withLive.liveAction!.right -
                        (withLive.newVariationAction!.left - withLive.transportControls!.right),
                ),
            ).toBeLessThanOrEqual(1);
        },
    );

    ogsTest(
        "@Visual secondary board transport row keeps Back to live aligned",
        async ({ page }) => {
            await openKibitzEqualCompareMode(page, "/kibitz/user-fea5dced");

            const variationTrigger = page
                .locator(
                    ".KibitzVariationList .variation-recall, .KibitzVariationList .variation-item",
                )
                .first();
            await expect(variationTrigger).toBeVisible({ timeout: 15000 });
            await variationTrigger.scrollIntoViewIfNeeded();
            await variationTrigger.click({ force: true });
            await waitForCompareLayoutStable(page);
            await waitForStableRect(
                page,
                ".board-panel.secondary-board .secondary-board-transport-row",
            );

            const backToLiveButton = page.locator(
                ".board-panel.secondary-board .secondary-board-return-live-action .kibitz-return-live-button",
            );
            const transportRow = page.locator(
                ".board-panel.secondary-board .secondary-board-transport-row",
            );

            await expect(backToLiveButton).toBeVisible({ timeout: 15000 });
            await expect(transportRow).toBeVisible({ timeout: 15000 });

            await expect(transportRow).toHaveScreenshot(
                "kibitz-secondary-transport-row-with-live-button.png",
                {
                    animations: "disabled",
                },
            );
        },
    );
});

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
