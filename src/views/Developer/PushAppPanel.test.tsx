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

import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import * as requests from "@/lib/requests";

import { PushStatus } from "./push_types";

let onStatus: (status: PushStatus) => void;

jest.mock("@/lib/requests", () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock("@/lib/misc", () => ({ errorAlerter: jest.fn() }));
jest.mock("./PushProviderPanel", () => ({
    PushProviderPanel: (props: { onStatus: (status: PushStatus) => void }) => {
        onStatus = props.onStatus;
        return null;
    },
}));

import { PushAppPanel } from "./PushAppPanel";

const SECRET = "generated-signing-secret";
const CREDENTIALS = { updated_at: "2026-11-02T00:00:00Z" } as PushStatus["webhook"];
const STATUS: PushStatus = {
    apns: null,
    fcm: null,
    webhook: null,
    devices: { apns: 0, fcm: 0, webhook: 0 },
    stats: {
        apns: { sent: 0, failed: 0 },
        fcm: { sent: 0, failed: 0 },
        webhook: { sent: 0, failed: 0 },
    },
    recent_errors: [],
};
const APP = { id: 1, name: "App", client_id: "client" } as React.ComponentProps<
    typeof PushAppPanel
>["app"];

async function renderWithSecret(): Promise<void> {
    (requests.get as jest.Mock).mockResolvedValue(STATUS);
    render(<PushAppPanel app={APP} />);
    await screen.findByText(/Recent errors/);
    act(() => onStatus({ ...STATUS, webhook: CREDENTIALS, signing_secret: SECRET }));
    expect(screen.getByText(SECRET)).toBeTruthy();
}

describe("PushAppPanel signing secret", () => {
    it("stays on screen after a response that has no new secret", async () => {
        await renderWithSecret();
        act(() => onStatus({ ...STATUS, webhook: CREDENTIALS }));
        expect(screen.getByText(SECRET)).toBeTruthy();
    });

    it("is replaced by a newly generated secret", async () => {
        await renderWithSecret();
        act(() => onStatus({ ...STATUS, webhook: CREDENTIALS, signing_secret: "rotated" }));
        expect(screen.queryByText(SECRET)).toBeNull();
        expect(screen.getByText("rotated")).toBeTruthy();
    });

    it("goes away when the webhook is removed", async () => {
        await renderWithSecret();
        act(() => onStatus(STATUS));
        expect(screen.queryByText(SECRET)).toBeNull();
    });
});
