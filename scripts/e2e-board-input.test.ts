import type { Locator, Page } from "@playwright/test";
import { clickInTheMiddle, clickOnGobanIntersection } from "../e2e-tests/helpers/game-utils";

jest.mock("@playwright/test", () => ({ expect: jest.fn() }));
jest.mock("../e2e-tests/helpers/matchers", () => ({ expectOGSClickableByName: jest.fn() }));

/** Model Playwright waiting for a resize before it dispatches a pointer action. */
function resizingBoard() {
    let width = 400;
    const intersections: number[][] = [];
    const record = (x: number, y: number) => {
        const cell = width / 11;
        intersections.push([Math.floor(x / cell) - 1, Math.floor(y / cell) - 1]);
    };
    const board = {
        waitFor: async () => {},
        boundingBox: async () => ({ x: 0, y: 0, width, height: width }),
        click: async (options?: { trial?: boolean; position?: { x: number; y: number } }) => {
            width = 700;
            if (!options?.trial) {
                record(options?.position?.x ?? width / 2, options?.position?.y ?? width / 2);
            }
        },
    } as unknown as Locator;
    const page = {
        locator: () => board,
        mouse: {
            click: async (x: number, y: number) => {
                width = 700;
                record(x, y);
            },
        },
    } as unknown as Page;
    return { page, board, intersections };
}

test("a pending resize does not change the requested intersection or dispatch an extra click", async () => {
    const { page, intersections } = resizingBoard();
    await clickOnGobanIntersection(page, "H2", "9x9");
    expect(intersections).toEqual([[7, 7]]);
});

test("the scoped board receives the requested intersection after a resize", async () => {
    const { page } = resizingBoard();
    const { board, intersections } = resizingBoard();
    await clickOnGobanIntersection(page, "A9", "9x9", board);
    expect(intersections).toEqual([[0, 0]]);
});

test("a centre click follows the board through a resize", async () => {
    const { page, intersections } = resizingBoard();
    await clickInTheMiddle(page);
    expect(intersections).toEqual([[4, 4]]);
});
