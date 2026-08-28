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
import { ChallengeModalConf, ChallengeInput, UpdateFn, GameInput } from "./ChallengeModal.types";
import { applyBotRanked, rengoAutoStartInputWarning } from "./ChallengeModal.utils";

type ChallengeModalBasicSettingsProps = {
    playerId?: number;
    challenge: ChallengeInput;
    conf: ChallengeModalConf;
    mode: string;
    updateGameSettings: (update_fn: UpdateFn<GameInput>) => void;
    updateChallengeSettings: (update_fn: UpdateFn<ChallengeInput>) => void;
    forceTimeControlSystemIfNecessary: (is_rengo: boolean, is_rengo_casual: boolean) => void;
};

export const ChallengeModalBasicSettings = ({
    playerId,
    mode,
    challenge,
    conf,
    updateGameSettings,
    updateChallengeSettings,
    forceTimeControlSystemIfNecessary,
}: ChallengeModalBasicSettingsProps) => {
    const bots = bots_list();
    const selected_bot = bots.find((bot) => bot.id === conf.bot_id);
    const showRengoAutoStartWarning = rengoAutoStartInputWarning(challenge);

    const cbUpdateGameName = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateGameSettings((prev) => ({ ...prev, name: ev.target.value }));
        },
        [updateGameSettings],
    );

    const updatePrivate = React.useCallback(
        (is_private: boolean) => {
            updateGameSettings((prev) => {
                const next = { ...prev, private: is_private };
                if (mode === "computer") {
                    return applyBotRanked(next);
                }
                return { ...next, ranked: false };
            });
        },
        [updateGameSettings, mode],
    );

    const cbUpdateInviteOnly = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updateChallengeSettings((prev) => ({ ...prev, invite_only: ev.target.checked }));
            // If we're in open mode and invite_only is being turned off, also turn off private
            if (mode === "open" && !ev.target.checked && challenge.game.private) {
                updatePrivate(false);
            }
        },
        [updateChallengeSettings, updatePrivate, mode, challenge.game.private],
    );

    const cbUpdatePrivate = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            updatePrivate(ev.target.checked);
        },
        [updatePrivate],
    );

    const cbUpdateRengo = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const isRengo = ev.target.checked;
            forceTimeControlSystemIfNecessary(isRengo, challenge.game.rengo_casual_mode);

            updateGameSettings((prev) => ({
                ...prev,
                rengo: isRengo,
                ranked: false,
                handicap: 0,
            }));
        },
        [updateGameSettings, forceTimeControlSystemIfNecessary],
    );

    const cbUpdateRengoCasual = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const isRengoCasual = ev.target.checked;
            forceTimeControlSystemIfNecessary(challenge.game.rengo, isRengoCasual);
            updateGameSettings((prev) => ({ ...prev, rengo_casual_mode: isRengoCasual }));
        },
        [updateGameSettings, forceTimeControlSystemIfNecessary],
    );

    const cbUpdateRengoAutoStart = React.useCallback(
        (ev: React.ChangeEvent<HTMLInputElement>) => {
            const auto_start_threshold = parseInt(ev.target.value);
            const new_val = isNaN(auto_start_threshold) ? 0 : auto_start_threshold;

            if (new_val >= 0) {
                updateChallengeSettings((prev) => ({
                    ...prev,
                    rengo_auto_start: new_val,
                }));
            }
        },
        [updateChallengeSettings],
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
                                value={challenge.game.name}
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
                                checked={challenge.invite_only}
                                onChange={cbUpdateInviteOnly}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/* Only show Private checkbox if not in open mode, or if in open mode with invite-only checked */}
            {(mode !== "open" || challenge.invite_only) && (
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-private">
                        {_("Private")}
                    </label>

                    <div className="controls">
                        <div className="checkbox">
                            <input
                                type="checkbox"
                                id="challenge-private"
                                disabled={challenge.game.rengo}
                                checked={challenge.game.private}
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
                                    !challenge.game.rengo &&
                                    (challenge.game.private || challenge.game.ranked)
                                }
                                checked={challenge.game.rengo}
                                onChange={cbUpdateRengo}
                            />
                        </div>
                    </div>
                </div>
            )}
            {mode === "open" && (
                <>
                    <div className={"form-group" + (challenge.game.rengo ? "" : " hide")}>
                        <label className="control-label" htmlFor="rengo-casual-mode">
                            {_("Casual")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="checkbox"
                                    id="rengo-casual-mode"
                                    checked={challenge.game.rengo_casual_mode}
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
                            (challenge.game.rengo && challenge.game.rengo_casual_mode
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
                                        !challenge.rengo_auto_start
                                            ? ""
                                            : challenge.rengo_auto_start
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
                                        (showRengoAutoStartWarning ? "value-warning" : "")
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
