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
import { get } from "requests";

export const PrizeRedemption: React.FC = () => {
    const [code, setCode] = useState("");

    const handleCodeChange = (event: any) => {
        setCode(event.target.value.toUpperCase());
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        get("prizes/redeem")
            .then((res) => {
                console.log(res);
            })
            .catch((err) => console.error(err));
    };

    return (
        <div className="prize-redemption">
            <form onSubmit={handleSubmit}>
                <label>Please Enter Prize Code:</label>
                <br />
                <input type="text" value={code} onChange={handleCodeChange} />
                <input type="submit" value="Submit" />
            </form>
        </div>
    );
};
