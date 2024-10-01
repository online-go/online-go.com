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
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import * as player_cache from "@/lib/player_cache";
import * as rengo_utils from "@/lib/rengo_utils";

import { del } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { _, pgettext } from "@/lib/translate";
import { Card } from "@/components/material";
import { SeekGraph, SeekGraphLegend } from "@/components/SeekGraph";
import { PersistentElement } from "@/components/PersistentElement";
import { isLiveGame, timeControlSystemText } from "@/components/TimeControl";
import { errorAlerter, rulesText, ignore } from "@/lib/misc";
import { automatch_manager } from "@/lib/automatch_manager";
import { allocateCanvasOrError } from "goban";
import { Challenge, ChallengeFilter, ChallengeFilterKey } from "@/lib/challenge_utils";
import { useUser } from "@/lib/hooks";
import {
    CellBreaks,
    ChallengeList,
    ChallengeListHeaders,
    RengoList,
    RengoListHeaders,
} from "./ChallengeLists";
import { PlayContext } from "./context";
import { anyChallengesToShow } from "./utils";
import { FindGame } from "./FindGame";

const CHALLENGE_LIST_FREEZE_PERIOD = 1000; // Freeze challenge list for this period while they move their mouse on it

const filterPreferenceMapping: Map<ChallengeFilterKey, preferences.ValidPreference> = new Map([
    ["showIneligible", "show-all-challenges"],
    ["showRanked", "show-ranked-challenges"],
    ["showUnranked", "show-unranked-challenges"],
    ["show19x19", "show-19x19-challenges"],
    ["show13x13", "show-13x13-challenges"],
    ["show9x9", "show-9x9-challenges"],
    ["showOtherSizes", "show-other-boardsize-challenges"],
    ["showRengo", "show-rengo-challenges"],
]);

export function Play(): JSX.Element {
    const ref_container: React.RefObject<HTMLDivElement> = React.createRef();
    const list_freeze_timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const canvas: HTMLCanvasElement = React.useMemo(() => allocateCanvasOrError(), []);

    const user = useUser();
    const [live_list, setLiveList] = React.useState<Array<Challenge>>([]);
    const [correspondence_list, setCorrespondenceList] = React.useState<Array<Challenge>>([]);
    const [rengo_list, setRengoList] = React.useState<Array<Challenge>>([]);

    const default_filter: Partial<ChallengeFilter> = {};
    filterPreferenceMapping.forEach((pref, key) => {
        if (user.anonymous) {
            default_filter[key] = true;
        } else {
            default_filter[key] = preferences.get(pref) as any;
        }
    });

    const [filter, setFilter] = React.useState<ChallengeFilter>(default_filter as ChallengeFilter);
    const seekgraph = React.useRef<SeekGraph>();

    // Used to not change the challenge list while they are trying to point the mouse at it
    const [freeze_challenge_list, setFreezeChallengeList] = React.useState<boolean>(false);
    // challenges received while frozen
    const [pending_challenges, setPendingChallenges] = React.useState<{ [id: number]: Challenge }>(
        {},
    );
    // a challenge_ids for challenges to show with pane open in the rengo challenge list
    const [show_in_rengo_management_pane, setShowInRengoManagementPane] = React.useState<number[]>(
        [],
    );
    // a hash for storing the "locked" state of rengo management panes
    const [rengo_manage_pane_lock, setRengoManagePaneLock] = React.useState<{
        [id: number]: boolean;
    }>({});
    const onResize = React.useCallback(() => {
        if (!ref_container.current) {
            return;
        }

        const w = ref_container.current.offsetWidth;
        const h = ref_container.current.offsetHeight;
        if (w !== seekgraph.current?.width || h !== seekgraph.current?.height) {
            seekgraph.current?.resize(w, h);
        }
        if (w === 0 || h === 0) {
            // Wait for positive size
            setTimeout(onResize, 500);
        }
    }, [ref_container, seekgraph]);

    const updateChallenges = React.useCallback(
        (challenges?: { [id: number]: Challenge }) => {
            if (!challenges) {
                return;
            }

            if (freeze_challenge_list) {
                const live = live_list;
                const corr = correspondence_list;
                const rengo = rengo_list;
                for (const list of [live, corr, rengo]) {
                    for (const i in list) {
                        const id = list[i].challenge_id;
                        if (!challenges[id]) {
                            list[i].removed = true;
                            list[i].ineligible_reason = _(
                                "challenge no longer available",
                            ); /* translator: the person can't accept this challenge because it has been removed or accepted already */
                        }
                    }
                }
                setPendingChallenges(challenges);
                setLiveList(live);
                setCorrespondenceList(corr);

                return;
            }

            const live: any[] = [];
            const corr: any[] = [];
            const rengo: any[] = [];
            for (const i in challenges) {
                const C = challenges[i];
                player_cache
                    .fetch(C.user_id)
                    .then(() => 0)
                    .catch(
                        ignore,
                    ); /* just get the user data ready ready if we don't already have it */
                C.ranked_text = C.ranked ? _("Yes") : _("No");
                if (C.handicap === -1) {
                    C.handicap_text = _("Auto");
                } else if (C.handicap === 0) {
                    C.handicap_text = _("No");
                } else {
                    C.handicap_text = C.handicap;
                }

                if (C.komi === null) {
                    C.komi_text = _("Auto");
                } else {
                    C.komi_text = C.komi;
                }

                if (C.rengo) {
                    rengo.push(C);
                } else if (isLiveGame(C.time_control_parameters, C.width, C.height)) {
                    live.push(C);
                } else {
                    corr.push(C);
                }
            }
            live.sort(challenge_sort);
            corr.sort(challenge_sort);
            rengo.sort(time_per_move_challenge_sort);

            setLiveList(live);
            setCorrespondenceList(corr);
            setRengoList(rengo);
            setPendingChallenges([]);
        },
        [freeze_challenge_list, live_list, correspondence_list, rengo_list],
    );

    const setPaneLock = React.useCallback((id: number, lock: boolean) => {
        setRengoManagePaneLock((prev) => ({ ...prev, [id]: lock }));
    }, []);

    const closeChallengeManagementPane = React.useCallback(
        (challenge_id: number) => {
            if (show_in_rengo_management_pane.includes(challenge_id)) {
                setShowInRengoManagementPane((prev) => prev.filter((c) => c !== challenge_id));
            }
        },
        [show_in_rengo_management_pane],
    );
    const cancelOpenRengoChallenge = React.useCallback(
        (challenge: Challenge) => {
            alert
                .fire({
                    text: _("Are you sure you want to delete this rengo challenge?"),
                    showCancelButton: true,
                    confirmButtonText: _("Yes"),
                    cancelButtonText: _("Cancel"),
                })
                .then(({ value: yes }) => {
                    if (yes) {
                        // stop trying to show the cancelled challenge
                        closeChallengeManagementPane(challenge.challenge_id);

                        // do the action
                        rengo_utils.cancelRengoChallenge(challenge).catch(errorAlerter);
                    }
                })
                .catch(() => 0);
        },
        [closeChallengeManagementPane, _],
    );

    const unfreezeChallenges = React.useCallback(() => {
        setFreezeChallengeList(false);
        if (list_freeze_timeout.current) {
            clearTimeout(list_freeze_timeout.current);
            list_freeze_timeout.current = undefined;
        }
    }, []);

    const cancelOpenChallenge = React.useCallback(
        (challenge: Challenge) => {
            del(`challenges/${challenge.challenge_id}`).catch(errorAlerter);
            unfreezeChallenges();
        },
        [unfreezeChallenges],
    );

    const toggleFilterHandler = React.useCallback(
        (key: ChallengeFilterKey) => {
            const newValue = !filter[key];
            const newFilter = { ...filter };
            newFilter[key] = newValue;
            seekgraph.current?.setFilter(newFilter);
            const pref_key = filterPreferenceMapping.get(key);
            if (pref_key) {
                preferences.set(pref_key, newValue);
            }
            setFilter(newFilter);
        },
        [filter, seekgraph],
    );

    const liveOwnChallengePending = React.useCallback((): Challenge | undefined => {
        // a user should have only one of these at any time
        return live_list.find((c) => c.user_challenge);
    }, [live_list]);

    const ownRengoChallengesPending = React.useCallback((): Challenge[] => {
        // multiple correspondence are possible, plus one live
        return rengo_list.filter((c) => c.user_challenge);
    }, [rengo_list]);

    const joinedRengoChallengesPending = React.useCallback((): Challenge[] => {
        // multiple correspondence are possible, plus one live
        const user_id = data.get("config.user").id;
        return rengo_list.filter(
            (c) => c["rengo_participants"].includes(user_id) && !c.user_challenge,
        );
    }, [rengo_list]);

    const freezeChallenges = React.useCallback(() => {
        if (list_freeze_timeout.current) {
            clearTimeout(list_freeze_timeout.current);
        }
        if (!freeze_challenge_list) {
            setFreezeChallengeList(true);
        }
        list_freeze_timeout.current = setTimeout(unfreezeChallenges, CHALLENGE_LIST_FREEZE_PERIOD);
    }, [freeze_challenge_list, unfreezeChallenges]);

    const unNominateForRengoChallenge = React.useCallback(
        (C: Challenge) => {
            closeChallengeManagementPane(C.challenge_id);

            rengo_utils.unNominate(C).catch(errorAlerter);
        },
        [closeChallengeManagementPane],
    );

    const openRengoChallengePane = React.useCallback(
        (challenge_id: number) => {
            if (!show_in_rengo_management_pane.includes(challenge_id)) {
                setShowInRengoManagementPane((prev) => [challenge_id, ...prev]);
            }
        },
        [show_in_rengo_management_pane],
    );

    const toggleRengoChallengePane = React.useCallback(
        (challenge_id: number) => {
            if (show_in_rengo_management_pane.includes(challenge_id)) {
                closeChallengeManagementPane(challenge_id);
            } else {
                setShowInRengoManagementPane((prev) => [challenge_id, ...prev]);
                setRengoManagePaneLock((prev) => ({ ...prev, [challenge_id]: false }));
            }
        },
        [show_in_rengo_management_pane, closeChallengeManagementPane],
    );

    React.useEffect(() => {
        window.document.title = _("Play");
        onResize();

        seekgraph.current = new SeekGraph({
            canvas,
            filter: default_filter as ChallengeFilter,
        });
        seekgraph.current.on("challenges", updateChallenges);

        const [match, id] = window.location.hash.match(/#rengo:(\d+)/) || [];
        if (match) {
            openRengoChallengePane(parseInt(id));
        }

        return () => {
            seekgraph.current?.destroy();
            if (list_freeze_timeout.current) {
                clearTimeout(list_freeze_timeout.current);
                list_freeze_timeout.current = undefined;
            }
        };
    }, []);

    React.useEffect(() => {
        if (!freeze_challenge_list && Object.keys(pending_challenges).length) {
            updateChallenges(pending_challenges);
        }
    }, [freeze_challenge_list, Object.keys(pending_challenges).length]);

    const corr_automatcher_uuids = Object.keys(
        automatch_manager.active_correspondence_automatchers,
    );
    const corr_automatchers = corr_automatcher_uuids.map(
        (uuid) => automatch_manager.active_correspondence_automatchers[uuid],
    );
    corr_automatchers.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
    const showSeekGraph = preferences.get("show-seek-graph");

    const ctx = React.useMemo(() => {
        return {
            closeChallengeManagementPane,
            cancelOpenRengoChallenge,
            unNominateForRengoChallenge,
            setPaneLock,
            toggleRengoChallengePane,
            cancelOpenChallenge,
            unfreezeChallenges,
        };
    }, [
        closeChallengeManagementPane,
        cancelOpenRengoChallenge,
        unNominateForRengoChallenge,
        setPaneLock,
        toggleRengoChallengePane,
        cancelOpenChallenge,
        unfreezeChallenges,
    ]);

    return (
        <PlayContext.Provider value={ctx}>
            <div className="Play container">
                <div className="row">
                    <div className="col-sm-6 play-column">
                        <Card>
                            <FindGame
                                own_rengo_challenges_pending={ownRengoChallengesPending()}
                                joined_rengo_challenges_pending={joinedRengoChallengesPending()}
                                live_own_challenge_pending={liveOwnChallengePending()}
                                live_list={live_list}
                                rengo_list={rengo_list}
                                rengo_manage_pane_lock={rengo_manage_pane_lock}
                            />
                        </Card>
                    </div>
                    {showSeekGraph && (
                        <div className="col-sm-6 play-column">
                            <Card>
                                <div ref={ref_container} className="seek-graph-container">
                                    <OgsResizeDetector
                                        onResize={onResize}
                                        targetRef={ref_container}
                                    />
                                    <PersistentElement elt={canvas} />
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
                <div className="row">
                    <SeekGraphLegend
                        filter={filter}
                        showIcons={preferences.get("show-seek-graph")}
                        toggleHandler={toggleFilterHandler}
                    ></SeekGraphLegend>
                </div>

                <div id="challenge-list-container">
                    <div id="challenge-list-inner-container">
                        <div id="challenge-list" onMouseMove={freezeChallenges}>
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="cell break">
                                        {_("Your Automatch Requests")}
                                    </span>
                                    <CellBreaks width={7} />
                                </div>
                            )}
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="head">{/* buttons */}</span>
                                    <span className="head">{_("Rank")}</span>
                                    <span className="head">{_("Size")}</span>
                                    <span className="head">{_("Time Control")}</span>
                                    <span className="head">{_("Handicap")}</span>
                                    <span className="head">{_("Rules")}</span>
                                </div>
                            )}
                            {corr_automatchers.map((m) => (
                                <div className="challenge-row automatch-challenge-row" key={m.uuid}>
                                    <span className="cell">
                                        <button
                                            className="reject xs"
                                            onClick={() => {
                                                automatch_manager.cancel(m.uuid);
                                            }}
                                        >
                                            {pgettext("Cancel automatch", "Cancel")}
                                        </button>
                                    </span>

                                    <span className="cell">
                                        {m.lower_rank_diff === m.upper_rank_diff ? (
                                            <span>&plusmn; {m.lower_rank_diff}</span>
                                        ) : (
                                            <span>
                                                -{m.lower_rank_diff} &nbsp; +{m.upper_rank_diff}
                                            </span>
                                        )}
                                    </span>

                                    <span className="cell">
                                        {m.size_speed_options
                                            .filter((x) => x.speed === "correspondence")
                                            .map((x) => x.size)
                                            .join(",")}
                                    </span>

                                    <span className={m.time_control.condition + " cell"}>
                                        {m.time_control.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : timeControlSystemText(m.time_control.value.system)}
                                    </span>

                                    <span className={m.handicap.condition + " cell"}>
                                        {m.handicap.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : m.handicap.value === "enabled"
                                              ? pgettext("Handicap enabled", "Enabled")
                                              : pgettext("Handicap disabled", "Disabled")}
                                    </span>

                                    <span className={m.rules.condition + " cell"}>
                                        {m.rules.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : rulesText(m.rules.value)}
                                    </span>
                                    <span className="cell"></span>
                                </div>
                            ))}

                            <div className="custom-games-list-header-row">{_("Custom Games")}</div>

                            <div className="challenge-row">
                                <span className="cell break">{_("Short Games")}</span>
                                <CellBreaks width={8} />
                            </div>

                            {anyChallengesToShow(filter, live_list) ? (
                                <ChallengeListHeaders />
                            ) : null}

                            <ChallengeList list={live_list} filter={filter} is_live_list={true} />

                            <div style={{ marginTop: "2em" }}></div>

                            <div className="challenge-row" style={{ marginTop: "1em" }}>
                                <span className="cell break">{_("Long Games")}</span>
                                <CellBreaks width={8} />
                            </div>

                            {anyChallengesToShow(filter, correspondence_list) ? (
                                <ChallengeListHeaders />
                            ) : null}

                            <ChallengeList list={correspondence_list} filter={filter} />

                            <div style={{ marginTop: "2em" }}></div>
                        </div>
                        {filter.showRengo && (
                            <div id="challenge-list">
                                <div className="challenge-row" style={{ marginTop: "1em" }}>
                                    <span className="cell break">{_("Rengo")}</span>
                                </div>
                                <table id="rengo-table">
                                    <thead>
                                        {anyChallengesToShow(filter, rengo_list) ? (
                                            <RengoListHeaders />
                                        ) : null}
                                    </thead>
                                    <tbody>
                                        <RengoList
                                            filter={filter}
                                            list={rengo_list}
                                            show_in_rengo_management_pane={
                                                show_in_rengo_management_pane
                                            }
                                            rengo_manage_pane_lock={rengo_manage_pane_lock}
                                        />
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PlayContext.Provider>
    );
}

function challenge_sort(A: Challenge, B: Challenge) {
    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }

    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    const t = A.username.localeCompare(B.username);
    if (t) {
        return t;
    }

    if (A.ranked && !B.ranked) {
        return -1;
    }
    if (!A.ranked && B.ranked) {
        return 1;
    }

    return A.challenge_id - B.challenge_id;
}

export function time_per_move_challenge_sort(A: Challenge, B: Challenge) {
    const comparison = Math.sign(A.time_per_move - B.time_per_move);

    if (comparison) {
        return comparison;
    }

    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }
    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    const createdA = A.created ? new Date(A.created).getTime() : -Infinity;
    const createdB = B.created ? new Date(B.created).getTime() : -Infinity;
    return createdA - createdB;
}
