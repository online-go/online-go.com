import { expect, type Page, type WebSocket } from "@playwright/test";
import { expectOGSClickableByName } from "./matchers";
import { actAndWaitForResponse } from "./requests";

/** Verify both persisted entry and chat presence, which live tournament starts require. */
export async function joinTournament(page: Page, username: string): Promise<void> {
    const id = new URL(page.url()).pathname.match(/^\/tournament\/(\d+)$/)?.[1];
    expect(id).toBeDefined();
    const join = await expectOGSClickableByName(page, /Join this tournament!/);
    await actAndWaitForResponse(
        page,
        { method: "POST", path: `/api/v1/tournaments/${id}/players` },
        () => join.click(),
    );
    const joined = new Set<WebSocket>();
    const cleanup: Array<() => void> = [];
    const observe = (socket: WebSocket) => {
        const onFrame = ({ payload }: { payload: string | Buffer }) => {
            let message: unknown;
            try {
                message = JSON.parse(payload.toString());
            } catch {
                return;
            }
            if (!Array.isArray(message) || message[0] !== "chat-join") {
                return;
            }
            const entry: unknown = message[1];
            if (
                typeof entry === "object" &&
                entry !== null &&
                "channel" in entry &&
                entry.channel === `tournament-${id}` &&
                "users" in entry &&
                Array.isArray(entry.users) &&
                entry.users.some(
                    (user: unknown) =>
                        typeof user === "object" &&
                        user !== null &&
                        "username" in user &&
                        user.username === username,
                )
            ) {
                joined.add(socket);
            }
        };
        const onClose = () => {
            joined.delete(socket);
        };
        socket.on("framereceived", onFrame);
        socket.on("close", onClose);
        cleanup.push(() => {
            socket.off("framereceived", onFrame);
            socket.off("close", onClose);
        });
    };
    page.on("websocket", observe);
    try {
        await page.reload();
        await expect(page.getByRole("button", { name: /Drop out from tournament/ })).toBeVisible();
        await expect
            .poll(() => joined.size, {
                message: `${username} must be present in tournament chat before starting`,
            })
            .toBeGreaterThan(0);
    } finally {
        page.off("websocket", observe);
        cleanup.forEach((remove) => remove());
    }
}

/** Preserve the director's live subscription and verify each join before starting. */
export async function expectTournamentPlayers(page: Page, usernames: string[]): Promise<void> {
    await expect(page.locator(".player-count")).toHaveText(
        `Number of players: ${usernames.length}`,
    );
    for (const username of usernames) {
        await expect(page.getByText(username, { exact: true })).toBeVisible();
    }
}
