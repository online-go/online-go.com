/*
 * Copyright (C)  Online-Go.com
 */

import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { GobanCustomStoneUrlInput, parseCustomStoneUrls } from "./GobanCustomStoneUrlInput";

jest.mock("@/lib/hooks", () => ({
    useData: () => ["enabled", jest.fn()],
}));

jest.mock("@/lib/translate", () => ({
    pgettext: (_context: string, message: string) => message,
}));

describe("GobanCustomStoneUrlInput", () => {
    test("normalizes URL lines for storage", () => {
        expect(parseCustomStoneUrls(" first.png \n\nsecond.png\r\nfirst.png\n")).toEqual([
            "first.png",
            "second.png",
        ]);
    });

    test("uses a compact single-line editor by default", () => {
        render(<GobanCustomStoneUrlInput color="black" urls={["first.png"]} setUrls={jest.fn()} />);

        expect(screen.getByRole("textbox").tagName).toBe("INPUT");
        expect(screen.getByRole("button", { name: "Add variations" })).toBeVisible();
        expect(screen.queryByText("One image URL per line.")).toBeNull();
    });

    test("preserves draft newlines while emitting normalized URLs", () => {
        const setUrls = jest.fn();
        render(<GobanCustomStoneUrlInput color="black" urls={[]} setUrls={setUrls} />);
        fireEvent.click(screen.getByRole("button", { name: "Add variations" }));
        const textarea = screen.getByRole("textbox");
        const draft = "first.png\n\n second.png \n";

        expect(textarea.tagName).toBe("TEXTAREA");
        fireEvent.change(textarea, { target: { value: draft } });

        expect(textarea).toHaveValue(draft);
        expect(setUrls).toHaveBeenLastCalledWith(["first.png", "second.png"]);
    });

    test("resets all URLs and explains canvas compatibility", () => {
        const setUrls = jest.fn();
        render(
            <GobanCustomStoneUrlInput
                color="white"
                urls={["first.png", "second.png"]}
                setUrls={setUrls}
            />,
        );

        expect(screen.getByRole("textbox").tagName).toBe("TEXTAREA");
        expect(screen.getByText("One image URL per line.")).toBeVisible();
        expect(screen.getByText("The old canvas renderer uses only the first URL.")).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Reset white stone URLs" }));

        expect(screen.getByRole("textbox")).toHaveValue("");
        expect(screen.getByRole("textbox").tagName).toBe("INPUT");
        expect(setUrls).toHaveBeenLastCalledWith([]);
    });
});
