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
import { bots_list } from "@/lib/bots";
import { _, pgettext } from "@/lib/translate";
import * as React from "react";
import { State } from "./type";

type ChallengeModalBasicSettingsProps = {
    playerId?: number;
    mode: string;
    state: State;
    updateGameName: (name: string) => void;
    updateInviteOnly: (invite_only: boolean) => void;
    updatePrivate: (is_private: boolean) => void;
    updateRengo: (is_rengo: boolean) => void;
    updateRengoCasual: (is_casual: boolean) => void;
    updateRengoAutoStart: (auto_start: number) => void;
    rengoAutoStartInputWarning: () => boolean;
};

export const ChallengeModalBasicSettings = ({
    playerId,
    mode,
    state,
    updateGameName,
    updateInviteOnly,
    updatePrivate,
    updateRengo,
    updateRengoCasual,
    updateRengoAutoStart,
    rengoAutoStartInputWarning,
}: ChallengeModalBasicSettingsProps) => {
    const bots = bots_list();
    const selected_bot = bots.find((bot) => bot.id === state.conf.bot_id);

    const cbUpdateGameName = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateGameName(ev.target.value);
        },
        [updateGameName],
    );

    const cbUpdateInviteOnly = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateInviteOnly(ev.target.checked);
        },
        [updateInviteOnly],
    );

    const cbUpdatePrivate = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updatePrivate(ev.target.checked);
        },
        [updatePrivate],
    );

    const cbUpdateRengo = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateRengo(ev.target.checked);
        },
        [updateRengo],
    );

    const cbUpdateRengoCasual = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateRengoCasual(ev.target.checked);
        },
        [updateRengoCasual],
    );

    const cbUpdateRengoAutoStart = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const value = ev.target.value;
            updateRengoAutoStart(parseInt(value));
        },
        [updateRengoAutoStart],
    );

    return (
        <div id="challenge-basic-settings" className="left-pane pane form-horizontal" role="form">
            {mode === "computer" && (
                <div className="form-group">
                    <label className="control-label" htmlFor="engine">
                        {pgettext("Computer opponent", "AI Player")}
                    </label>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "10rem",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "8rem",
                                overflow: "hidden",
                            }}
                        >
                            {selected_bot ? selected_bot.username : ""}
                        </span>
                        {selected_bot && (
                            <a href={`/player/${selected_bot?.id}`}>
                                <i className="fa fa-external-link"></i>
                            </a>
                        )}
                    </div>
                </div>
            )}
            {mode !== "computer" && (
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge_game_name">
                        {_("Game Name")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="text"
                                value={state.challenge.game.name}
                                onChange={cbUpdateGameName}
                                className="form-control"
                                id="challenge-game-name"
                                placeholder={_("Game Name")}
                            />
                        </div>
                    </div>
                </div>
            )}
            {!(playerId || null) && mode === "open" && (
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-invite-only">
                        {pgettext(
                            "A checkbox to make a challenge open only to invited people who have the link to it",
                            "Invite-only",
                        )}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="challenge-invite-only"
                                checked={state.challenge.invite_only}
                                onChange={cbUpdateInviteOnly}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Only show Private checkbox if not in open mode, or if in open mode with invite-only checked */}
            {(mode !== "open" || state.challenge.invite_only) && (
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-private">
                        {_("Private")}
                    </label>

                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="challenge-private"
                                disabled={state.challenge.game.rengo}
                                checked={state.challenge.game.private}
                                onChange={cbUpdatePrivate}
                            />
                        </div>
                    </div>
                </div>
            )}
            {mode === "open" && (
                <div className="form-group">
                    <label className="control-label" htmlFor="rengo-option">
                        {_("Rengo")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="rengo-option"
                                disabled={
                                    !state.challenge.game.rengo &&
                                    (state.challenge.game.private || state.challenge.game.ranked)
                                }
                                checked={state.challenge.game.rengo}
                                onChange={cbUpdateRengo}
                            />
                        </div>
                    </div>
                </div>
            )}
            {mode === "open" && (
                <>
                    <div className={"form-group" + (state.challenge.game.rengo ? "" : " hide")}>
                        <label className="control-label" htmlFor="rengo-casual-mode">
                            {_("Casual")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="rengo-casual-mode"
                                    checked={state.challenge.game.rengo_casual_mode}
                                    onChange={cbUpdateRengoCasual}
                                />
                                <a
                                    href="https://github.com/online-go/online-go.com/wiki/Rengo"
                                    className="help"
                                    target="_blank"
                                >
                                    <i className="fa fa-question-circle-o"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </>
            )}
            {mode === "open" && (
                <>
                    <div
                        className={
                            "form-group" +
                            (state.challenge.game.rengo && state.challenge.game.rengo_casual_mode
                                ? ""
                                : " hide")
                        }
                    >
                        <label className="control-label" htmlFor="rengo-auto-start">
                            {_("Auto-start")}
                        </label>
                        <div className="controls">
                            <div className={"checkbox"}>
                                <input
                                    type="number"
                                    // It's clearer to display blank ("") if there is no auto-start.  Blank means no autostart, the same as zero.
                                    value={
                                        !state.challenge.rengo_auto_start
                                            ? ""
                                            : state.challenge.rengo_auto_start
                                    }
                                    onChange={cbUpdateRengoAutoStart}
                                    id="rengo-auto-start"
                                    className="form-control"
                                    style={{ width: "3em" }}
                                    min="0"
                                    max=""
                                />

                                <i
                                    className={
                                        "fa fa-exclamation-circle " +
                                        (rengoAutoStartInputWarning() ? "value-warning" : "")
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
