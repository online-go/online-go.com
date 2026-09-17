import type { Page, Response } from "@playwright/test";
import { actAndWaitForResponse } from "../e2e-tests/helpers/requests";

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

function fixture(status = 200) {
    const headers = deferred<Response>();
    const finished = deferred<Error | null>();
    const response = {
        ok: () => status >= 200 && status < 300,
        status: () => status,
        finished: jest.fn(() => finished.promise),
    } as unknown as Response;
    const waitForResponse = jest.fn(() => headers.promise);
    const page = { waitForResponse } as unknown as Page;
    const action = jest.fn(async () => {});
    return { page, response, headers, finished, waitForResponse, action };
}

test("an immediate click or closed dialog does not release the next action", async () => {
    const f = fixture();
    const nextAction = jest.fn();
    const pending = actAndWaitForResponse(
        f.page,
        { method: "POST", path: "/api/v1/ladders/1/players/challenge" },
        f.action,
    ).then(nextAction);
    await Promise.resolve();
    expect(f.action).toHaveBeenCalledTimes(1);
    expect(nextAction).not.toHaveBeenCalled();

    f.headers.resolve(f.response);
    await Promise.resolve();
    await Promise.resolve();
    expect(nextAction).not.toHaveBeenCalled();

    f.finished.resolve(null);
    await pending;
    expect(nextAction).toHaveBeenCalledTimes(1);
    expect(f.action).toHaveBeenCalledTimes(1);
});

test("arms the response listener before the action can send a request", async () => {
    const f = fixture();
    f.action.mockImplementation(async () => {
        expect(f.waitForResponse).toHaveBeenCalledTimes(1);
        f.headers.resolve(f.response);
        f.finished.resolve(null);
    });
    await actAndWaitForResponse(
        f.page,
        { method: "DELETE", path: "/api/v1/me/vacation" },
        f.action,
    );
});

test.each(["/api/v1/me/vacation", /^\/api\/v1\/me\/vacation$/])(
    "matches the method and endpoint, ignoring the origin and query: %s",
    async (path) => {
        const f = fixture();
        const pending = actAndWaitForResponse(f.page, { method: "DELETE", path }, f.action);
        const match = (
            f.waitForResponse.mock.calls[0] as unknown as [(response: Response) => boolean]
        )[0];
        const received = (method: string, url: string) =>
            ({ url: () => url, request: () => ({ method: () => method }) }) as Response;
        expect(match(received("DELETE", "http://localhost/api/v1/me/vacation?x=1"))).toBe(true);
        expect(match(received("PUT", "http://localhost/api/v1/me/vacation"))).toBe(false);
        expect(match(received("DELETE", "http://localhost/api/v1/me/vacation/other"))).toBe(false);
        f.headers.resolve(f.response);
        f.finished.resolve(null);
        await pending;
    },
);

test("fails on an HTTP error without repeating the write", async () => {
    const f = fixture(500);
    const pending = actAndWaitForResponse(
        f.page,
        { method: "PUT", path: "/api/v1/me/vacation" },
        f.action,
    );
    f.headers.resolve(f.response);
    await expect(pending).rejects.toThrow("returned HTTP 500");
    expect(f.action).toHaveBeenCalledTimes(1);
});

test("fails when the response stream fails after successful headers", async () => {
    const f = fixture();
    const pending = actAndWaitForResponse(
        f.page,
        { method: "PUT", path: "/api/v1/me/vacation" },
        f.action,
    );
    f.headers.resolve(f.response);
    f.finished.resolve(new Error("response interrupted"));
    await expect(pending).rejects.toThrow("response interrupted");
    expect(f.action).toHaveBeenCalledTimes(1);
});

test("does not repeat the action when the response times out", async () => {
    const f = fixture();
    const pending = actAndWaitForResponse(
        f.page,
        { method: "PUT", path: "/api/v1/me/vacation" },
        f.action,
    );
    f.headers.reject(new Error("response timeout"));
    await expect(pending).rejects.toThrow("response timeout");
    expect(f.action).toHaveBeenCalledTimes(1);
});
