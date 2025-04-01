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
import { JGOFTimeControl, JGOFTimeControlSpeed } from "goban";

import { post } from "@/lib/requests";
import { ChallengeModalProperties } from "@/components/ChallengeModal/ChallengeModal.types";

// Mock preferences first to prevent data.setDefault error
jest.mock("@/lib/preferences", () => ({
    get: jest.fn(() => false),
    set: jest.fn(),
    defaults: {},
}));

// Mock misc module to prevent potential infinite recursion in dup implementation
jest.mock("@/lib/misc", () => ({
    dup: (obj: any) => structuredClone(obj),
}));

// Mock TimeControl/util
const mockTimeSettings: JGOFTimeControl = {
    system: "fischer",
    speed: "correspondence",
    initial_time: 600,
    time_increment: 10,
    max_time: 600,
    pause_on_weekends: true,
};

jest.mock("@/components/TimeControl/util", () => ({
    getDefaultTimeSettings: () => mockTimeSettings,
    getTimeControlFromPreset: () => mockTimeSettings,
    timeControlSystemText: (system: string) => {
        switch (system) {
            case "fischer":
                return "Fischer";
            case "simple":
                return "Simple";
            case "byoyomi":
                return "Byo-Yomi";
            case "canadian":
                return "Canadian";
            case "absolute":
                return "Absolute";
            case "none":
                return "None";
            default:
                return "[unknown]";
        }
    },
    getTimeOptions: (speed: string, system: string, property: string) => {
        type TimeOption = { time: number; label: string };
        type TimeOptions = {
            [key: string]: {
                [key: string]: {
                    [key: string]: TimeOption[];
                };
            };
        };
        const options: TimeOptions = {
            live: {
                fischer: {
                    initial_time: [
                        { time: 300, label: "5 minutes" },
                        { time: 600, label: "10 minutes" },
                    ],
                    time_increment: [
                        { time: 5, label: "5 seconds" },
                        { time: 10, label: "10 seconds" },
                    ],
                    max_time: [
                        { time: 600, label: "10 minutes" },
                        { time: 900, label: "15 minutes" },
                    ],
                },
            },
        };
        return options[speed]?.[system]?.[property] || [];
    },
}));

// Mock TimeControl/TimeControlUpdates
jest.mock("@/components/TimeControl/TimeControlUpdates", () => ({
    updateProperty: jest.fn(),
    updateSpeed: jest.fn(),
    updateSystem: jest.fn(),
    recallTimeControlSettings: jest.fn(),
    saveTimeControlSettings: jest.fn(),
}));

// Mock data module
jest.mock("@/lib/data", () => ({
    get: (key: string) => {
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
        return null;
    },
    set: jest.fn(),
    remove: jest.fn(),
    setDefault: jest.fn(),
    watch: jest.fn(),
    unwatch: jest.fn(),
}));

interface TimeControlPickerProps {
    timeControl: JGOFTimeControl;
    onChange: (timeControl: JGOFTimeControl) => void;
    forceSystem?: boolean;
}

jest.mock("@/components/TimeControl", () => ({
    TimeControlPicker: ({ timeControl, onChange }: TimeControlPickerProps) => (
        <div data-testid="time-control-picker">
            <div className="form-group">
                <label>Game Speed</label>
                <select
                    data-testid="game-speed"
                    value={timeControl?.speed || "correspondence"}
                    onChange={(e) => {
                        const newSpeed = e.target.value as JGOFTimeControlSpeed;
                        const newTimeControl = {
                            ...timeControl,
                            speed: newSpeed,
                        };
                        onChange(newTimeControl as JGOFTimeControl);
                    }}
                >
                    <option value="correspondence">Correspondence</option>
                </select>
            </div>
            <div className="form-group">
                <label>Time Control</label>
                <select
                    data-testid="time-control-system"
                    value={timeControl?.system || "fischer"}
                    onChange={(e) => {
                        const newSystem = e.target.value as "fischer";
                        const newTimeControl = {
                            ...timeControl,
                            system: newSystem,
                        };
                        onChange(newTimeControl as JGOFTimeControl);
                    }}
                >
                    <option value="fischer">Fischer</option>
                </select>
            </div>
            {timeControl?.system === "fischer" && (
                <>
                    <div className="form-group">
                        <label>Initial Time (seconds)</label>
                        <input
                            type="number"
                            data-testid="initial-time"
                            value={timeControl?.initial_time || 600}
                            onChange={(e) => {
                                const newTimeControl = {
                                    ...timeControl,
                                    initial_time: parseInt(e.target.value),
                                };
                                onChange(newTimeControl as JGOFTimeControl);
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Time Increment (seconds)</label>
                        <input
                            type="number"
                            data-testid="time-increment"
                            value={timeControl?.time_increment || 10}
                            onChange={(e) => {
                                const newTimeControl = {
                                    ...timeControl,
                                    time_increment: parseInt(e.target.value),
                                };
                                onChange(newTimeControl as JGOFTimeControl);
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    ),
    isLiveGame: jest.fn().mockReturnValue(true),
    timeControlSystemText: jest.fn().mockReturnValue("Fischer"),
    shortShortTimeControl: jest.fn().mockReturnValue("5m+5s"),
}));

jest.mock("@/lib/requests", () => ({
    post: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
}));

// Mock bots module
jest.mock("@/lib/bots", () => ({
    bots_list: () => [
        {
            id: 1,
            username: "Test Bot",
            rank: 10,
            accepts_ranked: true,
            accepts_private: true,
            description: "A test bot",
            icon: "test-icon",
            bot_apikey: "test-key",
            bot_owner: 1,
            bot: true,
            ui_class: "test",
            settings: {},
        },
    ],
    one_bot: jest.fn(),
    bot_count: jest.fn(),
    getAcceptableTimeSetting: jest.fn().mockReturnValue([{ _config_version: 1 }, null]),
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

    it.skip("renders AI player options when in computer mode", () => {
        const computerModeProps = {
            ...defaultProps,
            mode: "computer",
            initialState: {
                ...defaultProps.initialState,
                challenge: {
                    ...defaultProps.initialState.challenge,
                    game: {
                        ...defaultProps.initialState.challenge.game,
                        width: 19,
                        height: 19,
                        rules: "japanese",
                        ranked: false,
                        handicap: 0,
                        komi: 6.5,
                        disable_analysis: false,
                        speed: "live",
                    },
                },
                time_control: {
                    system: "byoyomi",
                    speed: "live",
                    time_control: 300,
                    period_time: 30,
                    periods: 5,
                    pause_on_weekends: false,
                },
            },
        } as const;
        render(<ChallengeModalBody {...computerModeProps} modal={mockModal} />);

        const noBotsMessage = screen.getByText(
            "No bots available that can play with the selected settings",
        );
        expect(noBotsMessage).toBeInTheDocument();
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
});
