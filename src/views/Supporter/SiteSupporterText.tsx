/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";

export function SiteSupporterText(props) {

    return (
        <div className='SiteSupporterText'>
            <p>
                {_("Thanks to the generous support from players like you, Online-Go.com is able to provide the best place to play Go online for free to all players around the world. Online-Go.com introduces the game of Go to more people than any other site or organization in the West, making us an important cornerstone in the Western Go world. This is only possible with the continued support from our players, so thank you for taking the time to consider being a supporter!")}
            </p>

            <p>
                {pgettext("Split sentance for formatting, the entirty of this sentance will read: In addition to some perks like more vacation time, a golden name, and access to the special \"Site Supporters\" chat channel, all site supporters receive the exceptional benefit of having their games automatically reviewed by artificial intelligence engines running on our high power servers.", "In addition to some perks like more vacation time, a golden name, and access to the special \"Site Supporters\" chat channel,")}
                <b> {pgettext("Split sentance for formatting, the entirty of this sentance will read: In addition to some perks like more vacation time, a golden name, and access to the special \"Site Supporters\" chat channel, all site supporters receive the exceptional benefit of having their games automatically reviewed by artificial intelligence engines running on our high power servers.", "all site supporters receive the exceptional benefit of having their games automatically reviewed by artificial intelligence engines running on our high power servers.")}</b>
                <sup>*</sup> {_("Moreover, this benefit is shared with your opponents and with anyone else viewing your games, as the reviews are stored on our servers and made available to anyone wishing to view them, so your support not only benefits you but also those around you!")}
            </p>


            <p>
                {_("Because of the computationally intensive nature of performing these reviews, there are different strength networks available. Roughly speaking, the larger the network, the better the review, but the harder the servers have to work on the review. Below is a table listing out the size of the networks used, and the approximate strength of the review:")}
            </p>

            <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>
                            </th>
                            <th>
                                {pgettext("Size of our artificial intelligence neural network", "19x19 network size")}
                            </th>
                            <th>
                                {pgettext("Number of playouts our neural network does to review a game", "Playouts")}
                            </th>
                            <th>
                                {pgettext("Strength of our artificial intelligence review engine", "Approximate strength")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th>{_("Supporter")}</th>
                            <td>15x192</td>
                            <td>200</td>
                            <td>{pgettext("How strong an AI engine is", "Strong Dan level player")}</td>
                        </tr>
                        <tr>
                            <th>{_("Kyu Supporter")}</th>
                            <td>15x192</td>
                            <td>800</td>
                            <td>{pgettext("How strong an AI engine is", "Professional level player")}</td>
                        </tr>
                        <tr>
                            <th>{_("Dan Supporter")}</th>
                            <td>15x192</td>
                            <td>1600</td>
                            <td>{pgettext("How strong an AI engine is", "Strong professional level player")}</td>
                        </tr>
                        <tr>
                            <th>{_("Pro Supporter")}</th>
                            <td>40x256</td>
                            <td>1600</td>
                            <td>{pgettext("How strong an AI engine is", "Beyond most professional level players")}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className='fineprint'>
                <sup>*</sup>{_("Only 19x19 games are currently supported for AI review. Support for 9x9 and 13x13 games is planned. There are no plans for supporting other sized games at this time.")}
            </p>
        </div>
    );
}
