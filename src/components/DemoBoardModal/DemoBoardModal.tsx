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

import { _ } from "@/lib/translate";
import React from "react";
import { allRanks, rankString } from "@/lib/rank_utils";
import { DemoBoardModalProps } from "./DemoBoardModal.types";
import { isKomiOption, isRuleSet, parseNumberInput } from "./DemoBoardModal.utils";
import { getDefaultKomi } from "../ChallengeModal/ChallengeModal.utils";
import { RuleSet } from "@/lib/types";
import * as data from "@/lib/data";

export function DemoBoardModal(
    props: DemoBoardModalProps & { eventsRef: { close: () => void } },
): React.ReactElement {
    const [name, setName] = React.useState<string>("");
    const [isPrivate, setIsPrivate] = React.useState<boolean>(false);
    const [ruleSet, setRuleSet] = React.useState<RuleSet>("japanese");
    const [blackName, setBlackName] = React.useState<string>(_("Black"));
    const [whiteName, setWhiteName] = React.useState<string>(_("White"));
    const [width, setWidth] = React.useState<number | null>(19);
    const [height, setHeight] = React.useState<number | null>(19);
    const [blackRanking, setBlackRanking] = React.useState<number>(1039);
    const [whiteRanking, setWhiteRanking] = React.useState<number>(1039);
    const [komiOption, setKomiOption] = React.useState<rest_api.KomiOption>("automatic");
    const [komi, setKomi] = React.useState<number | null>(null);
    const [isCustomBoardSize, setIsCustomBoardSize] = React.useState<boolean>(false);

    function updateRules(rules: string): void {
        if (isRuleSet(rules)) {
            setRuleSet(rules);
        }
    }
    function updateKomiOption(newKomiOption: string): void {
        if (!isKomiOption(newKomiOption)) {
            return;
        }

        const changedToCustom = newKomiOption === "custom" && komiOption !== "custom";
        if (changedToCustom) {
            setKomi(getDefaultKomi(ruleSet, false));
        }
        setKomiOption(newKomiOption);
    }
    function updateBoardSize(str: string) {
        if (str === "custom") {
            setIsCustomBoardSize(true);
            return;
        }

        setIsCustomBoardSize(false);
        const sizes = str.split("x");
        setWidth(parseInt(sizes[0]));
        setHeight(parseInt(sizes[1]));
    }

    const user = data.get("user");

    return (
        <div className="Modal DemoBoardModal">
            <div className="header">
                <h2>
                    <span> {_("Demo Board")} </span>
                </h2>
            </div>

            <div className="body">
                <div className="demo-pane-container">
                    <div className="left-pane pane" role="form">
                        {/** Name */}
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-name">
                                {_("Game Name")}
                            </label>
                            <div className="controls">
                                <input
                                    id="demo-name"
                                    type="text"
                                    value={name}
                                    onChange={(ev) => setName(ev.target.value)}
                                    placeholder={_("Game Name")}
                                ></input>
                            </div>
                        </div>

                        {/** Private */}
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-private">
                                {_("Private")}
                            </label>
                            <div className="controls checkbox-container">
                                <input
                                    type="checkbox"
                                    id="demo-private"
                                    checked={isPrivate}
                                    onChange={(ev) => setIsPrivate(ev.target.checked)}
                                ></input>
                            </div>
                        </div>
                    </div>
                    <div className="right-pane pane" role="form">
                        {/** Rules */}
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-rules">
                                {_("Rules")}
                            </label>
                            <div className="controls">
                                <select
                                    id="demo-rules"
                                    value={ruleSet}
                                    onChange={(ev) => updateRules(ev.target.value)}
                                    className="form-control"
                                >
                                    <option value="aga">{_("AGA")}</option>
                                    <option value="chinese">{_("Chinese")}</option>
                                    <option value="ing">{_("Ing SST")}</option>
                                    <option value="japanese">{_("Japanese")}</option>
                                    <option value="korean">{_("Korean")}</option>
                                    <option value="nz">{_("New Zealand")}</option>
                                </select>
                            </div>
                        </div>

                        {/** Board */}
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-board-size">
                                {_("Board Size")}
                            </label>
                            <div className="controls">
                                <select
                                    id="demo-board-size"
                                    value={isCustomBoardSize ? "custom" : `${width}x${height}`}
                                    onChange={(ev) => updateBoardSize(ev.target.value)}
                                    className="challenge-dropdown form-control"
                                >
                                    <optgroup label={_("Normal Sizes")}>
                                        <option value="19x19">19x19</option>
                                        <option value="13x13">13x13</option>
                                        <option value="9x9">9x9</option>
                                    </optgroup>
                                    <optgroup label={_("Extreme Sizes")}>
                                        <option value="25x25">25x25</option>
                                        <option value="21x21">21x21</option>
                                        <option value="5x5">5x5</option>
                                    </optgroup>
                                    <optgroup label={_("Non-Square")}>
                                        <option value="19x9">19x9</option>
                                        <option value="5x13">5x13</option>
                                    </optgroup>
                                    <optgroup label={_("Custom")}>
                                        <option value="custom">{_("Custom Size")}</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        {isCustomBoardSize && (
                            <div className="form-group">
                                <div className="control-label">
                                    {/** dummy element for layout purpose */}
                                </div>
                                <div className="controls">
                                    <input
                                        type="number"
                                        value={width ?? ""}
                                        onChange={(ev) =>
                                            setWidth(parseNumberInput(ev.target.value))
                                        }
                                        className="form-control"
                                        style={{ width: "3em" }}
                                        min="1"
                                        max="25"
                                    />
                                    x
                                    <input
                                        type="number"
                                        value={height ?? ""}
                                        onChange={(ev) =>
                                            setHeight(parseNumberInput(ev.target.value))
                                        }
                                        className="form-control"
                                        style={{ width: "3em" }}
                                        min="1"
                                        max="25"
                                    />
                                </div>
                            </div>
                        )}

                        {/** Komi */}
                        <div className="form-group">
                            <label className="control-label" htmlFor="demo-komi-option">
                                {_("Komi")}
                            </label>
                            <div className="controls">
                                <select
                                    value={komiOption}
                                    onChange={(ev) => updateKomiOption(ev.target.value)}
                                    className="form-control"
                                    id="demo-komi-option"
                                >
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option value="custom">{_("Custom")}</option>
                                </select>
                            </div>
                        </div>
                        {komiOption === "custom" && (
                            <div className="form-group">
                                <div className="control-label">
                                    {/** dummy element for layout purpose */}
                                </div>
                                <div className="controls">
                                    <input
                                        type="number"
                                        value={komi ?? ""}
                                        onChange={(ev) =>
                                            this.update_komi(parseNumberInput(ev.target.value))
                                        }
                                        className="form-control"
                                        style={{ width: "4em" }}
                                        step="0.5"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <hr></hr>

                <div className="demo-pane-container" style={{ marginTop: "1em" }}>
                    <div className="left-pane pane" role="form">
                        {PlayerControls(
                            _("Black Player"),
                            [blackName, setBlackName],
                            [blackRanking, setBlackRanking],
                            props.players_list,
                        )}
                    </div>
                    <div className="right-pane pane">
                        {PlayerControls(
                            _("White Player"),
                            [whiteName, setWhiteName],
                            [whiteRanking, setWhiteRanking],
                            props.players_list,
                        )}
                    </div>
                </div>
            </div>

            <div className="buttons">
                <button onClick={() => props.eventsRef.close()}>{_("Close")}</button>

                {/** I have not been able to open the challenge modal in demo mode without being logged in, so maybe we can remove this. */}
                {user?.anonymous && (
                    <div className="anonymous-container">
                        {_("Please sign in to play")}
                        <div>
                            <a href="/register#/play">{_("Register for Free")}</a>
                            {" | "}
                            <a href="/sign-in#/play">{_("Sign in")}</a>
                        </div>
                    </div>
                )}

                {!user?.anonymous && (
                    <button /* TODO: onClick={createDemo()} */ className="primary">
                        {_("Create Demo")}
                    </button>
                )}
            </div>
        </div>
    );
}

const demo_ranks = allRanks();

function PlayerControls(
    label: string,
    [name, setName]: [string, React.Dispatch<React.SetStateAction<string>>],
    [rank, setRank]: [number, React.Dispatch<React.SetStateAction<number>>],
    playersList: { name: string; rank: number }[] | undefined,
): React.ReactElement {
    const [selectedPlayer, setSelectedPlayer] = React.useState<number>(0);

    if (playersList === undefined) {
        return (
            <>
                <div className="form-group">
                    <label className="control-label">{label}</label>
                    <div className="controls">
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(ev) => setName(ev.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="control-label">{_("Rank")}</label>
                    <div className="controls">
                        <select
                            value={rank}
                            onChange={(ev) => setRank(parseInt(ev.target.value))}
                            className="form-control"
                        >
                            {demo_ranks.map((r, idx) => (
                                <option key={idx} value={r.rank}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </>
        );
    }

    function set(selectedPlayerIndex: number) {
        setSelectedPlayer(selectedPlayerIndex);
        const player = playersList![selectedPlayerIndex];
        setName(player.name);
        setRank(player.rank);
    }
    return (
        <div className="form-group">
            <label className="control-label">{label}</label>
            <select value={selectedPlayer} onChange={(ev) => set(parseInt(ev.target.value))}>
                {playersList.map((player, idx) => (
                    <option key={idx} value={idx}>
                        {player.name} [{rankString(player.rank)}]
                    </option>
                ))}
            </select>
        </div>
    );
}
