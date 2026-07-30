/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { importGobanTheme, serializeGobanTheme } from "@/lib/goban_theme_json";
import { toast } from "@/lib/toast";
import { GobanThemeImportExport } from "./GobanThemeImportExport";

jest.mock("@/lib/translate", () => ({
    pgettext: (_context: string, message: string) => message,
}));

jest.mock("@/lib/goban_theme_json", () => ({
    importGobanTheme: jest.fn(),
    serializeGobanTheme: jest.fn(() => '{\n  "version": 1\n}'),
}));

jest.mock("@/lib/toast", () => ({
    toast: jest.fn(),
}));

const mockedImport = jest.mocked(importGobanTheme);
const mockedSerialize = jest.mocked(serializeGobanTheme);
const mockedToast = jest.mocked(toast);

describe("GobanThemeImportExport", () => {
    beforeEach(() => {
        mockedImport.mockReset();
        mockedSerialize.mockReset();
        mockedSerialize.mockReturnValue('{\n  "version": 1\n}');
        mockedToast.mockReset();
    });

    test("renders separate copy and import controls", () => {
        render(<GobanThemeImportExport />);

        expect(screen.queryByRole("textbox")).toBeNull();
        expect(screen.getByRole("button", { name: "Copy theme" })).toBeVisible();
        expect(screen.getByRole("button", { name: "Import theme" })).toBeVisible();
    });

    test("serializes and copies the current theme when clicked", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Copy theme" }));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith('{\n  "version": 1\n}'));
        expect(mockedSerialize).toHaveBeenCalledTimes(1);
        expect(mockedToast).toHaveBeenCalledWith(<div>Theme JSON copied.</div>, 3000);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    test("opens an empty import editor and applies pasted JSON", () => {
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Import theme" }));

        expect(screen.getByRole("textbox", { name: "Theme JSON to import" })).toHaveValue("");
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "pasted JSON" } });
        fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));

        expect(mockedImport).toHaveBeenCalledWith("pasted JSON");
        expect(screen.queryByRole("textbox")).toBeNull();
        expect(mockedSerialize).not.toHaveBeenCalled();
        expect(mockedToast).toHaveBeenCalledWith(<div>Theme imported.</div>, 3000);
        expect(screen.queryByRole("alert")).toBeNull();
    });

    test("shows validation errors without replacing the pasted JSON", () => {
        mockedImport.mockImplementation(() => {
            throw new Error("$.board.theme: is not an available theme");
        });
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Import theme" }));
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "invalid JSON" } });
        fireEvent.click(screen.getByRole("button", { name: "Apply theme" }));

        expect(screen.getByRole("alert")).toHaveTextContent(
            "$.board.theme: is not an available theme",
        );
        expect(screen.getByRole("textbox")).toHaveValue("invalid JSON");
    });

    test("shows current theme JSON for manual copying when clipboard access fails", async () => {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: undefined,
        });
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Copy theme" }));

        expect(await screen.findByRole("textbox", { name: "Theme JSON to copy" })).toHaveValue(
            '{\n  "version": 1\n}',
        );
        expect(screen.getByRole("alert")).toHaveTextContent(
            "The JSON has been selected for manual copying.",
        );
    });
});
