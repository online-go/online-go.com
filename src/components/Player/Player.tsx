/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { routes } from "routes";
import { browserHistory } from "ogsHistory";
import * as data from "data";
import { shouldOpenNewTab, errorLogger, unicodeFilter } from "misc";
import { rankString, getUserRating, PROVISIONAL_RATING_CUTOFF } from "rank_utils";
import { close_all_popovers, popover } from "popover";
import { close_friend_list } from "FriendList/FriendIndicator";
import { PlayerDetails } from "./PlayerDetails";
import { openPlayerNotesModal } from "PlayerNotesModal";
import { Flag } from "Flag";
import { PlayerIcon } from "PlayerIcon";
import * as player_cache from "player_cache";
//import { PlayerCacheEntry } from "player_cache";
import * as preferences from "preferences";
import online_status from "online_status";

/* There are cases where what we are handed is some odd looking dirty data. We
 * should probably start warning about remaining uses of these fields and then
 * clean/remove them when they pop up. */

interface PlayerObjectType {
    id?: number;
    player_id?: number; // alias for id, should be removed but here for backwards compatibility

    professional?: boolean | number;
    pro?: boolean;

    rank?: number;
    ranking?: number;

    name?: string;
    username?: string;

    anonymous?: boolean;

    country?: string;
    ui_class?: string;
}

interface PlayerProperties {
    icon?: boolean;
    iconSize?: number;
    user: number | PlayerObjectType;
    flag?: boolean;
    rank?: boolean;
    flare?: boolean;
    online?: boolean;
    nolink?: boolean;
    fakelink?: boolean;
    nodetails?: boolean /* don't open the detials box, instead just open player page */;
    nochallenge?: boolean /* don't show the challenge button in the details box */;
    noextracontrols?: boolean /* Disable extra controls */;
    shownotesindicator?: boolean /* add the notes icon if the player has notes */;
    disableCacheUpdate?: boolean;
    forceShowRank?: boolean;
}

export function Player(props: PlayerProperties): JSX.Element {
    const user = data.get("user");
    const player_id =
        typeof props.user !== "object" ? props.user : props.user.id || props.user.player_id;

    const [is_online, set_is_online] = React.useState<boolean>(false);
    const [player, set_player] = React.useState<PlayerObjectType>(
        typeof props.user === "object" ? props.user : null,
    );
    const [has_notes, set_has_notes] = React.useState<boolean>(
        player && !!data.get(`player-notes.${user.id}.${player.id}`),
    );

    const elt_ref = React.useRef<HTMLSpanElement | HTMLAnchorElement>();
    const player_id_ref = React.useRef<number>(player_id);
    const username_ref = React.useRef<string>();

    player_id_ref.current = player_id;
    username_ref.current = typeof props.user !== "object" ? null : props.user.username;

    React.useEffect(() => {
        if (!props.disableCacheUpdate) {
            if (player && player.id > 0) {
                player_cache.update(player);
            }

            const username = typeof props.user !== "object" ? null : props.user.username;
            if (player_id && player_id > 0) {
                player_cache
                    .fetch(player_id, ["username", "ui_class", "ranking", "pro"])
                    .then((player) => {
                        if (player_id_ref.current === player.id) {
                            set_player(player);
                        }
                    })
                    .catch((err: any) => {
                        if (player_id_ref.current === player.id) {
                            set_player({
                                id: player_id,
                                username: "?player" + player_id + "?",
                                ui_class: "provisional",
                                pro: false,
                            });
                        }
                        errorLogger(err);
                    });
            } else if (player_id && player_id <= 0) {
                // do nothing
            } else if (username && username !== "...") {
                player_cache
                    .fetch_by_username(username, ["username", "ui_class", "ranking", "pro"])
                    .then((player) => {
                        if (username_ref.current === player.username) {
                            set_player(player);
                        }
                    })
                    .catch((err: any) => {
                        if (username_ref.current === player.username) {
                            set_player({
                                id: null,
                                username: username,
                                ui_class: "provisional",
                                pro: false,
                            });
                        }
                        errorLogger(err);
                    });
            }
        }

        /* Online status */
        if (props.online) {
            online_status.subscribe(player_id, set_is_online);
        }

        /* Has notes */
        const updateHasNotes = () => {
            const user = data.get("config.user");
            const tf = !!data.get(`player-notes.${user.id}.${player_id}`);
            if (tf !== has_notes) {
                set_has_notes(tf);
            }
        };

        if (props.shownotesindicator) {
            data.watch(`player-notes.${user.id}.${player_id}`, updateHasNotes);
        }

        return () => {
            if (props.shownotesindicator) {
                data.unwatch(`player-notes.${user.id}.${player.id}`, updateHasNotes);
            }
            if (props.online) {
                online_status.unsubscribe(player_id, set_is_online);
            }
        };
    }, [player_id]);

    const display_details = (event: React.MouseEvent) => {
        if (
            props.nolink ||
            !(player.id || player.player_id) ||
            player.anonymous ||
            (player.id || player.player_id) < 0
        ) {
            return;
        }

        if (
            ("buttons" in event && event.buttons & 2) ||
            ("button" in event && event.button === 2)
        ) {
            /* on click with right mouse button do nothing.
               buttons uses on bit per button, alowing for multiple buttons pressed at the same time. The bit with value 2 is the right mouse button. https://www.w3schools.com/jsref/event_buttons.asp
               buttons isn't supported in all browsers, so we have to check button as fallback. */
            return;
        }

        if (!props.fakelink && shouldOpenNewTab(event)) {
            /* let browser deal with opening the window so we don't get popup warnings */
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const player_id = player.id || player.player_id;
        if (shouldOpenNewTab(event)) {
            let uri = `/player/${player_id}`;
            const player = player_cache.lookup(player_id);
            if (player) {
                uri += "/" + encodeURIComponent(unicodeFilter(player.username));
            }
            window.open(uri, "_blank");
        } else if (props.nodetails) {
            close_all_popovers();
            close_friend_list();
            browserHistory.push(`/player/${player_id}/`);
            return;
        } else {
            let chat_id = null;
            try {
                let cur = $(elt_ref.current);

                while (cur && cur[0].nodeName !== "BODY") {
                    chat_id = cur.attr("data-chat-id");
                    if (chat_id) {
                        break;
                    }
                    cur = cur.parent();
                }
            } catch (e) {
                console.error(e);
            }

            popover({
                elt: (
                    <PlayerDetails
                        playerId={player_id}
                        noextracontrols={props.noextracontrols}
                        nochallenge={props.nochallenge}
                        chatId={chat_id}
                    />
                ),
                below: elt_ref.current,
                minWidth: 240,
                minHeight: 250,
            });
        }
    };

    /************/
    /** Render **/
    /************/

    if (!player) {
        if (typeof props.user === "number") {
            return (
                <span className="Player" data-player-id={0}>
                    ...
                </span>
            );
        } else {
            return (
                <span className="Player" data-player-id={0}>
                    [NULL USER]
                </span>
            );
        }
    }

    const nolink = !!props.nolink;
    let rank: JSX.Element = null;

    const main_attrs: any = {
        className: "Player",
        "data-player-id": player_id,
    };

    if (props.icon) {
        main_attrs.className += " Player-with-icon";
    }

    if (player.ui_class) {
        main_attrs.className += " " + player.ui_class;
    }

    if (player_id < 0) {
        main_attrs.className += " guest";
    }

    if (!player_id || nolink) {
        main_attrs.className += " nolink";
    }

    if (props.nodetails) {
        main_attrs.className += " nodetails";
    }

    if (props.noextracontrols) {
        main_attrs.className += " noextracontrols";
    }

    if (props.rank !== false) {
        const rating = getUserRating(player, "overall", 0);
        let rank_text = "E";

        if (player.pro || player.professional) {
            rank_text = rankString(player);
        } else if (rating.unset && (player.rank > 0 || player.ranking > 0)) {
            /* This is to support displaying archived chat lines */
            rank_text = rankString(player);
        } else if (rating.deviation >= PROVISIONAL_RATING_CUTOFF) {
            rank_text = "?";
        } else {
            rank_text = rating.bounded_rank_label;
        }

        if (!preferences.get("hide-ranks") || props.forceShowRank) {
            rank = <span className="Player-rank">[{rank_text}]</span>;
        }
    }

    if (props.flare) {
        main_attrs.className += " with-flare";
    }

    if (props.online) {
        main_attrs.className += is_online ? " online" : " offline";
    }

    const username_string = unicodeFilter(player.username || player.name);
    const username = <span className="Player-username">{username_string}</span>;

    const player_note_indicator =
        props.shownotesindicator && has_notes ? (
            <i
                className={"Player fa fa-clipboard"}
                onClick={() => openPlayerNotesModal(player_id)}
            />
        ) : null;

    if (props.nolink || props.fakelink || !player_id || player.anonymous || player_id < 0) {
        return (
            <span ref={elt_ref} {...main_attrs} onMouseDown={display_details}>
                {(props.icon || null) && <PlayerIcon user={player} size={props.iconSize || 16} />}
                {(props.flag || null) && <Flag country={player.country} />}
                {username}
                {rank}
                {player_note_indicator}
            </span>
        );
    } else {
        const player_id = player.id || player.player_id;
        const uri = `/player/${player_id}/${encodeURIComponent(username_string)}`;

        return (
            // if only we could put {...main_attrs} on the span, we could put the styles in .Player.  But router seems to hate that.
            <span>
                <a
                    href={uri}
                    ref={elt_ref}
                    {...main_attrs}
                    onMouseDown={display_details}
                    router={routes}
                >
                    {(props.icon || null) && (
                        <PlayerIcon user={player} size={props.iconSize || 16} />
                    )}
                    {(props.flag || null) && <Flag country={player.country} />}
                    {username}
                    {rank}
                </a>
                {player_note_indicator}
            </span>
        );
    }
}
