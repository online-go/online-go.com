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
import { render, screen, fireEvent } from "@testing-library/react";
import { ChallengeModalBody } from "./ChallengeModal";
import { post } from "@/lib/requests";
import { ChallengeModalProperties } from "@/components/ChallengeModal/ChallengeModal.types";
import { sanitizeChallengeDetails, sanitizeDemoSettings } from "./ChallengeModal.utils";

// Mock data module
jest.mock("@/lib/data", () => ({
    get: (key: string, default_value: unknown) => {
        if (key === "challenge.speed") {
            return "live";
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
            return [];
        }

        return default_value;
    },
    set: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
    watch: jest.fn(),
    unwatch: jest.fn(),
}));

jest.mock("@/lib/requests", () => ({
    post: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
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

const mockModal = {
    close: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
};

describe("ChallengeModalBody", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders game name input", () => {
        render(<ChallengeModalBody {...defaultProps} modal={mockModal} />);
        const gameNameInput = screen.getByPlaceholderText("Game Name");
        expect(gameNameInput).toBeInTheDocument();
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
                komi: null,
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

    it("sanitizes legacy data", () => {
        const demoSettings: any = {
            name: "test settings 1",
            rules: "aga",
            width: 19,
            height: 19,
            black_name: "p1",
            white_name: "p2",
            white_ranking: 1500,
            black_ranking: 1500,
            private: false,
            komi_auto: "custom",
        };
        expect("komi" in sanitizeDemoSettings(demoSettings)).toBeFalsy();
        demoSettings.komi = "6.5";
        expect(sanitizeDemoSettings(demoSettings).komi).toBe(6.5);

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
