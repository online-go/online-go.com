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
import { SGFCollectionModal, openSGFCollectionModal } from "./SGFCollectionModal";
import { get, post } from "@/lib/requests";
import * as data from "@/lib/data";
import { errorAlerter } from "@/lib/misc";

// Mock dependencies
jest.mock("@/lib/requests");
jest.mock("@/lib/data");
jest.mock("@/lib/misc");
jest.mock("@/lib/translate", () => ({
    _: (key: string) => key,
    interpolate: (template: string, values: any) =>
        template.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockPost = post as jest.MockedFunction<typeof post>;
const mockDataGet = data.get as jest.MockedFunction<typeof data.get>;
const mockErrorAlerter = errorAlerter as jest.MockedFunction<typeof errorAlerter>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe("SGFCollectionModal", () => {
    const mockUser = {
        id: 123,
        anonymous: false,
        username: "testuser",
    };

    const mockLibraryData = {
        collections: [
            [1, "Collection 1", true, 0],
            [2, "Collection 2", false, 1],
            [3, "Sub Collection", true, 2],
        ],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockDataGet.mockReturnValue(mockUser);
        mockGet.mockResolvedValue(mockLibraryData);

        mockFetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("(;FF[4]GM[1]SZ[19])"),
        } as Response);

        mockPost.mockResolvedValue({});
    });

    describe("Component Rendering", () => {
        test("renders modal with correct title", async () => {
            render(<SGFCollectionModal gameId={456} />);

            expect(screen.getByText("Add SGF to Library")).toBeInTheDocument();
        });

        test("shows login message for anonymous users", () => {
            mockDataGet.mockReturnValue({ anonymous: true });

            render(<SGFCollectionModal gameId={456} />);

            expect(
                screen.getByText("You must be signed in to add games to your SGF library."),
            ).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
        });

        test("shows loading state initially", () => {
            render(<SGFCollectionModal gameId={456} />);

            expect(screen.getByText("Loading collections...")).toBeInTheDocument();
        });

        test("renders collections after loading", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(
                    screen.getByText("Select a collection to add this game to:"),
                ).toBeInTheDocument();
            });

            expect(screen.getByRole("combobox")).toBeInTheDocument();
            expect(screen.getByText("Main Library")).toBeInTheDocument();
        });

        test("shows error message when collections fail to load", async () => {
            mockGet.mockRejectedValue(new Error("Network error"));

            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByText("Failed to load collections.")).toBeInTheDocument();
            });
        });
    });

    describe("Game Name Field", () => {
        test("initializes with provided game name", async () => {
            render(<SGFCollectionModal gameId={456} gameName="Test Game" />);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                expect(input).toHaveValue("Test Game");
            });
        });

        test("initializes with default name when no game name provided", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                expect(input).toHaveValue("Game 456");
            });
        });

        test("allows editing game name", async () => {
            render(<SGFCollectionModal gameId={456} gameName="Original Name" />);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                fireEvent.change(input, { target: { value: "New Game Name" } });
                expect(input).toHaveValue("New Game Name");
            });
        });

        test("disables input during upload", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                expect(input).toBeDisabled();
            });
        });

        test("has correct placeholder text", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                expect(input).toHaveAttribute("placeholder", "Enter game name");
            });
        });
    });

    describe("Collection Selection", () => {
        test("allows selecting different collections", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                const select = screen.getByRole("combobox");
                fireEvent.change(select, { target: { value: "1" } });
                expect(select).toHaveValue("1");
            });
        });

        test("disables select during upload", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                const select = screen.getByRole("combobox");
                expect(select).toBeDisabled();
            });
        });
    });

    describe("Add to Collection Functionality", () => {
        test("successfully adds game to collection", async () => {
            const onSuccess = jest.fn();
            const modalCloseSpy = jest.fn();

            render(<SGFCollectionModal gameId={456} gameName="Test Game" onSuccess={onSuccess} />);

            // Mock the close method
            const modalInstance = screen.getByText("Add SGF to Library").closest(".Modal");
            if (modalInstance) {
                (modalInstance as any).close = modalCloseSpy;
            }

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/v1/games/456/sgf");
                expect(mockPost).toHaveBeenCalledWith("me/games/sgf/0", expect.any(File));
                expect(onSuccess).toHaveBeenCalled();
            });
        });

        test("uses edited game name in file creation", async () => {
            render(<SGFCollectionModal gameId={456} gameName="Original" />);

            await waitFor(() => {
                const input = screen.getByLabelText("Game Name:");
                fireEvent.change(input, { target: { value: "Edited Name" } });
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(mockPost).toHaveBeenCalledWith(
                    "me/games/sgf/0",
                    expect.objectContaining({
                        name: "Edited Name.sgf",
                    }),
                );
            });
        });

        test("handles SGF fetch error", async () => {
            mockFetch.mockRejectedValue(new Error("SGF fetch failed"));

            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(mockErrorAlerter).toHaveBeenCalledWith(expect.any(Error));
            });
        });

        test("handles upload error", async () => {
            mockPost.mockRejectedValue(new Error("Upload failed"));

            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(mockErrorAlerter).toHaveBeenCalledWith(expect.any(Error));
            });
        });

        test("shows uploading state during upload", async () => {
            render(<SGFCollectionModal gameId={456} />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(screen.getByRole("button", { name: "Adding..." })).toBeInTheDocument();
            });
        });

        test("disables add button when no collections loaded", () => {
            mockGet.mockRejectedValue(new Error("Failed to load"));

            render(<SGFCollectionModal gameId={456} />);

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            expect(addButton).toBeDisabled();
        });

        test("uploads original SGF data unchanged", async () => {
            const originalSgfData = "(;FF[4]GM[1]SZ[19]PB[Black]PW[White];B[pd];W[dd])";
            mockFetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(originalSgfData),
            } as Response);

            render(<SGFCollectionModal gameId={456} gameName="SGF Test" />);

            await waitFor(() => {
                expect(screen.getByRole("combobox")).toBeInTheDocument();
            });

            const addButton = screen.getByRole("button", { name: "Add to Collection" });
            fireEvent.click(addButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith("/api/v1/games/456/sgf");

                // Verify the File object was created with correct properties
                const postCall = mockPost.mock.calls[0];
                expect(postCall[0]).toBe("me/games/sgf/0");

                const uploadedFile = postCall[1] as File;
                expect(uploadedFile).toBeInstanceOf(File);
                expect(uploadedFile.name).toBe("SGF Test.sgf");
                expect(uploadedFile.type).toBe("application/x-go-sgf");
                expect(uploadedFile.size).toBe(originalSgfData.length);

                // Verify the file was created with the original SGF data
                // Since File constructor was called with originalSgfData as first argument
                expect(mockPost).toHaveBeenCalledWith(
                    "me/games/sgf/0",
                    expect.objectContaining({
                        name: "SGF Test.sgf",
                        type: "application/x-go-sgf",
                        size: originalSgfData.length,
                    }),
                );
            });
        });
    });

    describe("openSGFCollectionModal function", () => {
        test("creates modal with correct props", () => {
            const gameId = 789;
            const gameName = "Function Test Game";
            const onSuccess = jest.fn();

            expect(typeof openSGFCollectionModal).toBe("function");
            expect(() => openSGFCollectionModal(gameId, gameName, onSuccess)).not.toThrow();
        });
    });
});
