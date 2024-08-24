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
import { browserHistory } from "ogsHistory";
//import { useNavigate } from "react-router-dom";
import * as data from "data";
import { shouldOpenNewTab, errorLogger, unicodeFilter } from "misc";
import { rankString, getUserRating, PROVISIONAL_RATING_CUTOFF } from "rank_utils";
import { close_all_popovers, popover } from "popover";
import { close_friend_list } from "FriendList/close_friend_list";
import { PlayerDetails } from "./PlayerDetails";
import { openPlayerNotesModal } from "PlayerNotesModal";
import { Flag } from "Flag";
import { PlayerIcon } from "PlayerIcon";
import * as player_cache from "player_cache";
import * as preferences from "preferences";
import online_status from "online_status";

/* There are cases where what we are handed is some odd looking dirty data. We
 * should probably start warning about remaining uses of these fields and then
 * clean/remove them when they pop up. */

export interface PlayerObjectType {
    id?: number;
    player_id?: number; // alias for id, should be removed but here for backwards compatibility

    professional?: boolean;
    pro?: boolean;

    rank?: number;
    ranking?: number;

    name?: string;
    username?: string;

    anonymous?: boolean;

    country?: string;
    ui_class?: string;
}

export interface PlayerProperties {
    icon?: boolean;
    iconSize?: number;
    user?: number | PlayerObjectType;
    historical?: PlayerObjectType;
    flag?: boolean;
    rank?: boolean;
    flare?: boolean;
    online?: boolean;
    nolink?: boolean;
    fakelink?: boolean;
    nodetails?: boolean /* don't open the details box, instead just open player page */;
    nochallenge?: boolean /* don't show the challenge button in the details box */;
    noextracontrols?: boolean /* Disable extra controls */;
    shownotesindicator?: boolean /* add the notes icon if the player has notes */;
    disableCacheUpdate?: boolean;
    forceShowRank?: boolean;
}

type ViewReportContextType = {
    reporter: player_cache.PlayerCacheEntry;
    reported: player_cache.PlayerCacheEntry;
};

export const ViewReportContext = React.createContext<ViewReportContextType | null>(null);

export function Player(props: PlayerProperties): JSX.Element {
    const user = data.get("user");
    const player_id: number =
        (typeof props.user !== "object" ? props.user : props.user?.id || props.user?.player_id) ||
        0;
    const historical = props.historical;
    //const navigate = useNavigate();

    const [is_online, set_is_online] = React.useState<boolean>(false);
    const [player, set_player] = React.useState<PlayerObjectType | null>(
        typeof props.user === "object" ? props.user : null,
    );
    const [has_notes, set_has_notes] = React.useState<boolean | null>(
        (player?.id && user?.id && !!data.get(`player-notes.${user?.id}.${player?.id}`)) || false,
    );

    const elt_ref = React.useRef<HTMLSpanElement | HTMLAnchorElement>();
    const player_id_ref = React.useRef<number>(player_id);
    const username_ref = React.useRef<string | null | undefined>(null);

    player_id_ref.current = player_id;
    username_ref.current = typeof props.user !== "object" ? null : props.user?.username;

    const base = player || historical;
    const combined = base ? Object.assign({}, base, historical ? historical : {}) : null;

    const viewReportContext = React.useContext(ViewReportContext);

    React.useEffect(() => {
        if (!props.disableCacheUpdate) {
            if (player?.id && player.id > 0) {
                player_cache.update(player);
            }

            const username = typeof props.user !== "object" ? null : props.user?.username;
            if (player_id && player_id > 0) {
                player_cache
                    .fetch(player_id, ["username", "ui_class", "ranking", "pro"])
                    .then((player) => {
                        if (player_id_ref.current === player?.id) {
                            set_player(player);
                        }
                    })
                    .catch((err: any) => {
                        if (player_id_ref.current === player?.id) {
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
                        if (username_ref.current === player?.username) {
                            set_player(player);
                        }
                    })
                    .catch((err: any) => {
                        if (username_ref.current === player?.username) {
                            set_player({
                                id: 0,
                                username: username,
                                ui_class: "provisional",
                                pro: false,
                            });
                        }
                        errorLogger(err);
                    });
            }
        }

        const set_online = (player_id: number, tf: boolean) => {
            set_is_online(tf);
        };

        /* Online status */
        if (props.online) {
            online_status.subscribe(player_id, set_online);
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
                if (user?.id && player?.id) {
                    data.unwatch(`player-notes.${user.id}.${player.id}`, updateHasNotes);
                }
            }
            if (props.online) {
                online_status.subscribe(player_id, set_online);
            }
        };
    }, [player_id, typeof props.user === "object" && props.user?.username]);

    const display_details = (event: React.MouseEvent) => {
        if (!player) {
            return;
        }
        const _player_id = player.id || player.player_id;

        if (props.nolink || player.anonymous || !_player_id || _player_id < 0) {
            return;
        }

        if (!props.fakelink && shouldOpenNewTab(event)) {
            /* let browser deal with opening the window so we don't get popup warnings */
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        const player_id = (player.id || player.player_id) as number;
        if (shouldOpenNewTab(event)) {
            let uri = `/player/${player_id}`;
            const player = player_cache.lookup(player_id);
            if (player) {
                uri += "/" + encodeURIComponent(unicodeFilter(player?.username || ""));
            }
            window.open(uri, "_blank");
        } else if (props.nodetails) {
            close_all_popovers();
            close_friend_list();
            browserHistory.push(`/player/${player_id}/`);
            //navigate(`/player/${player_id}/`);
            return;
        } else {
            let chat_id: string | null = null;
            try {
                let cur = $(elt_ref.current as HTMLElement);

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
                        chatId={chat_id || undefined}
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

    if (!combined) {
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
    let rank: JSX.Element | null = null;

    const main_attrs: any = {
        className: "Player",
        "data-player-id": player_id,
    };

    if (props.icon) {
        main_attrs.className += " Player-with-icon";
    }

    if (combined.ui_class) {
        main_attrs.className += " " + combined.ui_class;
    }

    if (viewReportContext && viewReportContext.reported.id === player_id) {
        main_attrs.className += " reported";
    }

    if (viewReportContext && viewReportContext.reporter.id === player_id) {
        main_attrs.className += " reporter";
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
        const rating = getUserRating(combined, "overall", 0);
        let rank_text = "E";

        if (combined.pro || combined.professional) {
            rank_text = rankString(combined);
        } else if (rating.unset && ((combined.rank || 0) > 0 || (combined.ranking || 0) > 0)) {
            /* This is to support displaying archived chat lines */
            rank_text = rankString(combined);
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

    const username_string = unicodeFilter(combined.username || combined.name || "<error>");
    let display_username = username_string;

    if (username_string.toLowerCase().startsWith("deleted-")) {
        display_username = display_username.substring(0, 15) + "...";
    }

    const username = <span className="Player-username">{display_username}</span>;

    const player_note_indicator =
        props.shownotesindicator && has_notes ? (
            <i
                className={"Player fa fa-clipboard"}
                onClick={() => openPlayerNotesModal(player_id)}
            />
        ) : null;

    if (props.nolink || props.fakelink || !player_id || combined.anonymous || player_id < 0) {
        return (
            <span ref={elt_ref} {...main_attrs} onClick={display_details}>
                {(props.icon || null) && <PlayerIcon user={combined} size={props.iconSize || 16} />}
                {((props.flag && combined.country) || null) && (
                    <Flag country={combined.country as string} />
                )}
                {username}
                {rank}
                {player_note_indicator}
            </span>
        );
    } else {
        const player_id = combined.id || combined.player_id;
        const uri = `/player/${player_id}/${encodeURIComponent(username_string)}`;

        return (
            // if only we could put {...main_attrs} on the span, we could put the styles in .Player.  But router seems to hate that.
            <span>
                <a href={uri} ref={elt_ref} {...main_attrs} onClick={display_details}>
                    {(props.icon || null) && (
                        <PlayerIcon user={combined} size={props.iconSize || 16} />
                    )}
                    {((props.flag && combined.country) || null) && (
                        <Flag country={combined.country as string} />
                    )}
                    {username}
                    {rank}
                </a>
                {player_note_indicator}
            </span>
        );
    }
}
