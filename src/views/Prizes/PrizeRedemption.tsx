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

import React, { useState, useRef } from "react";
import { get, post } from "requests";
import { useNavigate } from "react-router-dom";
import { useUser } from "hooks";

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
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [prizeInfo, setPrizeInfo] = useState<Prize>();
    const [showForm, setShowForm] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [redeemed, setRedeemed] = useState(false);
    const navigate = useNavigate();
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const user = useUser();

    if (user.anonymous) {
        navigate("/sign-in");
    }

    const handleCodeChange = (event: any, index: number) => {
        const newCode = [...code];
        newCode[index] = event.target.value.toUpperCase();
        setCode(newCode);

        if (event.target.value !== "" && index < code.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (event: any, index: number) => {
        if (event.key === "Backspace" && code[index] === "") {
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (event: any) => {
        event.preventDefault();
        const pastedCode = event.clipboardData.getData("text").slice(0, 6).toUpperCase();

        const newCode = [...code];
        for (let i = 0; i < pastedCode.length; i++) {
            newCode[i] = pastedCode[i];
        }
        setCode(newCode);

        inputRefs.current[pastedCode.length - 1]?.focus();
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();

        const enteredCode = code.join("");

        if (enteredCode.length !== 6) {
            setError("Invalid code. Please enter a 6-character code.");
            return;
        }

        setLoading(true);
        setError("");

        const data = { code: enteredCode };

        get("prizes/redeem", data)
            .then((res) => {
                if (res.redeemed_by) {
                    setError("Sorry, this code has already been redeemed.");
                    setCode(["", "", "", "", "", ""]);
                } else {
                    setPrizeInfo(res);
                    setShowForm(false);
                }
            })
            .catch((err) => {
                console.error(err);
                setError("Invalid prize code. Please try again.");
                setCode(["", "", "", "", "", ""]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onRedeem = () => {
        setLoading(true);
        setError("");

        const enteredCode = code.join("");
        const data = { code: enteredCode };

        post("prizes/redeem", data)
            .then((res) => {
                if (res === 200) {
                    setRedeemed(true);
                }
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to redeem the prize. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onCancel = () => {
        navigate("/");
    };

    return (
        <div className="prize-redemption">
            <h2>Prize Redemption</h2>
            <p>
                Enter your prize code below to redeem your prize and unlock special benefits on
                Online-Go.com.
            </p>
            {showForm && (
                <form onSubmit={handleSubmit}>
                    <label>Prize Code:</label>
                    <div className="code-input">
                        {code.map((char, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                value={char}
                                onChange={(event) => handleCodeChange(event, index)}
                                onKeyDown={(event) => handleKeyDown(event, index)}
                                onPaste={handlePaste}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                            />
                        ))}
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Submit"}
                    </button>
                </form>
            )}
            {error && <p className="error">{error}</p>}
            {prizeInfo && !redeemed && (
                <div className="prize-info">
                    <h3>Prize Details</h3>
                    <p>You are about to redeem the following prize:</p>
                    <ul>
                        <li>Prize Level: {prizeInfo.supporter_level}</li>
                        <li>Duration: {prizeInfo.duration} days</li>
                    </ul>
                    <p>Are you sure you want to redeem this prize?</p>
                    <div className="actions">
                        <button onClick={onRedeem} disabled={loading}>
                            {loading ? "Redeeming..." : "Redeem"}
                        </button>
                        <button onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            )}
            {redeemed && (
                <div className="success-message">
                    <h3>Congratulations!</h3>
                    <p>
                        Your prize has been successfully redeemed. Enjoy your enhanced experience on
                        Online-Go.com!
                    </p>
                    <button onClick={onCancel}>Close</button>
                </div>
            )}
        </div>
    );
};
