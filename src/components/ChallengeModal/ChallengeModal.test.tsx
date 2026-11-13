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
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChallengeModalBody } from "./ChallengeModal";
import { post } from "@/lib/requests";
import * as data from "@/lib/data";
import * as player_cache from "@/lib/player_cache";
import {
    ChallengeDetails,
    ChallengeModalProperties,
} from "@/components/ChallengeModal/ChallengeModal.types";
import { sanitizeChallengeDetails } from "./ChallengeModal.utils";
import { bots_list, Bot } from "@/lib/bots";

let mockPreferredSettings: unknown[] = [];
const mockDataValues = new Map<string, unknown>();

// Mock data module
jest.mock("@/lib/data", () => ({
    Replication: {
        NONE: 0x0,
        LOCAL_OVERWRITES_REMOTE: 0x1,
        REMOTE_OVERWRITES_LOCAL: 0x2,
        REMOTE_ONLY: 0x4,
    },
    get: (key: string, default_value: unknown) => {
        if (mockDataValues.has(key)) {
            return mockDataValues.get(key);
        }
        if (key === "user") {
            return { id: 123, ranking: 10 };
        }
        if (key === "challenge.challenge.live") {
            return {
                initialized: false,
                min_ranking: 5,
                max_ranking: 36,
                challenger_color: "automatic",
                rengo_auto_start: 0,
                game: {
                    name: "",
                    rules: "japanese",
                    ranked: true,
                    width: 19,
                    height: 19,
                    handicap: -1,
                    komi_auto: "automatic",
                    komi: 5.5,
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                },
            };
        }
        if (key === "challenge.bot") {
            return 1;
        }
        if (key === "challenge.restrict_rank") {
            return false;
        }
        if (key === "preferred-game-settings") {
            return mockPreferredSettings;
        }

        return default_value;
    },
    set: jest.fn((key: string, value: unknown) => mockDataValues.set(key, value)),
    remove: jest.fn(),
    setDefault: jest.fn(),
    watch: jest.fn(),
    unwatch: jest.fn(),
}));

jest.mock("@/lib/player_cache", () => ({
    lookup: jest.fn(() => ({ id: 456, username: "opponent", ui_class: "" })),
    fetch: jest.fn(() => Promise.resolve({ id: 456, username: "opponent" })),
}));

jest.mock("@/lib/requests", () => ({
    post: jest.fn(),
    del: jest.fn(),
    get: jest.fn(() =>
        Promise.resolve({
            user: { id: 123, ranking: 10, anonymous: false },
        }),
    ),
}));

jest.mock("@/components/ChallengeLinkButton", () => ({
    copyChallengeLinkURL: jest.fn(),
}));

jest.mock("@/lib/swal_config", () => ({
    alert: { fire: jest.fn(() => Promise.resolve({})), getConfirmButton: jest.fn() },
}));

jest.mock("@/lib/bots", () => ({
    bots_list: jest.fn(() => []),
    bot_count: jest.fn(() => 0),
    getAcceptableTimeSetting: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    _: (s: string) => s,
    pgettext: (c: string, s: string) => s,
    npgettext: (c: string, s: string, p: string, n: number) => (n === 1 ? s : p),
    llm_pgettext: (c: string, s: string) => s,
    interpolate: (s: string, params: any[]) => {
        let res = s;
        if (Array.isArray(params)) {
            for (const p of params) {
                res = res.replace("%s", p);
            }
        }
        if (typeof params === "object" && params !== null) {
            for (const [key, value] of Object.entries(params)) {
                res = res.replace(`{{${key}}}`, value);
            }
        }
        return res;
    },
    moment: {
        duration: () => ({
            humanize: () => "humanized duration",
        }),
    },
}));

jest.mock("@/lib/rank_utils", () => ({
    rankString: (r: number) => `Rank ${r}`,
    rankSelectorIndexToText: (rank: number) => String(rank),
    amateurRanks: () => [
        { rank: 5, label: "25 Kyu" },
        { rank: 36, label: "9 Dan+" },
    ],
}));

jest.mock("@/components/PlayerIcon", () => ({
    PlayerIcon: () => <div data-testid="player-icon" />,
}));

const defaultProps: ChallengeModalProperties = {
    mode: "player",
    initialState: null,
    config: {
        challenge: {
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "automatic",
            invite_only: false,
            game: {
                name: "Test Game",
                rules: "japanese",
                ranked: false,
                width: 19,
                height: 19,
                handicap: 0,
                komi_auto: "automatic",
                disable_analysis: false,
                initial_state: null,
                private: false,
                time_control: {
                    system: "byoyomi",
                    speed: "live",
                    main_time: 1200,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                },
            },
        },
        conf: {
            restrict_rank: false,
            selected_board_size: "19x19",
        },
        time_control: {
            system: "byoyomi",
            speed: "live",
            main_time: 1200,
            period_time: 30,
            periods: 5,
            pause_on_weekends: false,
        },
    },
};

const openProps = {
    ...defaultProps,
    mode: "open" as const,
    config: {
        ...defaultProps.config!,
        challenge: {
            ...defaultProps.config!.challenge,
            game: { ...defaultProps.config!.challenge.game, rengo: false, rengo_casual_mode: true },
        },
    },
};

const mockModal = {
    close: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
};

describe("ChallengeModalBody", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPreferredSettings = [];
        mockDataValues.clear();
    });

    it.each([false, true])("submits disable analysis = %s", async (disabled) => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...openProps} modal={mockModal} />);
        const analysis = screen.getByLabelText(/disable analysis/i);
        if (disabled) {
            await user.click(analysis);
        }
        expect(analysis).toHaveProperty("checked", disabled);
        await user.selectOptions(screen.getByLabelText(/board size/i), "9x9");
        expect(screen.getByLabelText(/board size/i)).toHaveValue("9x9");
        await user.click(screen.getByRole("button", { name: /create game/i }));
        expect(post).toHaveBeenCalledWith(
            "challenges",
            expect.objectContaining({
                game: expect.objectContaining({ width: 9, height: 9, disable_analysis: disabled }),
            }),
        );
    });

    it.each(["-1", "2", "0"])("submits and restores handicap %s", async (handicap) => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        const view = render(<ChallengeModalBody {...openProps} modal={mockModal} />);
        await user.selectOptions(
            document.querySelector<HTMLSelectElement>("#challenge-handicap")!,
            handicap,
        );
        expect(document.querySelector<HTMLSelectElement>("#challenge-handicap")!).toHaveValue(
            handicap,
        );
        await user.click(screen.getByRole("button", { name: /create game/i }));
        expect(post).toHaveBeenCalledWith(
            "challenges",
            expect.objectContaining({
                game: expect.objectContaining({
                    handicap: Number(handicap),
                    komi_auto: "automatic",
                    komi: undefined,
                }),
            }),
        );
        view.unmount();
        render(<ChallengeModalBody mode="open" modal={mockModal} />);
        expect(document.querySelector<HTMLSelectElement>("#challenge-handicap")!).toHaveValue(
            handicap,
        );
    });

    it.each([false, true])(
        "submits private invite = %s with compatible options",
        async (privateInvite) => {
            const user = userEvent.setup();
            jest.mocked(post).mockResolvedValueOnce({ id: 123 });
            render(<ChallengeModalBody {...openProps} modal={mockModal} />);
            expect(screen.queryByLabelText("Private")).not.toBeInTheDocument();
            await user.click(screen.getByLabelText("Invite-only"));
            await user.click(screen.getByLabelText("Private"));
            expect(screen.getByLabelText("Private")).toBeChecked();
            expect(screen.getByLabelText("Ranked")).toBeDisabled();
            expect(screen.getByLabelText("Ranked")).not.toBeChecked();
            expect(screen.getByLabelText("Rengo")).toBeDisabled();
            if (!privateInvite) {
                await user.click(screen.getByLabelText("Invite-only"));
                expect(screen.queryByLabelText("Private")).not.toBeInTheDocument();
                expect(screen.getByLabelText("Ranked")).toBeEnabled();
                expect(screen.getByLabelText("Rengo")).toBeEnabled();
            }
            await user.click(screen.getByRole("button", { name: /create game/i }));
            expect(post).toHaveBeenCalledWith(
                "challenges",
                expect.objectContaining({
                    invite_only: privateInvite,
                    game: expect.objectContaining({
                        private: privateInvite,
                        ranked: false,
                        rengo: false,
                    }),
                }),
            );
        },
    );

    it("validates rengo auto-start and submits casual rengo with simple time", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...openProps} modal={mockModal} />);
        await user.click(screen.getByLabelText("Rengo"));
        expect(screen.getByLabelText("Rengo")).toBeChecked();
        expect(screen.getByLabelText("Casual")).toBeChecked();
        expect(screen.getByLabelText("Ranked")).toBeDisabled();
        expect(screen.getByLabelText("Ranked")).not.toBeChecked();
        const threshold = screen.getByLabelText("Auto-start");
        const create = screen.getByRole("button", { name: /create game/i });
        expect(threshold.closest(".form-group")).not.toHaveClass("hide");
        await user.click(screen.getByLabelText("Casual"));
        expect(threshold.closest(".form-group")).toHaveClass("hide");
        await user.click(screen.getByLabelText("Casual"));
        for (const value of ["1", "2", "3", "0"]) {
            await user.clear(threshold);
            await user.type(threshold, value);
            expect(threshold).toHaveValue(value === "0" ? null : Number(value));
            expect(create).toHaveProperty("disabled", value === "1" || value === "2");
        }
        await user.click(create);
        expect(post).toHaveBeenCalledWith(
            "challenges",
            expect.objectContaining({
                rengo_auto_start: 0,
                game: expect.objectContaining({
                    rengo: true,
                    rengo_casual_mode: true,
                    ranked: false,
                    handicap: 0,
                    time_control: "simple",
                }),
            }),
        );
        await user.click(screen.getByLabelText("Rengo"));
        expect(screen.getByLabelText("Ranked")).toBeEnabled();
        await user.click(screen.getByLabelText("Ranked"));
        expect(screen.getByLabelText("Rengo")).toBeDisabled();
        expect(screen.getByText("Rengo is unavailable for ranked games.")).toBeInTheDocument();
    });

    it("explains why Rengo is unavailable and clears the note when Ranked is turned off", async () => {
        const user = userEvent.setup();
        render(
            <ChallengeModalBody
                {...openProps}
                config={{
                    ...openProps.config,
                    challenge: {
                        ...openProps.config.challenge,
                        game: { ...openProps.config.challenge.game, ranked: true, private: false },
                    },
                }}
                modal={mockModal}
            />,
        );
        const rengo = screen.getByLabelText("Rengo");
        expect(rengo).toBeDisabled();
        expect(rengo).toHaveAttribute("title", "Rengo is unavailable for ranked games.");
        expect(screen.getByText("Rengo is unavailable for ranked games.")).toBeInTheDocument();

        await user.click(screen.getByLabelText("Ranked"));
        expect(screen.getByLabelText("Rengo")).toBeEnabled();
        expect(
            screen.queryByText("Rengo is unavailable for ranked games."),
        ).not.toBeInTheDocument();
    });

    it("saves distinct rank preferences and restores the unrestricted request", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        const view = render(<ChallengeModalBody {...openProps} modal={mockModal} />);
        await user.click(screen.getByRole("button", { name: "Add current setting" }));
        await user.click(screen.getByLabelText(/restrict rank/i));
        await user.selectOptions(screen.getByLabelText(/minimum ranking/i), "5");
        await user.selectOptions(screen.getByLabelText(/maximum ranking/i), "36");
        expect(screen.getByLabelText(/minimum ranking/i)).toHaveValue("5");
        expect(screen.getByLabelText(/maximum ranking/i)).toHaveValue("36");
        await user.click(screen.getByRole("button", { name: "Add current setting" }));
        expect(data.set).toHaveBeenLastCalledWith(
            "preferred-game-settings",
            [
                expect.objectContaining({ min_ranking: -1000, max_ranking: 1000 }),
                expect.objectContaining({ min_ranking: 5, max_ranking: 36 }),
            ],
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
        view.unmount();
        render(<ChallengeModalBody {...openProps} modal={mockModal} />);
        const preferred = document.querySelector(".preferred-settings-container input");
        expect(preferred).not.toBeNull();
        await user.click(preferred as HTMLInputElement);
        await user.click(screen.getAllByRole("option")[0]);
        expect(screen.getByLabelText(/restrict rank/i)).not.toBeChecked();
        await user.click(screen.getByRole("button", { name: /create game/i }));
        expect(post).toHaveBeenCalledWith(
            "challenges",
            expect.objectContaining({
                min_ranking: -1000,
                max_ranking: 1000,
            }),
        );
    });

    it("renders game name input", () => {
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);
        const gameNameInput = screen.getByPlaceholderText("Game Name");
        expect(gameNameInput).toBeInTheDocument();
    });

    it("shows the game name at the start of preferred settings options", async () => {
        const user = userEvent.setup();
        mockPreferredSettings = [
            {
                initialized: false,
                min_ranking: -1000,
                max_ranking: 1000,
                challenger_color: "automatic",
                rengo_auto_start: 0,
                game: {
                    name: "Bot Practice 1",
                    rules: "japanese",
                    ranked: false,
                    width: 19,
                    height: 19,
                    handicap: 0,
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                },
            },
        ];

        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);

        await user.click(screen.getByText("Preferred settings (1)"));

        const options = Array.from(document.querySelectorAll(".ogs-react-select__option"));
        expect(options[0].textContent).toBe(
            "Bot Practice 1 | Unranked, 19x19, Japanese rules, 0 handicap",
        );
    });

    it("sorts named preferred settings before unnamed ones", async () => {
        const user = userEvent.setup();
        mockPreferredSettings = [
            {
                initialized: false,
                min_ranking: -1000,
                max_ranking: 1000,
                challenger_color: "automatic",
                rengo_auto_start: 0,
                game: {
                    name: "",
                    rules: "japanese",
                    ranked: false,
                    width: 19,
                    height: 19,
                    handicap: 0,
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                },
            },
            {
                initialized: false,
                min_ranking: -1000,
                max_ranking: 1000,
                challenger_color: "automatic",
                rengo_auto_start: 0,
                game: {
                    name: "Zebra",
                    rules: "japanese",
                    ranked: false,
                    width: 19,
                    height: 19,
                    handicap: 0,
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                },
            },
            {
                initialized: false,
                min_ranking: -1000,
                max_ranking: 1000,
                challenger_color: "automatic",
                rengo_auto_start: 0,
                game: {
                    name: "Alpha",
                    rules: "japanese",
                    ranked: false,
                    width: 19,
                    height: 19,
                    handicap: 0,
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                },
            },
        ];

        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);

        await user.click(screen.getByText("Preferred settings (3)"));

        const options = Array.from(document.querySelectorAll(".ogs-react-select__option"));
        expect(options[0].textContent).toContain("Alpha |");
        expect(options[1].textContent).toContain("Zebra |");
        expect(options[2].textContent).toBe("Unranked, 19x19, Japanese rules, 0 handicap");
    });

    it("saves the typed game name in preferred settings", async () => {
        const user = userEvent.setup();
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);

        const gameNameInput = screen.getByPlaceholderText("Game Name");
        await user.clear(gameNameInput);
        await user.type(gameNameInput, "My Custom Game");
        await user.click(screen.getByText("Add current setting"));

        const { set } = jest.requireMock("@/lib/data");
        const savedSettings = set.mock.calls.find(
            ([key]: string[]) => key === "preferred-game-settings",
        )?.[1] as ChallengeDetails[];
        expect(savedSettings[0].game.name).toBe("My Custom Game");
    });

    it("saves unnamed games without the default game name", async () => {
        const user = userEvent.setup();
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);

        const gameNameInput = screen.getByPlaceholderText("Game Name");
        await user.clear(gameNameInput);
        await user.click(screen.getByText("Add current setting"));

        const { set } = jest.requireMock("@/lib/data");
        const savedSettings = set.mock.calls.find(
            ([key]: string[]) => key === "preferred-game-settings",
        )?.[1] as ChallengeDetails[];
        expect(savedSettings[0].game.name).toBe("");
    });

    it("renders private checkbox", () => {
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);
        const privateCheckbox = screen.getByLabelText("Private");
        expect(privateCheckbox).toBeInTheDocument();
    });

    it("renders board size selection", () => {
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);
        const boardSizeSelect = screen.getByRole("combobox", { name: /board size/i });
        expect(boardSizeSelect).toBeInTheDocument();
    });

    it("renders challenger color selection", () => {
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);
        const colorSelect = screen.getByLabelText(/your color/i);
        expect(colorSelect).toBeInTheDocument();
        expect(colorSelect).toHaveValue("automatic");
    });

    it("renders rank restrictions when enabled", async () => {
        const openModeProps = {
            ...defaultProps,
            mode: "open",
            config: {
                ...defaultProps.config,
                conf: {
                    ...defaultProps.config?.conf,
                    restrict_rank: true,
                },
                challenge: {
                    ...defaultProps.config?.challenge,
                    min_ranking: 5,
                    max_ranking: 36,
                    challenger_color: "automatic",
                    invite_only: false,
                    game: {
                        name: "Test Game",
                        rules: "japanese",
                        ranked: false,
                        width: 19,
                        height: 19,
                        handicap: 0,
                        komi_auto: "automatic",
                        disable_analysis: false,
                        initial_state: null,
                        private: false,
                    },
                },
                time_control: {
                    system: "byoyomi",
                    speed: "live",
                    main_time: 1200,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                },
            },
        } as const;

        render(<ChallengeModalBody {...openModeProps} modal={mockModal} />);

        // Find the restrict rank checkbox
        const restrictRankCheckbox = screen.getByLabelText(/restrict rank/i);
        expect(restrictRankCheckbox).toBeInTheDocument();
        expect(restrictRankCheckbox).toBeChecked();

        // Check that the rank selection dropdowns are visible
        const minRankSelect = screen.getByLabelText(/minimum ranking/i);
        const maxRankSelect = screen.getByLabelText(/maximum ranking/i);

        expect(minRankSelect).toBeInTheDocument();
        expect(maxRankSelect).toBeInTheDocument();
    });

    it("creates an open challenge when submitted", async () => {
        const openModeProps = {
            ...defaultProps,
            mode: "open",
            config: {
                ...defaultProps.config,
                conf: {
                    ...defaultProps.config?.conf,
                    restrict_rank: false,
                    selected_board_size: "19x19",
                },
                challenge: {
                    ...defaultProps.config?.challenge,
                    min_ranking: 5,
                    max_ranking: 36,
                    challenger_color: "automatic",
                    invite_only: false,
                    game: {
                        name: "Test Game",
                        rules: "japanese",
                        ranked: false,
                        width: 19,
                        height: 19,
                        handicap: 0,
                        komi_auto: "automatic",
                        disable_analysis: false,
                        initial_state: null,
                        private: false,
                    },
                },
                time_control: {
                    system: "byoyomi",
                    speed: "live",
                    main_time: 1200,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                },
            },
        } as const;

        // Mock the post request
        (post as jest.Mock).mockResolvedValueOnce({ id: 123 });

        render(<ChallengeModalBody {...openModeProps} modal={mockModal} />);

        // Find and click the submit button
        const submitButton = screen.getByRole("button", { name: /create game/i });
        fireEvent.click(submitButton);

        // Verify the post request was made with the correct data
        expect(post).toHaveBeenCalledWith("challenges", {
            initialized: false,
            challenger_color: "automatic",
            invite_only: false,
            min_ranking: -1000,
            max_ranking: 1000,
            rengo_auto_start: 0,
            game: {
                name: "Test Game",
                rules: "japanese",
                ranked: false,
                width: 19,
                height: 19,
                handicap: 0,
                komi: undefined,
                komi_auto: "automatic",
                disable_analysis: false,
                initial_state: null,
                private: false,
                time_control: "byoyomi",
                time_control_parameters: {
                    system: "byoyomi",
                    speed: "live",
                    main_time: 1200,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                    time_control: "byoyomi",
                },
                pause_on_weekends: false,
                rengo: undefined,
                rengo_casual_mode: undefined,
            },
        });

        // Verify the modal was closed
        expect(mockModal.close).toHaveBeenCalled();
    });

    it("sends custom komi for a bot challenge", async () => {
        const { bot_count, getAcceptableTimeSetting } = jest.requireMock("@/lib/bots");
        (bots_list as jest.Mock).mockReturnValue([
            { id: 42, username: "TestBot", ranking: 20, config: {} as any },
        ]);
        bot_count.mockReturnValue(1);
        getAcceptableTimeSetting.mockReturnValue([{}, ""]);

        const botProps = {
            ...defaultProps,
            mode: "computer" as const,
            config: {
                ...defaultProps.config,
                conf: {
                    restrict_rank: false,
                    selected_board_size: "19x19",
                },
                challenge: {
                    ...defaultProps.config?.challenge,
                    min_ranking: 5,
                    max_ranking: 36,
                    challenger_color: "automatic",
                    invite_only: false,
                    game: {
                        name: "Bot Match",
                        rules: "japanese",
                        ranked: true,
                        width: 19,
                        height: 19,
                        handicap: 0,
                        komi_auto: "automatic",
                        disable_analysis: false,
                        initial_state: null,
                        private: false,
                    },
                },
                time_control: {
                    system: "byoyomi",
                    speed: "live",
                    main_time: 1200,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                },
            },
        } as const;

        (post as jest.Mock).mockResolvedValueOnce({ id: 999 });

        render(<ChallengeModalBody {...botProps} modal={mockModal} />);

        // Expand the custom settings panel.
        const customBtn = screen.getByRole("button", { name: /Show Custom Settings/i });
        fireEvent.click(customBtn);

        // Switch komi to custom.
        const komiSelect = document.getElementById("challenge-komi") as HTMLSelectElement;
        fireEvent.change(komiSelect, { target: { value: "custom" } });

        // Type 16.5 into the custom komi number input.
        const komiInput = document.querySelector(
            'input[type="number"][step="0.5"]',
        ) as HTMLInputElement;
        fireEvent.change(komiInput, { target: { value: "16.5" } });

        // Submit via the Play button.
        const playBtn = screen.getByRole("button", { name: /^Play$/ });
        fireEvent.click(playBtn);

        expect(post).toHaveBeenCalled();
        const [url, payload] = (post as jest.Mock).mock.calls[0];
        expect(url).toBe("players/42/challenge");
        expect(payload.game.ranked).toBe(false);
        expect(payload.game.komi_auto).toBe("custom");
        expect(payload.game.komi).toBe(16.5);
    });

    it("sanitizes legacy data", () => {
        const challengeDetails: any = {
            initialized: false,
            min_ranking: 20,
            max_ranking: 30,
            challenger_color: "automatic",
            rengo_auto_start: 0,
            game: {
                name: "test game 1",
                rules: "aga",
                ranked: false,
                width: 9,
                height: 9,
                handicap: "5",
                komi_auto: "automatic",
                disable_analysis: false,
                initial_state: undefined,
                private: false,
                rengo: false,
                rengo_casual_mode: false,
            },
        };
        expect(sanitizeChallengeDetails(challengeDetails).game.handicap).toBe(5);
        expect("komi" in sanitizeChallengeDetails(challengeDetails)).toBeFalsy();

        challengeDetails.game.komi = "4.5";
        expect(sanitizeChallengeDetails(challengeDetails).game.komi).toBe(4.5);
    });
});

describe("rematch saved settings", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (bots_list as jest.Mock).mockReturnValue([]);
        (player_cache.lookup as jest.Mock).mockReturnValue({
            id: 456,
            username: "opponent",
            ui_class: "",
        });
        mockPreferredSettings = [];
        mockDataValues.clear();
        mockDataValues.set("user", { id: 123, ranking: 10, anonymous: false });
        mockDataValues.set("challenge.restrict_rank", true);
        mockDataValues.set("challenge.challenge.live", {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "automatic",
            rengo_auto_start: 0,
            game: {
                name: "",
                rules: "japanese",
                ranked: true,
                width: 19,
                height: 19,
                handicap: -1,
                komi_auto: "automatic",
                disable_analysis: false,
                initial_state: null,
                private: false,
                rengo: false,
                rengo_casual_mode: true,
            },
        });
    });

    function rematchProps(
        color: "black" | "white" | "automatic",
        ranked = false,
    ): ChallengeModalProperties {
        return {
            ...defaultProps,
            mode: "player" as const,
            playerId: 456,
            persistColor: false,
            config: {
                ...defaultProps.config!,
                conf: {
                    ...defaultProps.config!.conf,
                    restrict_rank: false,
                },
                challenge: {
                    ...defaultProps.config!.challenge,
                    challenger_color: color,
                    game: {
                        ...defaultProps.config!.challenge.game,
                        ranked,
                        komi_auto: "custom",
                        komi: 0.5,
                    },
                },
            },
        };
    }

    it("sends the rematch as-is but does not replace saved custom game settings", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...rematchProps("black")} modal={mockModal} />);

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                challenger_color: "black",
                game: expect.objectContaining({ komi_auto: "custom", komi: 0.5, ranked: false }),
            }),
        );
        const savedKeys = jest.mocked(data.set).mock.calls.map((call) => call[0]);
        expect(savedKeys).not.toContain("challenge.challenge.live");
        expect(savedKeys).not.toContain("challenge.restrict_rank");
        expect(savedKeys).not.toContain("time_control.speed");
    });

    function standardBotRematch(): ChallengeModalProperties {
        const props = rematchProps("black", true);
        return {
            ...props,
            config: {
                ...props.config!,
                challenge: {
                    ...props.config!.challenge,
                    game: {
                        ...props.config!.challenge.game,
                        ranked: true,
                        width: 19,
                        height: 19,
                        handicap: 0,
                        komi_auto: "automatic",
                        private: false,
                    },
                },
            },
        };
    }

    it("a bot rematch with standard settings sends ranked: true and does not render the Ranked checkbox", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });

        render(<ChallengeModalBody {...standardBotRematch()} modal={mockModal} />);

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    ranked: true,
                    width: 19,
                    height: 19,
                    handicap: 0,
                    komi_auto: "automatic",
                    private: false,
                }),
            }),
        );
    });

    it("hides Ranked and keeps a custom-komi rematch unranked when the opponent is a bot", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });

        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    ranked: false,
                    komi_auto: "custom",
                    komi: 0.5,
                }),
            }),
        );
    });

    it("shows Ranked for a rematch against a person", () => {
        (bots_list as jest.Mock).mockReturnValue([{ id: 999, username: "OtherBot" }]);
        render(<ChallengeModalBody {...rematchProps("white", true)} modal={mockModal} />);

        expect(screen.getByLabelText("Ranked")).toBeEnabled();
        expect(screen.getByLabelText("Ranked")).toBeChecked();
    });

    it.each([
        ["ui_class", { id: 456, username: "OfflineBot", ui_class: "bot provisional" }],
        ["is_bot", { id: 456, username: "ProfileBot", is_bot: true }],
    ])(
        "hides Ranked when a cached opponent is a bot via %s and is not in the active list",
        async (_mark, player) => {
            const user = userEvent.setup();
            (bots_list as jest.Mock).mockReturnValue([]);
            (player_cache.lookup as jest.Mock).mockReturnValue(player);
            jest.mocked(post).mockResolvedValueOnce({ id: 123 });

            render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

            expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: /send challenge/i }));

            expect(post).toHaveBeenCalledWith(
                "players/456/challenge",
                expect.objectContaining({
                    game: expect.objectContaining({
                        ranked: false,
                        komi_auto: "custom",
                        komi: 0.5,
                    }),
                }),
            );
        },
    );

    it("hides Ranked and sends a ranked challenge for a normal preferred setting against a bot", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        mockPreferredSettings = [
            {
                initialized: false,
                min_ranking: -1000,
                max_ranking: 1000,
                challenger_color: "white",
                rengo_auto_start: 0,
                game: {
                    name: "Ranked template",
                    rules: "japanese",
                    ranked: true,
                    width: 13,
                    height: 13,
                    handicap: 0,
                    komi_auto: "automatic",
                    disable_analysis: false,
                    initial_state: null,
                    private: false,
                    rengo: false,
                    rengo_casual_mode: true,
                    time_control_parameters: {
                        system: "byoyomi",
                        speed: "live",
                        main_time: 1200,
                        period_time: 30,
                        periods: 5,
                        pause_on_weekends: false,
                    },
                },
            },
        ];

        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        expect(screen.getByRole("option", { name: "25x25" })).toBeEnabled();

        await user.click(screen.getByText("Preferred settings (1)"));
        await user.click(screen.getByText(/Ranked template/));

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        expect(screen.getByLabelText("Board Size")).toHaveValue("13x13");
        expect(screen.getByRole("option", { name: "25x25" })).toBeEnabled();
        expect(
            document.querySelector<HTMLOptionElement>("#challenge-handicap option[value='10']"),
        ).toBeEnabled();
        expect(
            document.querySelector<HTMLOptionElement>("#challenge-komi option[value='custom']"),
        ).toBeEnabled();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    ranked: true,
                    width: 13,
                    height: 13,
                    handicap: 0,
                    komi_auto: "automatic",
                    private: false,
                }),
            }),
        );
    });

    it("sends ranked: false when a bot challenge uses an unusual board size", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });

        render(<ChallengeModalBody {...standardBotRematch()} modal={mockModal} />);

        await user.selectOptions(screen.getByLabelText("Board Size"), "25x25");
        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    width: 25,
                    height: 25,
                    ranked: false,
                }),
            }),
        );
    });

    it("lets a bot challenge use a high handicap or private game without staying ranked", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });

        render(<ChallengeModalBody {...standardBotRematch()} modal={mockModal} />);

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        const handicap = document.querySelector<HTMLSelectElement>("#challenge-handicap")!;
        expect(handicap.querySelector("option[value='10']")).toBeEnabled();

        await user.selectOptions(handicap, "10");
        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ handicap: 10, ranked: false }),
            }),
        );
    });

    it("sends ranked: false for a private bot challenge and ranked: true after Private is cleared", async () => {
        const user = userEvent.setup();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "TestBot" }]);
        jest.mocked(post).mockResolvedValue({ id: 123 });

        render(<ChallengeModalBody {...standardBotRematch()} modal={mockModal} />);

        await user.click(screen.getByLabelText("Private"));
        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenLastCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ private: true, ranked: false }),
            }),
        );

        await user.click(screen.getByLabelText("Private"));
        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenLastCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ private: false, ranked: true }),
            }),
        );
    });

    type CachedOpponent = { id: number; username: string; ui_class?: string; is_bot?: boolean };

    function controlledOpponent(initial: CachedOpponent | null = null) {
        let cached: CachedOpponent | null = initial;
        const waiters: Array<{
            resolve: (player: CachedOpponent) => void;
            reject: (err: Error) => void;
        }> = [];
        (player_cache.lookup as jest.Mock).mockImplementation(() => cached);
        (player_cache.fetch as jest.Mock).mockImplementation(
            () =>
                new Promise((resolve, reject) => {
                    waiters.push({
                        resolve: (player) => {
                            cached = player;
                            resolve(player);
                        },
                        reject,
                    });
                }),
        );
        return {
            resolve(player: CachedOpponent) {
                const waiter = waiters.shift();
                if (!waiter) {
                    throw new Error("no player fetch is waiting");
                }
                waiter.resolve(player);
            },
            reject(err = new Error("network")) {
                const waiter = waiters.shift();
                if (!waiter) {
                    throw new Error("no player fetch is waiting");
                }
                waiter.reject(err);
            },
        };
    }

    it("disables Send Challenge while the opponent is still loading", () => {
        controlledOpponent();
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();
        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        expect(post).not.toHaveBeenCalled();
    });

    it("sends a ranked challenge after the loaded player is a bot with standard settings", async () => {
        const user = userEvent.setup();
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...standardBotRematch()} modal={mockModal} />);

        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();

        await act(async () => {
            opponent.resolve({ id: 456, username: "LateBot", ui_class: "bot" });
        });

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );
        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    ranked: true,
                    komi_auto: "automatic",
                    private: false,
                }),
            }),
        );
    });

    it("sends an unranked custom-komi challenge after the loaded player is a bot", async () => {
        const user = userEvent.setup();
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        await act(async () => {
            opponent.resolve({ id: 456, username: "LateBot", ui_class: "bot" });
        });

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );
        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked: false, komi_auto: "custom", komi: 0.5 }),
            }),
        );
    });

    it("keeps ranked after the loaded player is a human", async () => {
        const user = userEvent.setup();
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        await act(async () => {
            opponent.resolve({ id: 456, username: "LateHuman", ui_class: "" });
        });

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );
        expect(screen.getByLabelText("Ranked")).toBeChecked();

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked: true }),
            }),
        );
    });

    it.each([
        ["manual", false],
        ["automatic", true],
    ])("retries a %s challenge after the opponent lookup fails", async (_label, automatic) => {
        const user = userEvent.setup();
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(
            <ChallengeModalBody
                {...rematchProps("black", true)}
                autoCreate={automatic}
                modal={mockModal}
            />,
        );

        await act(async () => {
            opponent.reject(new Error("network"));
        });

        expect(await screen.findByText("Could not check this player.")).toBeInTheDocument();
        expect(post).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Retry" }));
        await act(async () => {
            opponent.resolve({ id: 456, username: "LateBot", ui_class: "bot" });
        });

        if (!automatic) {
            await waitFor(() =>
                expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
            );
            await user.click(screen.getByRole("button", { name: /send challenge/i }));
        }

        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked: false }),
            }),
        );
    });

    it("waits to auto-create until the opponent is known", async () => {
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(
            <ChallengeModalBody {...rematchProps("black", true)} autoCreate modal={mockModal} />,
        );

        await act(async () => {
            await Promise.resolve();
        });
        expect(post).not.toHaveBeenCalled();

        await act(async () => {
            opponent.resolve({ id: 456, username: "LateBot", ui_class: "bot provisional" });
        });

        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked: false }),
            }),
        );
    });

    it("auto-creates a known opponent only once", async () => {
        (bots_list as jest.Mock).mockReturnValue([]);
        (player_cache.lookup as jest.Mock).mockReturnValue({
            id: 456,
            username: "CachedBot",
            ui_class: "bot",
        });
        jest.mocked(post).mockResolvedValue({ id: 123 });

        render(
            <React.StrictMode>
                <ChallengeModalBody {...rematchProps("black", true)} autoCreate modal={mockModal} />
            </React.StrictMode>,
        );

        await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    });

    it.each([
        ["human", { id: 456, username: "Partial", is_bot: false }, true],
        ["bot", { id: 456, username: "Partial", ui_class: "bot" }, false],
    ])("fetches a partial cache entry and sends a %s challenge", async (_label, record, ranked) => {
        const user = userEvent.setup();
        const opponent = controlledOpponent({ id: 456, username: "Partial" });
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(player_cache.fetch).toHaveBeenCalledWith(456, ["ui_class"]);
        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();
        expect(post).not.toHaveBeenCalled();

        await act(async () => {
            opponent.resolve(record);
        });

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );
        if (ranked) {
            expect(screen.getByLabelText("Ranked")).toBeChecked();
        } else {
            expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        }

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked }),
            }),
        );
    });

    it("shows a lookup error when the loaded ui_class is unresolved", async () => {
        const opponent = controlledOpponent({ id: 456, username: "Partial" });
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        await act(async () => {
            opponent.resolve({ id: 456, username: "Partial", ui_class: "[ERROR]" });
        });

        expect(await screen.findByText("Could not check this player.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();
        expect(post).not.toHaveBeenCalled();
    });

    it("refetches an unresolved player on Retry and then enables Send", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        let cached: CachedOpponent | null = null;
        (player_cache.lookup as jest.Mock).mockImplementation(() => cached);
        (player_cache.fetch as jest.Mock).mockImplementation(
            (_id: number, _fields: string[], options?: { refresh?: boolean }) => {
                if (options?.refresh) {
                    cached = { id: 456, username: "Recovered", ui_class: "" };
                    return Promise.resolve(cached);
                }
                cached = { id: 456, username: "Partial", ui_class: "[ERROR]" };
                return Promise.resolve(cached);
            },
        );

        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(await screen.findByText("Could not check this player.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();

        await user.click(screen.getByRole("button", { name: "Retry" }));

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );
        expect(screen.queryByText("Could not check this player.")).not.toBeInTheDocument();
        expect(player_cache.fetch).toHaveBeenLastCalledWith(456, ["ui_class"], { refresh: true });

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ ranked: true }),
            }),
        );
    });

    it("loads the name of an active bot that is not cached yet", async () => {
        const opponent = controlledOpponent();
        (bots_list as jest.Mock).mockReturnValue([{ id: 456, username: "ListedBot" }]);
        render(<ChallengeModalBody {...rematchProps("black", true)} modal={mockModal} />);

        expect(screen.getByRole("heading")).toHaveTextContent("...");
        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled();

        await act(async () => {
            opponent.resolve({ id: 456, username: "ListedBot", ui_class: "bot" });
        });

        await waitFor(() => expect(screen.getByRole("heading")).toHaveTextContent("ListedBot"));
    });

    it("does not post after the dialog unmounts", async () => {
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        const view = render(
            <ChallengeModalBody {...rematchProps("black", true)} autoCreate modal={mockModal} />,
        );
        view.unmount();

        opponent.resolve({ id: 456, username: "LateBot", ui_class: "bot" });
        await act(async () => {
            await Promise.resolve();
            await new Promise((resolve) => setTimeout(resolve, 20));
        });

        expect(post).not.toHaveBeenCalled();
    });

    it("sends a fork but does not save its settings", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        const forkState = { komi: 0.5, moves: [], width: 19, height: 19, initial_player: "white" };
        render(
            <ChallengeModalBody
                mode="player"
                playerId={456}
                initialState={forkState}
                modal={mockModal}
            />,
        );

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({ initial_state: forkState, ranked: false }),
            }),
        );
        const savedKeys = jest.mocked(data.set).mock.calls.map((call) => call[0]);
        expect(savedKeys.filter((key) => /^(challenge|time_control)\./.test(key))).toEqual([]);
    });

    it("keeps a forked bot game unranked after komi is normalized and the opponent loads", async () => {
        const user = userEvent.setup();
        const opponent = controlledOpponent();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        const forkState = {
            komi: 0.5,
            moves: [],
            width: 19,
            height: 19,
            initial_player: "white",
        };

        render(
            <ChallengeModalBody
                mode="player"
                playerId={456}
                initialState={forkState}
                modal={mockModal}
            />,
        );

        expect(screen.queryByLabelText("Ranked")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send challenge/i })).toBeDisabled();

        await act(async () => {
            opponent.resolve({ id: 456, username: "ForkBot", ui_class: "bot" });
        });

        await waitFor(() =>
            expect(screen.getByRole("button", { name: /send challenge/i })).toBeEnabled(),
        );

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(post).toHaveBeenCalledWith(
            "players/456/challenge",
            expect.objectContaining({
                game: expect.objectContaining({
                    initial_state: forkState,
                    ranked: false,
                    width: 19,
                    height: 19,
                    handicap: -1,
                    komi_auto: "automatic",
                    private: false,
                }),
            }),
        );
    });
});

describe("direct challenge settings", () => {
    const storedGame = {
        name: "",
        rules: "japanese",
        ranked: true,
        width: 19,
        height: 19,
        handicap: -1,
        komi_auto: "automatic",
        komi: 5.5,
        disable_analysis: false,
        initial_state: null,
        private: false,
        rengo: false,
        rengo_casual_mode: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPreferredSettings = [];
        mockDataValues.clear();
    });

    it("saves a direct challenge apart from the custom game template", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(
            <ChallengeModalBody
                {...defaultProps}
                config={{
                    ...defaultProps.config!,
                    challenge: { ...defaultProps.config!.challenge, challenger_color: "black" },
                }}
                playerId={456}
                modal={mockModal}
            />,
        );

        await user.click(screen.getByRole("button", { name: /send challenge/i }));

        expect(data.set).toHaveBeenCalledWith(
            "challenge.player.details",
            expect.objectContaining({ challenger_color: "black" }),
        );
        expect(data.set).toHaveBeenCalledWith("challenge.player.restrict_rank", false);
        expect(data.set).toHaveBeenCalledWith(
            "challenge.player.time_control",
            expect.objectContaining({ speed: "live", system: "byoyomi" }),
        );
        expect(data.set).not.toHaveBeenCalledWith("challenge.challenge.live", expect.anything());
        expect(data.set).not.toHaveBeenCalledWith("challenge.restrict_rank", expect.anything());
        expect(data.set).not.toHaveBeenCalledWith("time_control.speed", expect.anything());
        expect(data.set).not.toHaveBeenCalledWith("time_control.system", expect.anything());
    });

    it("loads a direct challenge from its own saved color", () => {
        mockDataValues.set("challenge.player.details", {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "white",
            rengo_auto_start: 0,
            game: storedGame,
        });

        render(<ChallengeModalBody mode="player" playerId={456} modal={mockModal} />);

        expect(screen.getByLabelText("Your Color")).toHaveValue("white");
    });

    it("loads a direct challenge clock on its own and leaves the custom game clock", () => {
        mockDataValues.set("time_control.speed", "live");
        mockDataValues.set("time_control.system", "fischer");
        mockDataValues.set("challenge.player.time_control", {
            speed: "correspondence",
            system: "fischer",
            initial_time: 259200,
            time_increment: 86400,
            max_time: 604800,
            pause_on_weekends: true,
        });

        const { unmount } = render(
            <ChallengeModalBody mode="player" playerId={456} modal={mockModal} />,
        );
        expect(screen.getByLabelText("Game Speed")).toHaveValue("correspondence");
        unmount();

        render(<ChallengeModalBody mode="open" modal={mockModal} />);
        expect(screen.getByLabelText("Game Speed")).toHaveValue("live");
    });

    it("uses the custom game clock the first time a direct challenge is opened", () => {
        mockDataValues.set("time_control.speed", "live");
        mockDataValues.set("time_control.system", "fischer");

        render(<ChallengeModalBody mode="player" playerId={456} modal={mockModal} />);

        expect(screen.getByLabelText("Game Speed")).toHaveValue("live");
    });

    it("keeps the custom game on its own color", () => {
        mockDataValues.set("challenge.player.details", {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "white",
            rengo_auto_start: 0,
            game: storedGame,
        });
        mockDataValues.set("challenge.restrict_rank", true);

        render(<ChallengeModalBody mode="open" modal={mockModal} />);

        expect(screen.getByLabelText("Your Color")).toHaveValue("automatic");
        expect(screen.getByLabelText("Restrict Rank")).toBeChecked();
    });

    it("saves a custom game into the shared template", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody {...openProps} modal={mockModal} />);

        await user.click(screen.getByRole("button", { name: /create game/i }));

        expect(data.set).toHaveBeenCalledWith(
            "challenge.challenge.live",
            expect.objectContaining({ challenger_color: "automatic" }),
        );
        expect(data.set).not.toHaveBeenCalledWith("challenge.player.details", expect.anything());
    });
});

describe("computer challenge settings", () => {
    const storedGame = {
        name: "",
        rules: "japanese",
        ranked: true,
        width: 19,
        height: 19,
        handicap: 0,
        komi_auto: "automatic",
        komi: 5.5,
        disable_analysis: false,
        initial_state: null,
        private: false,
        rengo: false,
        rengo_casual_mode: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPreferredSettings = [];
        mockDataValues.clear();
        const { bot_count, getAcceptableTimeSetting } = jest.requireMock("@/lib/bots");
        (bots_list as jest.Mock).mockReturnValue([
            { id: 1, username: "TestBot", ranking: 20, config: {} as any },
        ]);
        bot_count.mockReturnValue(1);
        getAcceptableTimeSetting.mockReturnValue([{}, ""]);
    });

    function showComputerSettings() {
        fireEvent.click(screen.getByRole("button", { name: /Show Custom Settings/i }));
    }

    it("saves a computer game apart from the custom game template", async () => {
        const user = userEvent.setup();
        jest.mocked(post).mockResolvedValueOnce({ id: 123 });
        render(<ChallengeModalBody mode="computer" modal={mockModal} />);
        showComputerSettings();
        await user.selectOptions(screen.getByLabelText("Your Color"), "white");
        await user.selectOptions(screen.getByLabelText(/board size/i), "9x9");

        await user.click(screen.getByRole("button", { name: /^Play$/ }));

        expect(data.set).toHaveBeenCalledWith(
            "challenge.computer.details",
            expect.objectContaining({
                challenger_color: "white",
                game: expect.objectContaining({ width: 9, height: 9 }),
            }),
        );
        expect(data.set).toHaveBeenCalledWith(
            "challenge.computer.time_control",
            expect.objectContaining({ speed: expect.any(String) }),
        );
        const savedKeys = jest.mocked(data.set).mock.calls.map((call) => call[0]);
        expect(savedKeys).not.toContain("challenge.challenge.live");
        expect(savedKeys).not.toContain("challenge.restrict_rank");
        expect(savedKeys.filter((key) => key.startsWith("time_control."))).toEqual([]);
    });

    it("loads a computer game from its own saved settings", () => {
        mockDataValues.set("challenge.computer.details", {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "white",
            rengo_auto_start: 0,
            game: { ...storedGame, width: 13, height: 13 },
        });
        mockDataValues.set("challenge.computer.time_control", {
            speed: "blitz",
            system: "fischer",
            initial_time: 30,
            time_increment: 10,
            max_time: 60,
            pause_on_weekends: false,
        });

        const { unmount } = render(<ChallengeModalBody mode="computer" modal={mockModal} />);
        showComputerSettings();
        expect(screen.getByLabelText("Your Color")).toHaveValue("white");
        expect(screen.getByLabelText(/board size/i)).toHaveValue("13x13");
        expect(screen.getByLabelText("Game Speed")).toHaveValue("blitz");
        unmount();

        render(<ChallengeModalBody mode="open" modal={mockModal} />);
        expect(screen.getByLabelText("Your Color")).toHaveValue("automatic");
        expect(screen.getByLabelText(/board size/i)).toHaveValue("19x19");
    });

    it("uses the custom game settings the first time a computer game is opened", () => {
        mockDataValues.set("challenge.challenge.live", {
            initialized: false,
            min_ranking: 5,
            max_ranking: 36,
            challenger_color: "black",
            rengo_auto_start: 0,
            game: { ...storedGame, width: 13, height: 13 },
        });

        render(<ChallengeModalBody mode="computer" modal={mockModal} />);
        showComputerSettings();

        expect(screen.getByLabelText("Your Color")).toHaveValue("black");
        expect(screen.getByLabelText(/board size/i)).toHaveValue("13x13");
    });
});

describe("ChallengeModalBotFiltering", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const computerProps = {
        ...defaultProps,
        mode: "computer" as const,
    };

    function renderAndCheckBot(
        bot: Partial<Bot>,
        expectedCategory: string,
        unexpectedCategories: string[],
    ) {
        const { bot_count, getAcceptableTimeSetting } = jest.requireMock("@/lib/bots");
        (bots_list as jest.Mock).mockReturnValue([bot]);
        bot_count.mockReturnValue(1);
        getAcceptableTimeSetting.mockReturnValue([{}, ""]);

        render(<ChallengeModalBody {...computerProps} modal={mockModal} />);

        // Verify it is in the expected category
        const categoryElements = screen.getAllByRole("heading", { level: 1 });
        const expectedHeader = categoryElements.find((el) => el.textContent === expectedCategory);
        expect(expectedHeader).toBeInTheDocument();

        // The bot should be in the parent container of this header
        const categoryContainer = expectedHeader!.closest(".bot-category");
        expect(categoryContainer).toHaveTextContent(bot.username as string);

        // Verify it is NOT in unexpected categories
        for (const unexpectedCategory of unexpectedCategories) {
            const unexpectedHeader = categoryElements.find(
                (el) => el.textContent === unexpectedCategory,
            );
            if (unexpectedHeader) {
                const unexpectedContainer = unexpectedHeader.closest(".bot-category");
                expect(unexpectedContainer).not.toHaveTextContent(bot.username as string);
            }
        }
    }

    it("should show TopBeginnerBot10 in Beginner category", () => {
        // Rank 10.0 = 20.0k
        renderAndCheckBot(
            { id: 1, username: "TopBeginnerBot10", ranking: 10, config: {} as any },
            "Beginner",
            ["Intermediate", "Advanced"],
        );
    });

    it("should show BottomIntermediateBot10_1 in Intermediate category", () => {
        // Rank 10.1 = 19.9k
        renderAndCheckBot(
            { id: 2, username: "BottomIntermediateBot10_1", ranking: 10.1, config: {} as any },
            "Intermediate",
            ["Beginner", "Advanced"],
        );
    });

    it("should show TopIntermediateBot25 in Intermediate category", () => {
        // Rank 25.0 = 5.0k
        renderAndCheckBot(
            { id: 3, username: "TopIntermediateBot25", ranking: 25, config: {} as any },
            "Intermediate",
            ["Beginner", "Advanced"],
        );
    });

    it("should show BottomAdvancedBot25_1 in Advanced category", () => {
        // Rank 25.1 = 4.9k
        renderAndCheckBot(
            { id: 4, username: "BottomAdvancedBot25_1", ranking: 25.1, config: {} as any },
            "Advanced",
            ["Beginner", "Intermediate"],
        );
    });

    it("disables a bot that has no configuration", () => {
        const { bot_count, getAcceptableTimeSetting } = jest.requireMock("@/lib/bots");
        (bots_list as jest.Mock).mockReturnValue([
            { id: 6, username: "UnconfiguredBot", ranking: 20, config: { _config_version: 0 } },
        ]);
        bot_count.mockReturnValue(1);
        getAcceptableTimeSetting.mockReturnValue([
            { _config_version: 0 },
            "Bot has no configuration",
        ]);

        render(<ChallengeModalBody {...computerProps} modal={mockModal} />);

        const option = screen.getByText("UnconfiguredBot").closest(".bot-option");
        expect(option).toHaveClass("disabled");
        expect(option).toHaveTextContent("Bot has no configuration");
    });

    it("should show TopAdvancedBot99 in Advanced category", () => {
        // Rank 99.0 = Stronger than 9d
        renderAndCheckBot(
            { id: 5, username: "TopAdvancedBot99", ranking: 99, config: {} as any },
            "Advanced",
            ["Beginner", "Intermediate"],
        );
    });
});
