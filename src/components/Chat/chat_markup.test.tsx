import { chat_markup } from "./chat_markup";
import * as React from "react";

// Workaround for error "TypeError: goban_1.setGobanTranslations is not a function"
jest.mock("translate", () => ({
    _: jest.fn((x) => x),
}));

jest.mock("Player", () => "Player");

jest.mock("profanity_filter", () => ({
    profanity_filter: jest.fn((x) => x),
}));

function expect_singular_markup(input: string, output: JSX.Element) {
    expect(chat_markup(input)).toEqual([output]);
}

test("No markup", () => {
    expect_singular_markup(
        "There is nothing interesting about this text.",
        <span key={0}>{"There is nothing interesting about this text."}</span>,
    );
});

test("GitHub", () => {
    expect_singular_markup(
        "https://github.com/online-go/online-go.com/pull/1",
        <a key={0} target="_blank" href={"https://github.com/online-go/online-go.com/pull/1"}>
            {"GH-1"}
        </a>,
    );
    expect_singular_markup(
        "https://github.com/online-go/online-go.com/issues/4",
        <a key={0} target="_blank" href={"https://github.com/online-go/online-go.com/issues/4"}>
            {"GH-4"}
        </a>,
    );
});

test("E-mail", () => {
    expect_singular_markup(
        "john.doe@emailhost.com",
        <a key={0} target="_blank" href={"mailto:john.doe@emailhost.com"}>
            {"john.doe@emailhost.com"}
        </a>,
    );
});

// Because of the @ symbol, these URLs have a tendency to get caught by the e-mail RegExp
test("Google Maps link not parsed as e-mail", () => {
    expect_singular_markup(
        "https://www.google.com/maps/@50.7006874,-3.0915427,13.75z",
        <a
            key={0}
            target="_blank"
            href={"https://www.google.com/maps/@50.7006874,-3.0915427,13.75z"}
        >
            {"https://www.google.com/maps/@50.7006874,-3.0915427,13.75z"}
        </a>,
    );
});
