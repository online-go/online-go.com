import type { Page, Response } from "@playwright/test";

type ExpectedResponse = {
    method: "POST" | "PUT" | "PATCH" | "DELETE";
    path: string | RegExp;
};

/** Run one UI action and wait for its successful response to finish before continuing. */
export async function actAndWaitForResponse(
    page: Page,
    expected: ExpectedResponse,
    action: () => Promise<unknown>,
): Promise<Response> {
    const pending = page.waitForResponse(
        (response) => {
            const path = new URL(response.url()).pathname;
            return (
                response.request().method() === expected.method &&
                (typeof expected.path === "string"
                    ? path === expected.path
                    : path.match(expected.path) !== null)
            );
        },
        { timeout: 15000 },
    );
    const [response] = await Promise.all([pending, action()]);
    if (!response.ok()) {
        throw new Error(`${expected.method} ${expected.path} returned HTTP ${response.status()}`);
    }
    const error = await response.finished();
    if (error) {
        throw error;
    }
    return response;
}
