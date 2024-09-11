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
import { _ } from "@/lib/translate";
import { Modal } from "@/components/Modal";

interface Events {}

export class LearnMore extends Modal<Events, {}, any> {
    constructor() {
        super({});
    }

    render() {
        return (
            <div className="Modal LearnMore">
                <div className="body">
                    <h2>{_("Site Supporter Free Trial")}</h2>
                    <p>
                        {_(`
                        As a long time player we think you might enjoy and benefit from our site
                        supporter features, which among other things includes access to AI reviews
                        for your games. You can activate your free, no commitment, 7-day trial by
                        simply clicking the Activate button. No payment information is collected for
                        the trial, we simply want to give you the opportunity to explore the feature
                        and see if it is something you would like to use regularly.
                        `)}
                    </p>
                    <h2>{_("About AI reviews")}</h2>
                    <p>
                        <img
                            src="https://cdn.online-go.com/5.1/img/trial_board.png"
                            width="355"
                            height="150"
                        />
                        <p>
                            {_(`
                            After a game, Online-Go.com will automatically begin analyzing each
                            move. You can explore this analysis by visiting a move you might have
                            questions about, for instance to see how you could have handled a
                            situation better or where some good alternative locations to play might
                            have been.
                            `)}
                        </p>
                        <p>
                            {_(`
                            The analysis will be overlaid on the game board. The move with a
                            triangle is the move that was played, the blue location is where the AI
                            would have played, and the green square locations are other potential
                            places to play. The numbers give an estimated score change as a result
                            of the move, so the larger the negative number the worse the move is,
                            where as 0 indicates a perfect play move.
                            `)}
                        </p>
                        <p>
                            {_(`
                            You can also deeply explore variations and the AI will analyze the
                            variations with you, so you can see how your opponent might have
                            responded if different decisions were made.
                            `)}
                        </p>
                    </p>
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                </div>
            </div>
        );
    }
}
