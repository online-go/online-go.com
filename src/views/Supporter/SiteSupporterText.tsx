/*
 * Copyright (C) 2012-2020  Online-Go.com
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


            <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th>
                            </th>
                            <th>
                                {_("NPOps / move")}<sup>†</sup>
                            </th>
                            <th>
                                {pgettext("Number of playouts our neural network does to review a game", "Playouts")}<sup>‡</sup>
                            </th>
                            {/*
                            <th>
                                {pgettext("Strength of our artificial intelligence review engine", "Approximate strength")}
                            </th>
                            */}
                        </tr>
                    </thead>
                    <tbody>
                        {/*
                        <tr>
                            <th>{_("Supporter")}</th>
                            <td>125</td>
                            <td>{pgettext("How strong an AI engine is", "Amateur Dan level player")}</td>
                        </tr>
                        */}
                        <tr>
                            <th>{_("Kyu Supporter")}</th>
                            <td>2M</td>
                            <td>400</td>
                            {/* <td>{pgettext("How strong an AI engine is", "Professional level player")}</td> */}
                        </tr>
                        <tr>
                            <th>{_("Dan Supporter")}</th>
                            <td>5M</td>
                            <td>1000</td>
                            {/* <td>{pgettext("How strong an AI engine is", "Strong professional level player")}</td> */}
                        </tr>
                        <tr>
                            <th>{_("Pro Supporter")}</th>
                            <td>15M</td>
                            <td>3000</td>
                            {/* <td>{pgettext("How strong an AI engine is", "Beyond most professional level players")}</td> */}
                        </tr>
                        <tr>
                            <th>{_("Insei Supporter")}</th>
                            <td>60M</td>
                            <td>12000</td>
                            {/* <td>{pgettext("How strong an AI engine is", "Beyond most professional level players")}</td> */}
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className='fineprint'>
                <sup>*</sup>{_("Only 19x19, 9x9, and 13x13 games are supported for AI review. Engines currently available are KataGo and Leela Zero. Playouts and engines are subject to change over time as technology and software improves, but only if the changes should provide you with better reviews.")}
            </p>
            <p className='fineprint'>
                <sup>†</sup>{_("Node Playout Operations (NPOps) is computed by multiplying the number of playouts by the block size of the neural network. For example, using a 20x256 node network at 1000 playouts would be 20*256*1000 = 5120000 NPOps, or about 5M NPOps.")}
            </p>
            <p className='fineprint'>
                <sup>‡</sup>{_("Go AI engines are under constant improvement. Some engine-network combinations perform better with larger networks and less playouts, while others perform better with more playouts on a smaller network. The NPOps (which roughly corresponds to how much processing time is taken by our servers) remains about the same, but as engines and networks evolve we will tweak the network size and number of playouts used to give you the best possible review for the given number of NPOps.")}
            </p>
        </div>
    );
}
