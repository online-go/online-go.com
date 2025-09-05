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
import { DemoBoardModalProps, shortPlayerInfo } from "./DemoBoardModal.types";
import {
    isKomiOption,
    isRuleSet,
    isStandardBoardSize,
    parseNumberInput,
} from "./DemoBoardModal.utils";
import { getDefaultKomi } from "../ChallengeModal/ChallengeModal.utils";
import { RuleSet } from "@/lib/types";
import * as data from "@/lib/data";
import { defaultInitialSettings } from "./DemoBoardModal.config";
import { DemoSettings } from "@/lib/data_schema";
import { alert } from "@/lib/swal_config";
import { post } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import { errorAlerter } from "@/lib/misc";

export function DemoBoardModal(
    props: DemoBoardModalProps & { eventsRef: { close: () => void } },
): React.ReactElement {
    const initialSettings = props.initialSettings ?? defaultInitialSettings;

    if (props.players_list?.length) {
        initialSettings.black_name = props.players_list[0].name;
        initialSettings.black_ranking = props.players_list[0].rank;
        initialSettings.white_name = props.players_list[0].name;
        initialSettings.white_ranking = props.players_list[0].rank;
    }

    const [name, setName] = React.useState<string>(initialSettings.name);
    const [isPrivate, setIsPrivate] = React.useState<boolean>(initialSettings.private);
    const [ruleSet, setRuleSet] = React.useState<RuleSet>(initialSettings.rules);
    const [blackName, setBlackName] = React.useState<string>(initialSettings.black_name);
    const [whiteName, setWhiteName] = React.useState<string>(initialSettings.white_name);
    const [width, setWidth] = React.useState<number | null>(initialSettings.width);
    const [height, setHeight] = React.useState<number | null>(initialSettings.height);
    const [blackRanking, setBlackRanking] = React.useState<number>(initialSettings.black_ranking);
    const [whiteRanking, setWhiteRanking] = React.useState<number>(initialSettings.white_ranking);
    const [komiOption, setKomiOption] = React.useState<rest_api.KomiOption>(
        initialSettings.komi_auto,
    );
    const [komi, setKomi] = React.useState<number | null>(initialSettings.komi ?? null);
    const [isCustomBoardSize, setIsCustomBoardSize] = React.useState<boolean>(
        !isStandardBoardSize(`${initialSettings.width}x${initialSettings.height}`),
    );

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

    function getValidatedSettings(): DemoSettings | null {
        if (width === null || width < 1 || width > 25) {
            document.getElementById("demo-board-modal-width")?.focus();
            void alert.fire(_("Invalid board size, please correct and try again"));
            return null;
        }
        if (height === null || height < 1 || height > 25) {
            document.getElementById("demo-board-modal-height")?.focus();
            void alert.fire(_("Invalid board size, please correct and try again"));
            return null;
        }
        if (komiOption === "custom" && komi === null) {
            document.getElementById("demo-board-modal-komi")?.focus();
            void alert.fire(_("Please enter a number for komi."));
            return null;
        }

        return {
            name: name,
            rules: ruleSet,
            width: width,
            height: height,
            black_name: blackName,
            black_ranking: blackRanking,
            white_name: whiteName,
            white_ranking: whiteRanking,
            private: isPrivate,
            komi_auto: komiOption,
            ...(komi !== null && { komi: komi }),
        };
    }

    async function createDemoBoard(): Promise<void> {
        const validatedSettings = getValidatedSettings();
        if (validatedSettings === null) {
            return;
        }

        data.set("demo.settings", validatedSettings);

        const black_pro = validatedSettings.black_ranking > 1000 ? 1 : 0;
        const white_pro = validatedSettings.white_ranking > 1000 ? 1 : 0;
        const extendedSettings = {
            ...validatedSettings,
            black_pro,
            white_pro,
            tournament_record_id: props.tournament_record_id,
            tournament_record_round_id: props.tournament_record_round_id,
            black_ranking: validatedSettings.black_ranking - (black_pro ? 1000 : 0),
            white_ranking: validatedSettings.white_ranking - (white_pro ? 1000 : 0),
            name: validatedSettings.name || _("Demo Board"),
        };

        await post("demos", extendedSettings)
            .then((res) => {
                console.log("Demo create response: ", res);
                props.eventsRef.close();
                browserHistory.push(`/demo/${res.id}`);
            })
            .catch(errorAlerter);
    }

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
                                    id="demo-board-modal-name"
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
                                    id="demo-board-modal-private"
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
                                    id="demo-board-modal-rules"
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
                                    id="demo-board-modal-board-size"
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
                                        id="demo-board-modal-width"
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
                                        id="demo-board-modal-height"
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
                                    id="demo-board-modal-komi-option"
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
                                        id="demo-board-modal-komi"
                                        type="number"
                                        value={komi ?? ""}
                                        onChange={(ev) =>
                                            setKomi(parseNumberInput(ev.target.value))
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
                            "black",
                            _("Black Player"),
                            [blackName, setBlackName],
                            [blackRanking, setBlackRanking],
                            props.players_list,
                        )}
                    </div>
                    <div className="right-pane pane">
                        {PlayerControls(
                            "white",
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
                    <button onClick={async () => await createDemoBoard()} className="primary">
                        {_("Create Demo")}
                    </button>
                )}
            </div>
        </div>
    );
}

const demo_ranks = allRanks();

function PlayerControls(
    playerColor: string,
    label: string,
    [name, setName]: [string, React.Dispatch<React.SetStateAction<string>>],
    [rank, setRank]: [number, React.Dispatch<React.SetStateAction<number>>],
    playersList: shortPlayerInfo[] | undefined,
): React.ReactElement {
    const [selectedPlayer, setSelectedPlayer] = React.useState<number>(0);

    if (playersList === undefined) {
        return (
            <>
                <div className="form-group">
                    <label className="control-label">{label}</label>
                    <div className="controls">
                        <input
                            id={`demo-board-modal-${playerColor}-name`}
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
                            id={`demo-board-modal-${playerColor}-rank`}
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

    function setSelectedPlayerIndex(selectedPlayerIndex: number) {
        setSelectedPlayer(selectedPlayerIndex);
        const selectedPlayer = playersList![selectedPlayerIndex];
        setName(selectedPlayer.name);
        setRank(selectedPlayer.rank);
    }
    return (
        <div className="form-group">
            <label className="control-label">{label}</label>
            <select
                id={`demo-board-modal-${playerColor}-player-selection`}
                value={selectedPlayer}
                onChange={(ev) => setSelectedPlayerIndex(parseInt(ev.target.value))}
            >
                {playersList.map((player, idx) => (
                    <option key={idx} value={idx}>
                        {player.name} [{rankString(player.rank)}]
                    </option>
                ))}
            </select>
        </div>
    );
}
