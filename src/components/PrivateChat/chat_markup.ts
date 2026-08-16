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

interface ChatMarkupRule {
    pattern: RegExp;
    render: (m: RegExpExecArray) => HTMLAnchorElement;
}

function createLink(href: string, text: string): HTMLAnchorElement {
    const a = document.createElement("a");
    a.target = "_blank";
    /* cspell:disable-next-line */
    a.rel = "noopener noreferrer";
    a.href = href;
    a.textContent = text;
    return a;
}

const rules: ChatMarkupRule[] = [
    {
        pattern: /((?:ftp|http)s?:\/\/[^<> ]+)/gi,
        render: (m) => createLink(m[1].replace("@", "%40"), m[1]),
    },
    {
        pattern: /[^<> ]+[@][^<> ]+[.][^<> ]+/gi,
        render: (m) => createLink("mailto:" + m[0], m[0]),
    },
    {
        pattern: /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
        render: (m) =>
            createLink(`/review/${m[2] || m[4] || ""}`, `${m[3] || ""}##${m[2] || m[4] || ""}`),
    },
    {
        pattern: /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi,
        render: (m) =>
            createLink(`/game/${m[2] || m[4] || ""}`, `${m[3] || ""}#${m[2] || m[4] || ""}`),
    },
    {
        pattern: /(player ([0-9]+))/gi,
        render: (m) => createLink(`/user/view/${m[2]}`, m[1]),
    },
    {
        pattern: /(#group-([0-9]+))/gi,
        render: (m) => createLink(`/group/${m[2]}`, m[1]),
    },
];

export function chat_markup(body: string): Node[] | undefined {
    if (typeof body !== "string") {
        console.log("Attempted to markup non-text object: ", body);
        return;
    }

    const nodes: Node[] = [];
    const combined = new RegExp(rules.map((rule) => `(${rule.pattern.source})`).join("|"), "gi");

    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = combined.exec(body)) !== null) {
        if (m.index > last) {
            nodes.push(document.createTextNode(body.substring(last, m.index)));
        }

        if (m[0].length === 0) {
            last = Math.min(last + 1, body.length);
            combined.lastIndex = Math.max(combined.lastIndex, m.index + 1);
            continue;
        }

        let rendered = false;
        for (const rule of rules) {
            rule.pattern.lastIndex = 0;
            const match = rule.pattern.exec(m[0]);
            if (match && match.index === 0 && match[0].length === m[0].length) {
                nodes.push(rule.render(match));
                rendered = true;
                break;
            }
        }
        if (!rendered) {
            nodes.push(document.createTextNode(m[0]));
        }

        last = m.index + m[0].length;
    }

    if (last < body.length) {
        nodes.push(document.createTextNode(body.substring(last)));
    }

    return nodes;
}
