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
import { Player } from "@/components/Player";
import { put } from "@/lib/requests";

interface PlayerData {
    color: string;
    composite: number;
    blur_rate: number;
    has_sgf_downloads: boolean;
    timing_consistency: number;
    AILR: number;
}

interface BotDetectionResultsProperties {
    bot_detection_results: {
        fast_pass_flagged_for: string[];
        ai_suspected: number[];
    } & Record<number, PlayerData>;
    game_id: number;
    updateBotDetectionResults: (updatedResults: any) => void;
}

export function BotDetectionResults({
    bot_detection_results,
    game_id,
    updateBotDetectionResults,
}: BotDetectionResultsProperties) {
    const markFalsePositive = (player_id: number) => {
        if (window.confirm("Mark this game as a false positive detection?")) {
            put("cheat_detection/false_positive", {
                game_id: game_id,
                player_id: player_id,
                false_positive: true,
            })
                .then((res) => {
                    if (res.success) {
                        const updatedResults = { ...bot_detection_results };

                        updatedResults.ai_suspected = updatedResults.ai_suspected.filter(
                            (id) => id !== player_id,
                        );
                        delete updatedResults[player_id];

                        // Call the function passed from the parent to update the state
                        updateBotDetectionResults(updatedResults);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    };

    return (
        <div className="bot-detection-results">
            <h3>Suspected AI Use</h3>
            <p>
                Fast Pass Flagged For:
                <ul>
                    {bot_detection_results.fast_pass_flagged_for.map((item) => (
                        <li>{item}</li>
                    ))}
                </ul>
            </p>
            <ul className="suspected-players">
                {bot_detection_results.ai_suspected.map((player_id) => {
                    const player = bot_detection_results[player_id];
                    return (
                        <li className="details" key={player_id}>
                            {player.color === "black" ? "⚫" : "⚪"} <Player user={player_id} />
                            <br />
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Composite:</td>
                                        <td>{player.composite}</td>
                                    </tr>
                                    <tr>
                                        <td>Blur rate:</td>
                                        <td>{player.blur_rate}</td>
                                    </tr>
                                    <tr>
                                        <td>SGF Downloads:</td>
                                        <td>{player.has_sgf_downloads.toString()}</td>
                                    </tr>
                                    <tr>
                                        <td>Timing Consistency:</td>
                                        <td>{player.timing_consistency}</td>
                                    </tr>
                                    <tr>
                                        <td>AILR:</td>
                                        <td>{player.AILR}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button onClick={() => markFalsePositive(player_id)}>
                                Mark False Positive
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
