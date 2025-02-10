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
import { _, llm_pgettext } from "@/lib/translate";
import { openModal, Modal } from "@/components/Modal";

interface Events {}

export class PlayPageHelp extends Modal<Events, {}, any> {
    constructor(props: {}) {
        super(props);
    }

    render() {
        return <PlayPageHelpContents modal={this} />;
    }
}

export function PlayPageHelpContents({
    modal,
}: {
    modal: {
        close?: () => void;
        on: (event: "open" | "close", callback: () => void) => void;
        off: (event: "open" | "close", callback: () => void) => void;
    };
}) {
    return (
        <div className="Modal PlayPageHelp">
            <div className="header">
                <h1>{llm_pgettext("Help header for the Play page", "Finding games")}</h1>
            </div>
            <div className="body">
                <p>
                    {llm_pgettext(
                        "Help text for the Play page",
                        "Welcome to Online-Go.com! To get started playing a game you have a few decisions to make, below describes the options you'll find on this page.",
                    )}
                </p>

                <h3>{_("Board Size")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play page board size description",
                        "In Go you can play on different sized boards. The most common sizes are 9x9, 13x13, and 19x19. The smaller the board the quicker the game and the more focus on tactics. For beginners, it's recommended to start on 9x9 to get a feel for the game, then work your way up to either 13x13 or jump right to 19x19.",
                    )}
                </p>

                <h3>{_("Game Clock")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play page game clock description",
                        "The game clock controls how much time you have to make your moves in the game. There are two popular game clock types: Fischer clocks and Byoyomi clocks. You'll find the Fischer Clock settings on the left hand side of the buttons, and the Byo-yomi settings on the right hand side.",
                    )}
                </p>
                <p>
                    {llm_pgettext(
                        "Help text for the Fischer clock time control system",
                        "Fischer clocks work by giving each player an initial amount of time to make their moves, and then for each move they make they receive an additional amount of time. The Game Clock buttons will have two numbers, the first being the initial amount of time, and the second being the amount of time added for each move. For example, 10m + 10s means that each player starts with 10 minutes, and then receives an additional 10 seconds for each move they make.",
                    )}
                </p>
                <p>
                    {llm_pgettext(
                        "Help text for the Byo-yomi clock time control system",
                        "Byo-yomi clocks work by giving each player a larger amount of time to make the majority of their moves, then a number of overtime periods to make the remainder of their moves in. If a move is made within a byo-yomi overtime period, the period clock is reset for the next move. If a move takes longer than a period, then that period counter is reduced by one and the player enters the next period. For example, 20m + 5x30s means that each player starts off with 20 minutes to make as many moves as they would like, then they must start making their moves within 30 seconds or lose a period. If all 5 periods are used, then then the player loses by timeout.",
                    )}
                </p>

                <h3>{_("Daily Correspondence")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Daily Correspondence description",
                        "Correspondence games are games that are played over the course of many days or weeks, with players taking turns making a move or two a day. This popular format is used by players all over the world and lets you play full games without having to commit to a single long session. Many players have several correspondence games going at once and make their moves throughout the day when it's convenient for them.",
                    )}
                </p>

                <h3>{_("Handicap")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play page handicap description",
                        "In Go, it is common to play with a handicap based on the rank difference between the two players. This works by assigning a number of extra starting stones to the weaker player and/or adjusting the komi points in the game. This makes the game more interesting and challenging for both players.",
                    )}
                </p>

                <h3>{_("Opponent Rank")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play page opponent rank description",
                        "The opponent rank setting is used when playing a human opponent. This is the relative strength of the player you are willing to play against.",
                    )}
                </p>

                <h3>{_("Play Human")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play Human button",
                        "The Play Human button is used to begin the search for a human opponent. This process can take anywhere from a few seconds to a few minutes or longer depending on how many players are currently online and looking for a game with compatible settings. You will be automatically brought to your game once a match has been found.",
                    )}
                </p>

                <h3>
                    {llm_pgettext(
                        "Help text for selecting multiple options",
                        "Selecting Multiple Options",
                    )}
                </h3>

                <p>
                    {llm_pgettext(
                        "Help text for selecting multiple options",
                        'If you are happy to play a game under a variety of settings, you can select "Multiple" from the Game Clock drop down which will allow you to select all of the different clock and board size settings you are willing to play. Doing this is a great way to find a game faster.',
                    )}
                </p>

                <h3>{_("Using the indicators")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for using the indicators",
                        "The board size and game clock buttons can have one of two dots in the upper right corner:",
                    )}
                </p>
                <ul>
                    <li>
                        <button className="activity popular">10m + 10s</button>
                        <p>
                            {llm_pgettext(
                                "Help text for using the indicators",
                                "The gray dot indicates that this has been a popular option within the last 30 minutes, and is a good choice if you want to find a game quickly.",
                            )}
                        </p>
                    </li>
                    <li>
                        <button className="activity player-waiting">10m + 10s</button>
                        <p>
                            {llm_pgettext(
                                "Help text for using the indicators",
                                "The highlighted dot indicates that there are players currently online who are looking for a game with compatible settings. Selecting this option will generally result in a match being made immediately.",
                            )}
                        </p>
                    </li>
                </ul>

                <h3>{_("Play Computer")}</h3>
                <p>
                    {llm_pgettext(
                        "Help text for the Play Computer button",
                        'To play against the computer you can use the Play Computer button. This will open up a window where you can select the computer opponent to play against. Each computer opponent has a different style and strength. The number at the end of the name, for example (14k), is the rank of the computer. This is a traditional ranking system which in which the larger the "Kyu" rank the weaker the player, so a 14k computer is weaker than a 9k computer. After 1k, "Dan" ranks are used, in which the higher the number the stronger the player, so a 3d computer is weaker than a 8d computer.',
                    )}
                </p>
            </div>
            <div className="buttons">
                <button onClick={modal.close}>{_("Close")}</button>
            </div>
        </div>
    );
}

export function openPlayPageHelp() {
    console.log("openPlayPageHelp");
    openModal(<PlayPageHelp />);
}
