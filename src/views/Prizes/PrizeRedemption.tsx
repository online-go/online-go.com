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

import React, { useState } from "react";
import { get, post } from "requests";
import { useUser } from "hooks";
import { useNavigate } from "react-router-dom";

interface Prize {
    batch: string;
    id: number;
    duration: number;
    code: string;
    redeemed_ad: string;
    redeemed_by: number;
    supporter_level: string;
}

export const PrizeRedemption: React.FC = () => {
    const [code, setCode] = useState("");
    const [prizeInfo, setPrizeInfo] = useState<Prize>();
    const [showForm, setShowForm] = useState(true);
    const user = useUser();
    const navigate = useNavigate();

    const handleCodeChange = (event: any) => {
        setCode(event.target.value.toUpperCase());
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data = {
            code: code,
        };

        get(`/billing/summary/${user.id}`)
            .then((res) => {
                console.debug("BILLING SUMMARY IS: ", res);
                console.debug("USER IS:", user);
            })
            .catch((err) => {
                console.error(err);
            });

        get("prizes/redeem", data)
            .then((res) => {
                setPrizeInfo(res);
                setShowForm(false);
            })
            .catch((err) => console.error(err));
    };

    const onRedeem = () => {
        const data = {
            code: code,
        };

        post("prizes/redeem", data)
            .then((res) => {
                console.log(res);
            })
            .catch((err) => console.error(err));
    };

    const onCancel = () => {
        navigate("/");
    };

    return (
        <div className="prize-redemption">
            {showForm && (
                <form onSubmit={handleSubmit}>
                    <label>Please Enter Prize Code:</label>
                    <br />
                    <input type="text" value={code} onChange={handleCodeChange} />
                    <input type="submit" value="Submit" />
                </form>
            )}

            {prizeInfo && (
                <div className="prize-info">
                    <h3>Prize Info</h3>
                    <p>
                        Prize Level: {prizeInfo.supporter_level} <br />
                        Duration: {prizeInfo.duration} days
                    </p>
                    <div>
                        Redeem this prize?
                        <button onClick={onRedeem}>Redeem</button>
                        <button onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="status">
                <h3>current supporter status</h3>
                <p>
                    Logged in as: {user.id} <br />
                    supporter: {user.supporter} <br />
                    level: {user.supporter_level}
                </p>
            </div>
        </div>
    );
};
