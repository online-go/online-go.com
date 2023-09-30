import { AccountSettings } from "./AccountSettings";
import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import * as requests from "requests";
import * as ogs_hooks from "hooks";
import { OgsHelpProvider } from "OgsHelpProvider";

const BASE_PROPS = {
    state: { profile: { email: "" } },
    vacation_base_time: 0,
    refresh: () => () => {
        return;
    },
    updateSelfReportedAccountLinkages: () => {
        return;
    },
};

const TEST_USER = {
    username: "testuser",
    anonymous: false,
    id: 0,
    registration_date: "",
    ratings: undefined,
    country: "",
    professional: false,
    ranking: 0,
    provisional: 0,
    can_create_tournaments: false,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: false,
    supporter_level: 0,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: "",
    is_announcer: false,
} as const;

const BASE_API_RESPONSE = {
    username: "testuser",
    first_name: "",
    last_name: "",
    country: "",
    website: "",
    email: "",
    real_name_is_private: true,
    is_bot: false,
    password_is_set: true,
    email_validated: "2000-01-01T00:00:00.000000Z",
    social_auth_accounts: [],
};

describe("Verify email", () => {
    test("shows resend validation email if not verified", async () => {
        jest.spyOn(requests, "get").mockReturnValue(
            Promise.resolve({
                ...BASE_API_RESPONSE,
                email: "asdf@ogsmail.com",
                email_validated: undefined,
            }),
        );

        jest.spyOn(ogs_hooks, "useUser").mockReturnValue(TEST_USER);

        await act(async () => {
            render(
                <OgsHelpProvider>
                    <AccountSettings {...BASE_PROPS} />
                </OgsHelpProvider>,
            );
        });

        expect(screen.getByText("Resend validation email")).toBeDefined();
    });
});
