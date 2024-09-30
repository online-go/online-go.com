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
import { del } from "@/lib/requests";

import * as preferences from "@/lib/preferences";
import * as player_cache from "@/lib/player_cache";
import * as rengo_utils from "@/lib/rengo_utils";
import { OgsResizeDetector } from "@/components/OgsResizeDetector";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { Card } from "@/components/material";
import { SeekGraph, SeekGraphLegend } from "@/components/SeekGraph";
import { PersistentElement } from "@/components/PersistentElement";
import {
    isLiveGame,
    shortShortTimeControl,
    timeControlSystemText,
    usedForCheating,
} from "@/components/TimeControl";
import { challenge, challengeComputer } from "@/components/ChallengeModal";
import { openGameAcceptModal } from "@/components/GameAcceptModal";
import { errorAlerter, rulesText, dup, uuid, ignore } from "@/lib/misc";
import { Player } from "@/components/Player";
import { openAutomatchSettings, getAutomatchSettings } from "@/components/AutomatchSettings";
import { automatch_manager, AutomatchPreferences } from "@/lib/automatch_manager";
import { bot_count } from "@/lib/bots";
import { CreatedChallengeInfo } from "@/lib/types";
import { ChallengeLinkButton } from "@/components/ChallengeLinkButton";
import { allocateCanvasOrError, Speed } from "goban";

import { alert } from "@/lib/swal_config";
import { Size } from "@/lib/types";

import { RengoManagementPane } from "@/components/RengoManagementPane";
import { RengoTeamManagementPane } from "@/components/RengoTeamManagementPane";
import {
    Challenge,
    ChallengeFilter,
    ChallengeFilterKey,
    shouldDisplayChallenge,
} from "@/lib/challenge_utils";
import { useData, useRefresh, useUser } from "@/lib/hooks";

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

const PlayContext = React.createContext<{
    closeChallengeManagementPane: (challenge_id: number) => void;
    cancelOpenRengoChallenge: (challenge: Challenge) => void;
    unNominateForRengoChallenge: (challenge: Challenge) => void;
    setPaneLock: (id: number, lock: boolean) => void;
    toggleRengoChallengePane: (challenge_id: number) => void;
    cancelOpenChallenge: (challenge: Challenge) => void;
}>(undefined as any);

export function Play(): JSX.Element {
    const ref_container: React.RefObject<HTMLDivElement> = React.createRef();
    const canvas: HTMLCanvasElement = React.useMemo(() => allocateCanvasOrError(), []);

    //static contextType: React.Context<DynamicHelp.AppApi> = DynamicHelp.Api;
    //declare context: React.ContextType<typeof DynamicHelp.Api>;

    const list_freeze_timeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    const seekgraph: SeekGraph = React.useMemo<SeekGraph>(
        () =>
            new SeekGraph({
                canvas,
                filter: default_filter as ChallengeFilter,
            }),
        [],
    );

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

    const onResize = () => {
        if (!ref_container.current) {
            return;
        }

        const w = ref_container.current.offsetWidth;
        const h = ref_container.current.offsetHeight;
        if (w !== seekgraph.width || h !== seekgraph.height) {
            seekgraph.resize(w, h);
        }
        if (w === 0 || h === 0) {
            // Wait for positive size
            setTimeout(onResize, 500);
        }
    };

    const updateChallenges = (challenges: { [id: number]: Challenge }) => {
        if (freeze_challenge_list) {
            const live = live_list;
            const corr = correspondence_list;
            const rengo = rengo_list;
            for (const list of [live, corr, rengo]) {
                for (const i in list) {
                    const id = list[i].challenge_id;
                    if (!challenges[id]) {
                        // console.log("Challenge went away:", id);
                        list[i].removed = true;
                        list[i].ineligible_reason = _(
                            "challenge no longer available",
                        ); /* translator: the person can't accept this challenge because it has been removed or accepted already */
                    }
                }
            }
            //console.log("pending list store...");
            setPendingChallenges(challenges);
            setLiveList(live);
            setCorrespondenceList(corr);
            return;
        }

        //console.log("Updating challenges with:", challenges);
        const live: any[] = [];
        const corr: any[] = [];
        const rengo: any[] = [];
        for (const i in challenges) {
            const C = challenges[i];
            player_cache
                .fetch(C.user_id)
                .then(() => 0)
                .catch(ignore); /* just get the user data ready ready if we don't already have it */
            C.ranked_text = C.ranked ? _("Yes") : _("No");
            if (C.handicap === -1) {
                C.handicap_text = _("Auto");
            } else if (C.handicap === 0) {
                C.handicap_text = _("No");
            } else {
                C.handicap_text = C.handicap;
            }

            // console.log(C);

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

        //console.log("list update...");
        setLiveList(live);
        setCorrespondenceList(corr);
        setRengoList(rengo);
        setPendingChallenges([]);
    };

    const setPaneLock = (id: number, lock: boolean) => {
        setRengoManagePaneLock({ ...rengo_manage_pane_lock, [id]: lock });
    };

    const cancelOpenRengoChallenge = (challenge: Challenge) => {
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
    };

    const cancelOpenChallenge = (challenge: Challenge) => {
        del(`challenges/${challenge.challenge_id}`).catch(errorAlerter);
        unfreezeChallenges();
    };

    const toggleFilterHandler = (key: ChallengeFilterKey) => {
        const newValue = !filter[key];
        const newFilter = { ...filter };
        newFilter[key] = newValue;
        if (seekgraph) {
            seekgraph.setFilter(newFilter);
        }
        const pref_key = filterPreferenceMapping.get(key);
        if (pref_key) {
            preferences.set(pref_key, newValue);
        }
        setFilter(newFilter);
    };

    const liveOwnChallengePending = (): Challenge | undefined => {
        // a user should have only one of these at any time
        return live_list.find((c) => c.user_challenge);
    };

    const ownRengoChallengesPending = (): Challenge[] => {
        // multiple correspondence are possible, plus one live
        return rengo_list.filter((c) => c.user_challenge);
    };

    const joinedRengoChallengesPending = (): Challenge[] => {
        // multiple correspondence are possible, plus one live
        const user_id = data.get("config.user").id;
        return rengo_list.filter(
            (c) => c["rengo_participants"].includes(user_id) && !c.user_challenge,
        );
    };

    const freezeChallenges = () => {
        if (list_freeze_timeout.current) {
            clearTimeout(list_freeze_timeout.current);
        }
        if (!freeze_challenge_list) {
            //console.log("Freeze challenges...");
            setFreezeChallengeList(true);
        }
        list_freeze_timeout.current = setTimeout(unfreezeChallenges, CHALLENGE_LIST_FREEZE_PERIOD);
    };

    const unfreezeChallenges = () => {
        //console.log("Unfreeze challenges...");
        setFreezeChallengeList(false);
        if (list_freeze_timeout.current) {
            clearTimeout(list_freeze_timeout.current);
            list_freeze_timeout.current = undefined;
        }
    };

    const unNominateForRengoChallenge = (C: Challenge) => {
        closeChallengeManagementPane(C.challenge_id);

        rengo_utils.unNominate(C).catch(errorAlerter);
    };

    const openRengoChallengePane = (challenge_id: number) => {
        if (!show_in_rengo_management_pane.includes(challenge_id)) {
            setShowInRengoManagementPane([challenge_id, ...show_in_rengo_management_pane]);
        }
    };

    const toggleRengoChallengePane = (challenge_id: number) => {
        if (show_in_rengo_management_pane.includes(challenge_id)) {
            closeChallengeManagementPane(challenge_id);
        } else {
            setShowInRengoManagementPane([challenge_id, ...show_in_rengo_management_pane]);
            setRengoManagePaneLock({ ...rengo_manage_pane_lock, [challenge_id]: false });
        }
    };

    const closeChallengeManagementPane = (challenge_id: number) => {
        if (show_in_rengo_management_pane.includes(challenge_id)) {
            setShowInRengoManagementPane(
                show_in_rengo_management_pane.filter((c) => c !== challenge_id),
            );
        }
    };

    React.useEffect(() => {
        window.document.title = _("Play");
        onResize();
        seekgraph.on("challenges", updateChallenges as any);

        const [match, id] = window.location.hash.match(/#rengo:(\d+)/) || [];
        if (match) {
            openRengoChallengePane(parseInt(id));
        }

        return () => {
            seekgraph.destroy();
            if (list_freeze_timeout.current) {
                clearTimeout(list_freeze_timeout.current);
                list_freeze_timeout.current = undefined;
            }
        };
    }, []);

    React.useEffect(() => {
        updateChallenges(pending_challenges);
    }, [freeze_challenge_list, Object.keys(pending_challenges).length]);

    const corr_automatcher_uuids = Object.keys(
        automatch_manager.active_correspondence_automatchers,
    );
    const corr_automatchers = corr_automatcher_uuids.map(
        (uuid) => automatch_manager.active_correspondence_automatchers[uuid],
    );
    corr_automatchers.sort((a, b) => (a.timestamp as number) - (b.timestamp as number));
    const showSeekGraph = preferences.get("show-seek-graph");

    return (
        <PlayContext.Provider
            value={{
                closeChallengeManagementPane,
                cancelOpenRengoChallenge,
                unNominateForRengoChallenge,
                setPaneLock,
                toggleRengoChallengePane,
                cancelOpenChallenge,
            }}
        >
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

                            <ChallengeList
                                list={live_list}
                                filter={filter}
                                is_live_list={true}
                                unfreezeChallenges={unfreezeChallenges}
                                cancelOpenChallenge={cancelOpenChallenge}
                            />

                            <div style={{ marginTop: "2em" }}></div>

                            <div className="challenge-row" style={{ marginTop: "1em" }}>
                                <span className="cell break">{_("Long Games")}</span>
                                <CellBreaks width={8} />
                            </div>

                            {anyChallengesToShow(filter, correspondence_list) ? (
                                <ChallengeListHeaders />
                            ) : null}

                            <ChallengeList
                                list={correspondence_list}
                                filter={filter}
                                unfreezeChallenges={unfreezeChallenges}
                                cancelOpenChallenge={cancelOpenChallenge}
                            />

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

function suspectChallengeIcon(C: Challenge): JSX.Element | null {
    /* Mark eligible suspect games with a warning icon and warning explanation popup.
           We do let users see the warning for their own challenges. */
    return (
        (((C.eligible || C.user_challenge) &&
            !C.removed &&
            (C.komi !== null ||
                usedForCheating(C.time_control_parameters) ||
                (C.handicap !== 0 && C.handicap !== -1))) ||
            null) && (
            <span className="suspect-challenge">
                <i className="cheat-alert fa fa-exclamation-triangle fa-xs" />
                <p className="cheat-alert-tooltip-text">
                    {(C.komi !== null
                        ? pgettext("Warning for users accepting game", "Custom komi") +
                          ": " +
                          C.komi +
                          " "
                        : "") +
                        (usedForCheating(C.time_control_parameters)
                            ? pgettext("Warning for users accepting game", "Unusual time setting") +
                              " "
                            : "") +
                        (C.handicap !== 0 && C.handicap !== -1
                            ? pgettext("Warning for users accepting game", "Custom handicap") +
                              ": " +
                              C.handicap_text
                            : "")}
                </p>
            </span>
        )
    );
}

function anyChallengesToShow(filter: ChallengeFilter, challenge_list: Challenge[]): boolean {
    return (
        (filter.showIneligible && (challenge_list.length as any)) ||
        challenge_list.reduce((accumulator, current) => {
            return accumulator || current.eligible || !!current.user_challenge;
        }, false)
    );
}

interface ChallengeListProps {
    list: Challenge[];
    filter: ChallengeFilter;
    is_live_list?: boolean;
    unfreezeChallenges: () => void;
    cancelOpenChallenge: (challenge: Challenge) => void;
}

function ChallengeList({
    filter,
    list,
    is_live_list,
    unfreezeChallenges,
    cancelOpenChallenge,
}: ChallengeListProps): (JSX.Element | null)[] | JSX.Element {
    const user = useUser();

    const timeControlClassName = (config: any) => {
        // This appears to be bolding live games compared to blitz?
        const isBold = is_live_list && (config.time_per_move > 3600 || config.time_per_move === 0);
        return "cell " + (isBold ? "bold" : "");
    };

    if (!anyChallengesToShow(filter, list)) {
        return (
            <div className="ineligible">
                {
                    filter.showIneligible
                        ? _(
                              "(none)",
                          ) /* translators: There are no challenges in the system, nothing to list here */
                        : _(
                              "(none available)",
                          ) /* translators: There are no challenges that this person is eligible for */
                }
            </div>
        );
    }

    const acceptOpenChallenge = (challenge: Challenge) => {
        if (user.anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        openGameAcceptModal(challenge)
            .then((challenge) => {
                browserHistory.push(`/game/${challenge.game_id}`);
                //window['openGame'](obj.game);_
                unfreezeChallenges();
            })
            .catch(errorAlerter);
    };

    return list.map((C) =>
        shouldDisplayChallenge(C, filter) ? (
            <div key={C.challenge_id} className={"challenge-row"}>
                <span className={"cell"} style={{ textAlign: "center" }}>
                    {user.is_moderator && (
                        <button
                            onClick={() => cancelOpenChallenge(C)}
                            className="btn danger xs pull-left "
                        >
                            <i className="fa fa-trash" />
                        </button>
                    )}

                    {((C.eligible && !C.removed) || null) && (
                        <button onClick={() => acceptOpenChallenge(C)} className="btn success xs">
                            {_("Accept")}
                        </button>
                    )}

                    {(C.user_challenge || null) && (
                        <button onClick={() => cancelOpenChallenge(C)} className="btn reject xs">
                            {_("Remove")}
                        </button>
                    )}

                    {suspectChallengeIcon(C)}

                    {(((!C.eligible || C.removed) && !C.user_challenge) || null) && (
                        <span className="ineligible" title={C.ineligible_reason}>
                            {_("Can't accept")}
                        </span>
                    )}
                </span>
                <span
                    className="cell"
                    style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}
                >
                    <Player user={extractUser(C)} rank={true} />
                </span>
                <span
                    className={
                        "cell " +
                        (C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)
                            ? "bold"
                            : "")
                    }
                >
                    {C.width}x{C.height}
                </span>
                <span className={timeControlClassName(C)}>
                    {shortShortTimeControl(C.time_control_parameters)}
                </span>
                <span className="cell">{C.ranked_text}</span>
                <span className="cell">{C.handicap_text}</span>
                <span className="cell">{C.komi_text}</span>
                <span className="cell">{C.name}</span>
                <span className="cell">{rulesText(C.rules)}</span>
                <span className="cell">
                    {(C.user_challenge || null) && <ChallengeLinkButton uuid={C.uuid} />}
                </span>
            </div>
        ) : null,
    );
}

function CellBreaks({ width }: { width: number }): JSX.Element[] {
    const result: JSX.Element[] = [];
    for (let i = 0; i < width; ++i) {
        result.push(<span key={i} className="cell break"></span>);
    }
    return result;
}

function ChallengeListHeaders(): JSX.Element {
    return (
        <div className="challenge-row">
            <span className="head">{/* buttons */}</span>
            <span className="head">{_("Player")}</span>
            {/* <span className="head">{_("Rank")}</span> */}
            <span className="head">{_("Size")}</span>
            <span className="head time-control-header">{_("Time")}</span>
            <span className="head">{_("Ranked")}</span>
            <span className="head">{_("Handicap")}</span>
            <span className="head">{_("Komi")}</span>
            <span className="head" style={{ textAlign: "left" }}>
                {_("Name")}
            </span>
            <span className="head" style={{ textAlign: "left" }}>
                {_("Rules")}
            </span>
            <span className="head">{/* invite link */}</span>
        </div>
    );
}

function RengoListHeaders(): JSX.Element {
    return (
        <>
            <tr className="challenge-row">
                <td className="head " style={{ textAlign: "right" }}>
                    {/* buttons */ ""}
                </td>
                <td className="head organizer">{_("Organizer")}</td>
                {/* <td className="head">{_("Rank")}</td> */}
                <td className="head size">{_("Size")}</td>
                <td className="head time-control-header">{_("Time")}</td>
                <td className="head">{_("Casual")}</td>
                <td className="head">{_("Auto-Start")}</td>
                <td className="head">{_("Signed up")}</td>
                <td className="head">{_("Handicap")}</td>
                <td className="head">{_("Komi")}</td>
                <td className="head" style={{ textAlign: "left" }}>
                    {_("Name")}
                </td>
                <td className="head" style={{ textAlign: "left" }}>
                    {/* invite link */ ""}
                </td>
            </tr>
        </>
    );
}

interface RengoComponentProps {
    list: Challenge[];
    filter: ChallengeFilter;
    show_in_rengo_management_pane: number[];
    challenge?: Challenge;
    rengo_manage_pane_lock: { [id: number]: boolean };
}

function RengoList(props: RengoComponentProps): JSX.Element {
    const filter = props.filter;
    const list = props.list;

    if (!anyChallengesToShow(filter, list)) {
        return (
            <tr key="none-available">
                <td colSpan={9}>
                    <div className="ineligible">
                        {
                            filter.showIneligible
                                ? _(
                                      "(none)",
                                  ) /* translators: There are no challenges in the system, nothing to list here */
                                : _(
                                      "(none available)",
                                  ) /* translators: There are no challenges that this person is eligible for */
                        }
                    </div>
                </td>
            </tr>
        );
    }

    const live_list = list.filter((c) => isLiveGame(c.time_control_parameters, c.width, c.height));
    const corr_list = list.filter((c) => !isLiveGame(c.time_control_parameters, c.width, c.height));

    return (
        <>
            <tr className="challenge-row">
                <td className="cell">{_("Live:")}</td>
            </tr>
            <RengoChallengeManagementList {...props} list={live_list} key="live" />

            <tr className="challenge-row">
                <td className="cell" colSpan={10}>
                    <hr />
                </td>
            </tr>

            <tr className="challenge-row">
                <td className="cell">{_("Correspondence:")}</td>
            </tr>
            <RengoChallengeManagementList {...props} list={corr_list} key="corr" />
        </>
    );
}

function RengoChallengeManagementList(props: RengoComponentProps): JSX.Element {
    const filter = props.filter;
    const list = props.list;

    return (
        <>
            {!anyChallengesToShow(filter, list) ? (
                <tr className="ineligible" key="correspondence-ineligible">
                    <td style={{ textAlign: "center" }}>
                        {
                            filter.showIneligible
                                ? _(
                                      "(none)",
                                  ) /* translators: There are no challenges in the system, nothing to list here */
                                : _(
                                      "(none available)",
                                  ) /* translators: There are no challenges that this person is eligible for */
                        }
                    </td>
                </tr>
            ) : (
                list.map(
                    (C) =>
                        (shouldDisplayChallenge(C, filter) || null) && (
                            <React.Fragment key={C.challenge_id}>
                                <RengoListItem {...props} challenge={C} />
                                {(props.show_in_rengo_management_pane.includes(C.challenge_id) ||
                                    null) && <RengoManageListItem {...props} challenge={C} />}
                            </React.Fragment>
                        ),
                )
            )}
        </>
    );
}

function RengoManageListItem(props: RengoComponentProps): JSX.Element {
    const challenge = props.challenge;
    const user = useUser();
    const ctx = React.useContext(PlayContext);

    if (!challenge) {
        throw new Error("No challenge provided");
    }

    const startOwnRengoChallenge = (challenge: Challenge): Promise<void> => {
        // stop the person from pressing "Start" twice impatiently, while we get around to removing this challenge
        ctx.closeChallengeManagementPane(challenge.challenge_id);
        return rengo_utils.startOwnRengoChallenge(challenge);
    };

    return (
        <tr className={"challenge-row rengo-management-row"}>
            <td className="cell" colSpan={10}>
                <Card className="rengo-management-list-item">
                    <div className="rengo-management-header">
                        <span>{challenge.name}</span>
                        <div>
                            <i
                                className="fa fa-lg fa-times-circle-o"
                                onClick={() =>
                                    ctx.closeChallengeManagementPane.bind(challenge.challenge_id)
                                }
                            />
                        </div>
                    </div>
                    <RengoManagementPane
                        challenge_id={challenge.challenge_id}
                        rengo_challenge_list={props.list}
                        startRengoChallenge={startOwnRengoChallenge}
                        cancelChallenge={ctx.cancelOpenRengoChallenge}
                        withdrawFromRengoChallenge={ctx.unNominateForRengoChallenge}
                        joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                        dontShowCancelButton={true}
                        lock={props.rengo_manage_pane_lock[challenge.challenge_id]}
                    >
                        <RengoTeamManagementPane
                            challenge_id={challenge.challenge_id}
                            challenge_list={props.list}
                            moderator={user.is_moderator}
                            show_chat={true}
                            assignToTeam={rengo_utils.assignToTeam}
                            kickRengoUser={rengo_utils.kickRengoUser}
                            locked={props.rengo_manage_pane_lock[challenge.challenge_id]}
                            lock={(lock: boolean) => ctx.setPaneLock(challenge.challenge_id, lock)}
                        />
                    </RengoManagementPane>
                </Card>
            </td>
        </tr>
    );
}

function RengoListItem(props: RengoComponentProps): JSX.Element {
    const ctx = React.useContext(PlayContext);
    const challenge = props.challenge;
    const user = useUser();

    if (!challenge) {
        throw new Error("No challenge provided");
    }

    const rengo_casual_mode_text: string = challenge.rengo_casual_mode ? _("Yes") : _("No");
    const rengo_auto_start_text: number | string = challenge.rengo_auto_start || "-";

    const nominateAndShow = (challenge: Challenge) => {
        ctx.toggleRengoChallengePane(challenge.challenge_id);
        rengo_utils.nominateForRengoChallenge(challenge).catch(errorAlerter);
    };

    return (
        <tr className={"challenge-row"}>
            <td className={"cell rengo-list-buttons"}>
                {user.is_moderator && (
                    <button
                        onClick={() => ctx.cancelOpenRengoChallenge(challenge)}
                        className="btn danger xs pull-left "
                    >
                        <i className="fa fa-trash" />
                    </button>
                )}

                {(challenge.user_challenge || null) && (
                    <button
                        onClick={() => ctx.cancelOpenRengoChallenge(challenge)}
                        className="btn reject xs"
                    >
                        {_("Remove")}
                    </button>
                )}

                {((challenge.eligible &&
                    !challenge.removed &&
                    !challenge.user_challenge &&
                    challenge.rengo_participants.includes(user.id)) ||
                    null) && (
                    <button
                        onClick={() => ctx.unNominateForRengoChallenge(challenge)}
                        className="btn danger xs"
                    >
                        {_("Withdraw")}
                    </button>
                )}

                <button
                    onClick={() => ctx.toggleRengoChallengePane(challenge.challenge_id)}
                    className="btn primary xs"
                >
                    {challenge.user_challenge ? _("Manage") : _("View")}
                </button>

                {((challenge.eligible &&
                    !challenge.removed &&
                    !challenge.user_challenge &&
                    !challenge.rengo_participants.includes(user.id)) ||
                    null) && (
                    <button onClick={() => nominateAndShow(challenge)} className="btn success xs">
                        {_("Join")}
                    </button>
                )}

                {suspectChallengeIcon(challenge)}

                {(((!challenge.eligible || challenge.removed) && !challenge.user_challenge) ||
                    null) && (
                    <span className="ineligible" title={challenge.ineligible_reason}>
                        {_("Can't accept")}
                    </span>
                )}
            </td>
            <td
                className="cell"
                style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}
            >
                <Player user={extractUser(challenge)} rank={true} />
            </td>
            <td
                className={
                    "cell " +
                    (challenge.width !== challenge.height ||
                    (challenge.width !== 9 && challenge.width !== 13 && challenge.width !== 19)
                        ? "bold"
                        : "")
                }
            >
                {challenge.width}x{challenge.height}
            </td>
            <td>{shortShortTimeControl(challenge.time_control_parameters)}</td>
            <td className="cell">{rengo_casual_mode_text}</td>
            <td className="cell">{rengo_auto_start_text}</td>
            <td className="cell">{challenge.rengo_participants.length}</td>
            <td className="cell">{challenge.handicap_text}</td>
            <td className="cell">{challenge.komi_text}</td>
            <td className="cell">{challenge.name}</td>
            <td className="cell">
                {(challenge.user_challenge || null) && (
                    <ChallengeLinkButton uuid={challenge.uuid} />
                )}
            </td>
        </tr>
    );
}

function extractUser(challenge: Challenge) {
    return {
        id: challenge.user_id,
        username: challenge.username,
        rank: challenge.rank,
        professional: !!challenge.pro,
    };
}

interface FindGameProps {
    own_rengo_challenges_pending: Challenge[];
    joined_rengo_challenges_pending: Challenge[];
    live_own_challenge_pending: Challenge | undefined;
    live_list: Challenge[];
    rengo_list: Challenge[];
    rengo_manage_pane_lock: { [key: number]: boolean };
}

function FindGame(props: FindGameProps): JSX.Element {
    const ctx = React.useContext(PlayContext);
    const refresh = useRefresh();
    const [automatch_size_options, setAutomatchSizeOptions] = useData("automatch.size_options", [
        "9x9",
        "13x13",
        "19x19",
    ]);
    const [correspondence_spinner, setCorrespondenceSpinner] = React.useState(false);

    React.useEffect(() => {
        automatch_manager.on("entry", refresh);
        automatch_manager.on("start", refresh);
        automatch_manager.on("cancel", refresh);

        return () => {
            automatch_manager.off("entry", refresh);
            automatch_manager.off("start", refresh);
            automatch_manager.off("cancel", refresh);
        };
    }, []);

    const size_enabled = (size: Size) => {
        return automatch_size_options.indexOf(size) >= 0;
    };

    const own_live_rengo_challenge = props.own_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );
    const joined_live_rengo_challenge = props.joined_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );

    const rengo_challenge_to_show = own_live_rengo_challenge || joined_live_rengo_challenge;

    const user = useUser();
    const anon = user.anonymous;
    const warned = user.has_active_warning_flag;

    const cancelActiveAutomatch = () => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        refresh();
    };

    const cancelOwnChallenges = (challenge_list: Challenge[]) => {
        challenge_list.forEach((c) => {
            if (c.user_challenge) {
                ctx.cancelOpenChallenge(c);
            }
        });
    };

    const toggleSize = (size: Size) => {
        let size_options = dup(automatch_size_options);
        if (size_options.indexOf(size) >= 0) {
            size_options = size_options.filter((x) => x !== size);
        } else {
            size_options.push(size);
        }
        if (size_options.length === 0) {
            size_options.push("19x19");
        }
        setAutomatchSizeOptions(size_options);
    };

    const findMatch = (speed: Speed) => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        const settings = getAutomatchSettings(speed);
        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options: automatch_size_options.map((size) => {
                return {
                    size: size,
                    speed: speed,
                };
            }),
            lower_rank_diff: settings.lower_rank_diff,
            upper_rank_diff: settings.upper_rank_diff,
            rules: {
                condition: settings.rules.condition,
                value: settings.rules.value,
            },
            time_control: {
                condition: settings.time_control.condition,
                value: settings.time_control.value,
            },
            handicap: {
                condition: settings.handicap.condition,
                value: settings.handicap.value,
            },
        };
        preferences.uuid = uuid();
        automatch_manager.findMatch(preferences);
        refresh();

        if (speed === "correspondence") {
            setCorrespondenceSpinner(true);
        }
    };

    const dismissCorrespondenceSpinner = () => {
        setCorrespondenceSpinner(false);
    };

    const newComputerGame = () => {
        if (bot_count() === 0) {
            void alert.fire(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    };

    const newCustomGame = () => {
        const challengeCreated = (c: CreatedChallengeInfo) => {
            if (c.rengo && !c.live) {
                ctx.toggleRengoChallengePane(c.challenge_id);
            }
        };

        challenge(undefined, undefined, undefined, undefined, challengeCreated);
    };

    //  Construction of the pane we need to show...
    if (automatch_manager.active_live_automatcher) {
        return (
            <div className="automatch-container">
                <div className="automatch-header">{_("Finding you a game...")}</div>
                <div className="automatch-row-container">
                    <div className="spinner">
                        <div className="double-bounce1"></div>
                        <div className="double-bounce2"></div>
                    </div>
                </div>
                <div className="automatch-settings">
                    <button className="danger sm" onClick={cancelActiveAutomatch}>
                        {pgettext("Cancel automatch", "Cancel")}
                    </button>
                </div>
            </div>
        );
    } else if (props.live_own_challenge_pending) {
        return (
            <div className="automatch-container">
                <div className="automatch-header">{_("Waiting for opponent...")}</div>
                <div className="automatch-row-container">
                    <div className="spinner">
                        <div className="double-bounce1"></div>
                        <div className="double-bounce2"></div>
                    </div>
                </div>
                <div className="automatch-settings">
                    <button
                        className="danger sm"
                        onClick={() => cancelOwnChallenges(props.live_list)}
                    >
                        {pgettext("Cancel challenge", "Cancel")}
                    </button>
                </div>
            </div>
        );
    } else if (rengo_challenge_to_show) {
        return (
            <div className="automatch-container">
                <div className="rengo-live-match-header">
                    <div className="small-spinner">
                        <div className="double-bounce1"></div>
                        <div className="double-bounce2"></div>
                    </div>
                </div>
                <RengoManagementPane
                    challenge_id={rengo_challenge_to_show.challenge_id}
                    rengo_challenge_list={props.rengo_list}
                    startRengoChallenge={rengo_utils.startOwnRengoChallenge}
                    cancelChallenge={ctx.cancelOpenRengoChallenge}
                    withdrawFromRengoChallenge={ctx.unNominateForRengoChallenge}
                    joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                    lock={props.rengo_manage_pane_lock[rengo_challenge_to_show.challenge_id]}
                >
                    <RengoTeamManagementPane
                        challenge_id={rengo_challenge_to_show.challenge_id}
                        challenge_list={props.rengo_list}
                        moderator={user.is_moderator}
                        show_chat={false}
                        assignToTeam={rengo_utils.assignToTeam}
                        kickRengoUser={rengo_utils.kickRengoUser}
                        locked={props.rengo_manage_pane_lock[rengo_challenge_to_show.challenge_id]}
                        lock={(lock: boolean) =>
                            ctx.setPaneLock(rengo_challenge_to_show.challenge_id, lock)
                        }
                    />
                </RengoManagementPane>
            </div>
        );
    } else if (correspondence_spinner) {
        return (
            <div className="automatch-container">
                <div className="automatch-header">{_("Finding you a game...")}</div>
                <div className="automatch-settings-corr">
                    {_(
                        'This can take several minutes. You will be notified when your match has been found. To view or cancel your automatch requests, please see the list below labeled "Your Automatch Requests".',
                    )}
                </div>
                <div className="automatch-row-container">
                    <button className="primary" onClick={dismissCorrespondenceSpinner}>
                        {_(
                            pgettext(
                                "Dismiss the 'finding correspondence automatch' message",
                                "Got it",
                            ),
                        )}
                    </button>
                </div>
            </div>
        );
    } else {
        return (
            <div className="automatch-container">
                <div className="automatch-header">
                    <div>{_("Automatch finder")}</div>
                    <div className="btn-group">
                        <button
                            className={size_enabled("9x9") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("9x9")}
                        >
                            9x9
                        </button>
                        <button
                            className={size_enabled("13x13") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("13x13")}
                        >
                            13x13
                        </button>
                        <button
                            className={size_enabled("19x19") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("19x19")}
                        >
                            19x19
                        </button>
                    </div>
                    <div className="automatch-settings">
                        <span
                            className="automatch-settings-link fake-link"
                            onClick={openAutomatchSettings}
                        >
                            <i className="fa fa-gear" />
                            {_("Settings ")}
                        </span>
                    </div>
                </div>
                <div className="automatch-row-container">
                    <div className="automatch-row">
                        <button
                            className="primary"
                            onClick={() => findMatch("blitz")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-bolt" /> {_("Blitz")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~10s per move")}
                                </span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("live")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-clock-o" /> {_("Normal")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~30s per move")}
                                </span>
                            </div>
                        </button>
                    </div>
                    <div className="automatch-row">
                        <button
                            className="primary"
                            onClick={newComputerGame}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-desktop" /> {_("Computer")}
                                <span className="time-per-move"></span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("correspondence")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <span>
                                    <i className="ogs-turtle" /> {_("Correspondence")}
                                </span>
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~1 day per move")}
                                </span>
                            </div>
                        </button>
                    </div>
                    <div className="custom-game-header">
                        <div>{_("Custom Game")}</div>
                    </div>
                    <div className="custom-game-row">
                        <button
                            className="primary"
                            onClick={newCustomGame}
                            disabled={anon || warned}
                        >
                            <i className="fa fa-cog" /> {_("Create")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
