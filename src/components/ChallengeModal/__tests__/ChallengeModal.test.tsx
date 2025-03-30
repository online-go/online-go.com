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
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChallengeModalBody } from "../ChallengeModal";
import * as data from "@/lib/data";

// Mock dependencies
jest.mock("@/lib/data", () => ({
    get: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    _: (str: string) => str,
    pgettext: (str: string) => str,
    interpolate: (str: string) => str,
}));

describe("ChallengeModalBody", () => {
    const mockModal = {
        close: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    };

    const defaultProps = {
        mode: "open" as const,
        modal: mockModal,
    };

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock data.get to return default values
        const mockDataGet = data.get as unknown as jest.Mock;
        mockDataGet.mockImplementation((key: string) => {
            const defaults: { [key: string]: any } = {
                user: { id: 1, username: "testuser" },
                "challenge.speed": "live",
                "challenge.challenge.live": {
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
                },
            };
            return defaults[key] || null;
        });
    });

    it("renders basic challenge modal in open mode", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        // Check for essential elements
        expect(screen.getByText("Custom Game")).toBeInTheDocument();
        expect(screen.getByText("Game Name")).toBeInTheDocument();
        expect(screen.getByText("Private")).toBeInTheDocument();
        expect(screen.getByText("Board Size")).toBeInTheDocument();
        expect(screen.getByText("Create Game")).toBeInTheDocument();
    });

    it("renders computer challenge mode", () => {
        render(<ChallengeModalBody {...defaultProps} mode="computer" />);

        expect(screen.getByText("Pick your computer opponent")).toBeInTheDocument();
        expect(screen.getByText("Show Custom Settings")).toBeInTheDocument();
    });

    it("renders player challenge mode", () => {
        const playerProps = {
            ...defaultProps,
            mode: "player" as const,
            playerId: 123,
        };

        render(<ChallengeModalBody {...playerProps} />);

        expect(screen.getByText("Send Challenge")).toBeInTheDocument();
    });

    it("toggles computer settings visibility", () => {
        render(<ChallengeModalBody {...defaultProps} mode="computer" />);

        const toggleButton = screen.getByText("Show Custom Settings");
        fireEvent.click(toggleButton);

        expect(screen.getByText("Hide Custom Settings")).toBeInTheDocument();
    });

    it("updates game name when input changes", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        const nameInput = screen.getByPlaceholderText("Game Name");
        fireEvent.change(nameInput, { target: { value: "Test Game" } });

        expect(nameInput).toHaveValue("Test Game");
    });

    it("toggles private game setting", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        const privateCheckbox = screen.getByLabelText("Private");
        fireEvent.click(privateCheckbox);

        expect(privateCheckbox).toBeChecked();
    });

    it("changes board size", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        const boardSizeSelect = screen.getByLabelText("Board Size");
        fireEvent.change(boardSizeSelect, { target: { value: "13x13" } });

        expect(boardSizeSelect).toHaveValue("13x13");
    });

    it("toggles ranked game setting", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        const rankedCheckbox = screen.getByLabelText("Ranked");
        fireEvent.click(rankedCheckbox);

        expect(rankedCheckbox).toBeChecked();
    });

    it("handles custom board size input", () => {
        render(<ChallengeModalBody {...defaultProps} />);

        // First select custom size
        const boardSizeSelect = screen.getByLabelText("Board Size");
        fireEvent.change(boardSizeSelect, { target: { value: "custom" } });

        // Then input custom dimensions
        const widthInput = screen.getByLabelText("Width");
        const heightInput = screen.getByLabelText("Height");

        fireEvent.change(widthInput, { target: { value: "15" } });
        fireEvent.change(heightInput, { target: { value: "15" } });

        expect(widthInput).toHaveValue(15);
        expect(heightInput).toHaveValue(15);
    });

    it("validates board size before creating challenge", async () => {
        render(<ChallengeModalBody {...defaultProps} />);

        // Set invalid board size
        const boardSizeSelect = screen.getByLabelText("Board Size");
        fireEvent.change(boardSizeSelect, { target: { value: "custom" } });

        const widthInput = screen.getByLabelText("Width");
        fireEvent.change(widthInput, { target: { value: "0" } });

        // Try to create challenge
        const createButton = screen.getByText("Create Game");
        fireEvent.click(createButton);

        // Should show error message
        await waitFor(() => {
            expect(
                screen.getByText("Invalid board size, please correct and try again"),
            ).toBeInTheDocument();
        });
    });
});
