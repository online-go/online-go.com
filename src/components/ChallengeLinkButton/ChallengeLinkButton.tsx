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

import { pgettext } from "@/lib/translate";

import { popover } from "@/lib/popover";

type ChallengeLinkButtonProps = {
    uuid: string;
    class_extension?: string;
};

/**
 *  Render a button that generates a "Challenge Link" URL, and tries to copy it to the clipboard, or display it.
 */

export function ChallengeLinkButton(props: ChallengeLinkButtonProps): React.ReactElement {
    const full_class = "btn xs" + (props.class_extension ? ` ${props.class_extension}` : "");

    /* render */
    return (
        <button
            onClick={(event) => copyChallengeLinkURL(event.target as HTMLElement, props.uuid)}
            className={full_class}
        >
            <i className="fa fa-share-square" />
        </button>
    );
}

// Generally useful challenge link functions

export function copyChallengeLinkURL(ack_target: HTMLElement, uuid: string): void {
    const challenge_link =
        window.location.protocol +
        "//" +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : "") +
        `/welcome/?linked-challenge=${uuid}`;

    try {
        navigator.clipboard
            .writeText(challenge_link)
            .then(() =>
                popover({
                    elt: (
                        <span>
                            {pgettext(
                                "They clicked the button to copy a challenge link, we copied it into their clipboard",
                                "Invitation Link Copied!",
                            )}
                        </span>
                    ),
                    below: ack_target,
                    closeAfter: 2000,
                    animate: true,
                    minWidth: 180,
                    container_class: "challenge-link-copied",
                }),
            )
            .catch(() =>
                // Uh-oh, their browser won't let us access the clipboard?
                // ... give them the whole thing to copy...
                showChallengeLink(challenge_link, ack_target),
            );
    } catch {
        // Their browser doesn't even know about navigator.clipboard?
        showChallengeLink(challenge_link, ack_target);
    }
}

export function showChallengeLink(challenge_link: string, target: HTMLElement): void {
    popover({
        elt: (
            <div className="challenge-link-copy">
                {pgettext(
                    "This is the label for a link (URL) that they created",
                    "Invitation link:",
                )}
                <br />
                {challenge_link}
            </div>
        ),
        below: target,
        minWidth: 300,
        container_class: "challenge-link-copy",
    });
}
