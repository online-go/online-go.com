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
import { Link } from "react-router-dom";
import type { ChatSystemLink } from "@/lib/chat_manager";
import { profanity_filter } from "@/lib/profanity_filter";
import { chat_markup } from "./chat_markup";

/** Most links a system line may carry; comm-server applies the same cap. */
export const MAX_SYSTEM_LINKS = 4;

/**
 * Only same-site paths: a typed system body can be sent by any signed-in
 * client, so an off-site href would let someone post an official-looking
 * line that leads away from OGS.
 */
const SAME_SITE_PATH = /^\/(?!\/)[^\s\\]*$/;

function isUsableLink(link: unknown): link is ChatSystemLink {
    if (typeof link !== "object" || link === null) {
        return false;
    }
    const { text, href } = link as Partial<ChatSystemLink>;
    return (
        typeof text === "string" &&
        text.length > 0 &&
        typeof href === "string" &&
        SAME_SITE_PATH.test(href)
    );
}

/**
 * Render a system line's text, turning the first occurrence of each link's
 * text into an in-app link and running the rest through the usual chat
 * markup. A link whose text is not in the line, or whose target is not a
 * same-site path, is ignored, so the line degrades to plain text.
 */
export function system_line_markup(
    text: string,
    links: readonly unknown[] | undefined,
): React.ReactElement[] {
    const pending = (links ?? []).filter(isUsableLink).slice(0, MAX_SYSTEM_LINKS);
    const out: React.ReactElement[] = [];
    let rest = text;
    let key = 0;

    while (pending.length > 0) {
        let chosen = -1;
        let at = -1;
        pending.forEach((link, i) => {
            const found = rest.indexOf(link.text);
            if (found >= 0 && (at < 0 || found < at)) {
                chosen = i;
                at = found;
            }
        });
        if (chosen < 0) {
            break;
        }
        const [link] = pending.splice(chosen, 1);
        if (at > 0) {
            out.push(<React.Fragment key={key++}>{chat_markup(rest.slice(0, at))}</React.Fragment>);
        }
        out.push(
            <Link key={key++} to={link.href}>
                {profanity_filter(link.text)}
            </Link>,
        );
        rest = rest.slice(at + link.text.length);
    }

    if (rest.length > 0) {
        out.push(<React.Fragment key={key++}>{chat_markup(rest)}</React.Fragment>);
    }
    return out;
}
