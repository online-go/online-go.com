import type { APIResponse, Locator, Page, Response } from "@playwright/test";
import { dismissWarningDialogs } from "../e2e-tests/helpers/report-utils";
import { expectOGSClickableByName } from "../e2e-tests/helpers/matchers";

jest.mock("@playwright/test", () => ({
    expect: (value: unknown) => ({
        toBe: (expected: unknown) => expect(value).toBe(expected),
        toBeOK: () => expect((value as APIResponse).ok()).toBe(true),
        toBeVisible: () => expect((value as Locator).isVisible()).toBe(true),
        toBeEnabled: () => expect((value as Locator).isEnabled()).toBe(true),
    }),
}));
jest.mock("../e2e-tests/helpers/matchers", () => ({
    expectOGSClickableByName: jest.fn(),
}));

function warningQueue(count: number) {
    const warnings = Array.from({ length: count }, (_, id) => ({ id, severity: "warning" }));
    let accept: ((response: Response) => void) | undefined;
    const check = jest.fn();
    const dialog = {
        isVisible: () => warnings.length > 0,
        getByRole: () => ({ check }),
    };
    const button = {
        isEnabled: () => true,
        click: jest.fn(async () => {
            const warning = warnings.shift();
            expect(warning).toBeDefined();
            expect(accept).toBeDefined();
            accept!({
                url: () => `http://localhost/api/v1/me/warning/${warning!.id}`,
                request: () => ({ method: () => "PATCH" }),
                ok: () => true,
                status: () => 200,
            } as Response);
        }),
    };
    jest.mocked(expectOGSClickableByName).mockResolvedValue(button as unknown as Locator);
    const get = jest.fn(async () => ({ ok: () => true, json: async () => warnings[0] ?? {} }));
    const page = {
        request: { get },
        locator: () => dialog,
        waitForResponse: (predicate: (response: Response) => boolean) =>
            new Promise<Response>((resolve) => {
                accept = (response) => {
                    expect(predicate(response)).toBe(true);
                    resolve(response);
                };
            }),
    } as unknown as Page;
    return { page, warnings, get, check, click: button.click };
}

test.each([0, 1, 9, 10])(
    "dismisses all %i warnings and confirms the queue is empty",
    async (count) => {
        const { page, warnings, get, check, click } = warningQueue(count);

        await expect(dismissWarningDialogs(page)).resolves.toBeUndefined();

        expect(warnings).toHaveLength(0);
        expect(click).toHaveBeenCalledTimes(count);
        expect(check).toHaveBeenCalledTimes(count);
        expect(get).toHaveBeenCalledTimes(count + 1);
        expect(get).toHaveBeenLastCalledWith("/api/v1/me/warning");
    },
);

test("stops after ten dismissals when another warning remains", async () => {
    const { page, warnings, get, click } = warningQueue(11);

    await expect(dismissWarningDialogs(page)).rejects.toThrow(
        "Warning messages remain queued after ten dismissals",
    );

    expect(warnings).toEqual([{ id: 10, severity: "warning" }]);
    expect(click).toHaveBeenCalledTimes(10);
    expect(get).toHaveBeenCalledTimes(11);
});
