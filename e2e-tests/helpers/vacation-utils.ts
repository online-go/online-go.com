import { expect, type Page } from "@playwright/test";
import { expectOGSClickableByName } from "./matchers";
import { actAndWaitForResponse } from "./requests";

/** Load the account's vacation controls before inspecting either possible state. */
async function openVacationSettings(page: Page) {
    await page.goto("/settings/vacation");
    const controls = page.locator(".vacation-container");
    await expect(
        controls.getByRole("button", { name: /^(Go on vacation|End vacation)$/ }),
    ).toBeVisible();
    return controls;
}

/** Change vacation through the UI and confirm the persisted account state. */
export async function setVacation(page: Page, on: boolean): Promise<void> {
    await openVacationSettings(page);
    await changeVacation(page, on);
}

async function changeVacation(page: Page, on: boolean): Promise<void> {
    const controls = page.locator(".vacation-container");
    const button = await expectOGSClickableByName(
        controls,
        on ? /^Go on vacation$/ : /^End vacation$/,
    );
    await actAndWaitForResponse(
        page,
        { method: on ? "PUT" : "DELETE", path: "/api/v1/me/vacation" },
        () => button.click(),
    );
    await expect(
        controls.getByRole("button", { name: on ? /^End vacation$/ : /^Go on vacation$/ }),
    ).toBeVisible();
    const settings = await page.request.get("/api/v1/me/settings");
    await expect(settings).toBeOK();
    const state: { profile: { on_vacation: boolean } } = await settings.json();
    expect(state.profile.on_vacation).toBe(on);
}

/** Establish the initial state of a reused fixture, including after an interrupted run. */
export async function ensureVacationOff(page: Page): Promise<void> {
    const controls = await openVacationSettings(page);
    if (await controls.getByRole("button", { name: /^End vacation$/ }).isVisible()) {
        await changeVacation(page, false);
    }
    await expect(controls.getByRole("button", { name: /^Go on vacation$/ })).toBeVisible();
}
