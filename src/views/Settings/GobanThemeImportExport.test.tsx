/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { importGobanTheme, serializeGobanTheme } from "@/lib/goban_theme_json";
import { GobanThemeImportExport } from "./GobanThemeImportExport";

jest.mock("@/lib/translate", () => ({
    pgettext: (_context: string, message: string) => message,
}));

jest.mock("@/lib/goban_theme_json", () => ({
    importGobanTheme: jest.fn(),
    serializeGobanTheme: jest.fn(() => '{\n  "version": 1\n}'),
}));

const mockedImport = jest.mocked(importGobanTheme);
const mockedSerialize = jest.mocked(serializeGobanTheme);

describe("GobanThemeImportExport", () => {
    beforeEach(() => {
        mockedImport.mockReset();
        mockedSerialize.mockReset();
        mockedSerialize.mockReturnValue('{\n  "version": 1\n}');
    });

    test("reveals a fixed JSON editor populated from current settings", () => {
        render(<GobanThemeImportExport />);

        expect(screen.queryByRole("textbox")).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Import / export" }));

        expect(screen.getByRole("textbox")).toHaveValue('{\n  "version": 1\n}');
        expect(mockedSerialize).toHaveBeenCalledTimes(1);
    });

    test("copies the current textarea", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        });
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Import / export" }));
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "shared JSON" } });
        fireEvent.click(screen.getByRole("button", { name: "Copy" }));

        await waitFor(() => expect(writeText).toHaveBeenCalledWith("shared JSON"));
        expect(await screen.findByRole("status")).toHaveTextContent("Theme JSON copied.");
    });

    test("imports pasted JSON and refreshes the canonical text", () => {
        mockedSerialize
            .mockReturnValueOnce('{\n  "version": 1\n}')
            .mockReturnValueOnce('{\n  "version": 1,\n  "normalized": true\n}');
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Import / export" }));
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "pasted JSON" } });
        fireEvent.click(screen.getByRole("button", { name: "Import" }));

        expect(mockedImport).toHaveBeenCalledWith("pasted JSON");
        expect(screen.getByRole("textbox")).toHaveValue(
            '{\n  "version": 1,\n  "normalized": true\n}',
        );
        expect(screen.getByRole("status")).toHaveTextContent("Theme imported.");
    });

    test("shows validation errors without replacing the pasted JSON", () => {
        mockedImport.mockImplementation(() => {
            throw new Error("$.board.theme: is not an available theme");
        });
        render(<GobanThemeImportExport />);
        fireEvent.click(screen.getByRole("button", { name: "Import / export" }));
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "invalid JSON" } });
        fireEvent.click(screen.getByRole("button", { name: "Import" }));

        expect(screen.getByRole("alert")).toHaveTextContent(
            "$.board.theme: is not an available theme",
        );
        expect(screen.getByRole("textbox")).toHaveValue("invalid JSON");
    });
});
