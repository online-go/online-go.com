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

import { chat_markup } from "./chat_markup";

function linkNodes(nodes: Node[] | undefined): HTMLAnchorElement[] {
    if (!nodes) {
        return [];
    }
    return nodes.filter((node): node is HTMLAnchorElement => node.nodeName === "A");
}

function textOf(nodes: Node[] | undefined): string {
    if (!nodes) {
        return "";
    }
    return nodes.map((node) => node.textContent ?? "").join("");
}

test("plain text is returned as a single text node", () => {
    const nodes = chat_markup("This is a normal message.");
    expect(textOf(nodes)).toBe("This is a normal message.");
    expect(linkNodes(nodes)).toHaveLength(0);
});

test("empty string produces no nodes", () => {
    expect(chat_markup("")).toEqual([]);
});

test("non-string input returns undefined", () => {
    expect(chat_markup(42 as unknown as string)).toBeUndefined();
});

test("urls are linked with safe attributes", () => {
    const nodes = chat_markup("see http://example.com now");
    const links = linkNodes(nodes);
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("http://example.com");
    expect(links[0].getAttribute("target")).toBe("_blank");
    /* cspell:disable-next-line */
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
    expect(textOf(nodes)).toBe("see http://example.com now");
});

test("adjacent urls are linked separately", () => {
    const nodes = chat_markup("http://a.com http://b.com");
    const links = linkNodes(nodes);
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("http://a.com");
    expect(links[1].getAttribute("href")).toBe("http://b.com");
});

test("url containing an at sign is not parsed as an e-mail address", () => {
    const nodes = chat_markup("https://www.google.com/maps/@50.7,-3.1,13.75z");
    const links = linkNodes(nodes);
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://www.google.com/maps/%4050.7,-3.1,13.75z");
    expect(textOf(nodes)).toBe("https://www.google.com/maps/@50.7,-3.1,13.75z");
});

test("e-mail addresses are turned into mailto links", () => {
    const nodes = chat_markup("mail john.doe@example.com today");
    const links = linkNodes(nodes);
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("mailto:john.doe@example.com");
    expect(textOf(nodes)).toBe("mail john.doe@example.com today");
});

test("review references are linked", () => {
    const at_start = chat_markup("##123");
    expect(linkNodes(at_start)[0].getAttribute("href")).toBe("/review/123");
    expect(textOf(at_start)).toBe("##123");

    const mid_message = chat_markup("see ##456 now");
    expect(linkNodes(mid_message)[0].getAttribute("href")).toBe("/review/456");
    expect(textOf(mid_message)).toBe("see ##456 now");
});

test("game references are linked", () => {
    const at_start = chat_markup("#123");
    expect(linkNodes(at_start)[0].getAttribute("href")).toBe("/game/123");
    expect(textOf(at_start)).toBe("#123");

    const mid_message = chat_markup("play #456 now");
    expect(linkNodes(mid_message)[0].getAttribute("href")).toBe("/game/456");
    expect(textOf(mid_message)).toBe("play #456 now");
});

test("player references are linked", () => {
    const nodes = chat_markup("hello player 123");
    expect(linkNodes(nodes)[0].getAttribute("href")).toBe("/user/view/123");
    expect(textOf(nodes)).toBe("hello player 123");
});

test("group references are linked", () => {
    const nodes = chat_markup("join #group-77");
    expect(linkNodes(nodes)[0].getAttribute("href")).toBe("/group/77");
    expect(textOf(nodes)).toBe("join #group-77");
});

test("quotes inside urls cannot inject attributes", () => {
    const nodes = chat_markup("http://x/'onmouseover='alert(1)");
    const links = linkNodes(nodes);
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("http://x/'onmouseover='alert(1)");
    expect(links[0].hasAttribute("onmouseover")).toBe(false);
    expect(links[0].hasAttribute("onclick")).toBe(false);
});

test("html tags are rendered as text, not as elements", () => {
    const nodes = chat_markup("<script>alert(1)</script><img src=x onerror=alert(1)>");
    for (const node of nodes ?? []) {
        expect(node.nodeType).toBe(Node.TEXT_NODE);
    }
    expect(textOf(nodes)).toBe("<script>alert(1)</script><img src=x onerror=alert(1)>");
});

test("mixed content keeps ordering and text", () => {
    const nodes = chat_markup("##123 #456 player 789 http://a.com text");
    const links = linkNodes(nodes);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "/review/123",
        "/game/456",
        "/user/view/789",
        "http://a.com",
    ]);
    expect(textOf(nodes)).toBe("##123 #456 player 789 http://a.com text");
});
