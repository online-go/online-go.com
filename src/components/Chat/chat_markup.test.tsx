/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import { Link } from "react-router-dom";
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

function expect_singular_markup(input: string, output: React.ReactElement) {
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

test("Tournament links", () => {
    // Valid tournament IDs should be linked
    expect_singular_markup(
        "Tournament 123",
        <Link key={0} to="/tournament/123">
            {"Tournament-123"}
        </Link>,
    );
    expect_singular_markup(
        "Tournament-4567",
        <Link key={0} to="/tournament/4567">
            {"Tournament-4567"}
        </Link>,
    );
    expect_singular_markup(
        "Tournament #99999",
        <Link key={0} to="/tournament/99999">
            {"Tournament-99999"}
        </Link>,
    );
    expect_singular_markup(
        "https://online-go.com/tournaments/6789",
        <Link key={0} to="/tournament/6789">
            {"tournament 6789"}
        </Link>,
    );

    // Invalid cases should NOT be linked
    expect_singular_markup(
        "Live 9x9 Double Elimination Tournament 2025-02-13 14:30",
        <span key={0}>{"Live 9x9 Double Elimination Tournament 2025-02-13 14:30"}</span>,
    );
    expect_singular_markup("Tournament 2025-02-13", <span key={0}>{"Tournament 2025-02-13"}</span>);
    expect_singular_markup("Tournament 12345-67", <span key={0}>{"Tournament 12345-67"}</span>);
});
