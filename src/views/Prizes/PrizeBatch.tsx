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

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { get, post, del } from "requests";

interface PrizeBatch {
    id: string;
    created_at: string;
    expiration_date: string;
    created_by: number;
    notes: string;
    codes: any[];
}

interface PrizeBatchParams {
    id: string;
}

export const PrizeBatch: React.FC = () => {
    const params = useParams<keyof PrizeBatchParams>();
    const [batch, setBatch] = useState<PrizeBatch>();
    const [qty, setQty] = useState(1);
    const [duration, setDuration] = useState(30);
    const [level, setLevel] = useState("aji");

    useEffect(() => {
        const url = "prizes/batches/" + params.id;
        get(url)
            .then((data: PrizeBatch) => setBatch(data))
            .catch((error) => console.error("Error fetching prize batches:", error));
    }, []);

    const handleQtyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQty(parseInt(event.target.value));
    };

    const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDuration(parseInt(event.target.value));
    };

    const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLevel(event.target.value);
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data = {
            qty: qty,
            duration: duration,
            level: level,
        };
        post("prizes/batches/" + params.id, data)
            .then((res) => {
                console.log("RESPONSE: ", res);
                setBatch(res);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    function deleteCode(code: any) {
        if (confirm(`Delete code: ${code.code}`) === true) {
            console.log("delete clicked for code: ", code.code);
            del("prizes/" + code.code)
                .then((res) => {
                    setBatch(res);
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        let month: string | number = date.getMonth() + 1;
        let day: string | number = date.getDate();
        month = month < 10 ? "0" + month : month;
        day = day < 10 ? "0" + day : day;
        return `${year}-${month}-${day}`;
    };

    const generateTicketContent = () => {
        let content = "";
        batch?.codes.forEach((code) => {
            content += `Code: ${code.code}\nLevel: ${code.supporter_level}\nDuration: ${
                code.duration
            } days\nExpires: ${formatDate(
                batch?.expiration_date,
            )}\nRedeem code at https://online-go.com/redeem\n\n`;
        });
        return content;
    };

    const handlePrint = () => {
        const ticketContent = generateTicketContent();
        const printWindow = window.open("", "_blank");
        printWindow!.document.write("<html><head><title>Tickets</title></head><body>");
        printWindow!.document.write("<pre>" + ticketContent + "</pre>");
        printWindow!.document.write("</body></html>");
        printWindow!.document.close();
        printWindow!.print();
    };

    return (
        <div className="prize-batch">
            <div className="batch-info">
                Batch ID: {batch?.id}
                <br />
                Created By: {batch?.created_by}
                <br />
                Expires: {batch?.expiration_date}
            </div>
            <div className="codes">
                <h3>Codes:</h3>
                <table>
                    <tbody>
                        <tr>
                            <th>Code</th>
                            <th>Duration</th>
                            <th>Redeemed By</th>
                            <th>Redeemed At</th>
                            <th></th>
                        </tr>
                        {batch?.codes.map((code, i) => {
                            return (
                                <tr key={i}>
                                    <td>{code.code}</td>
                                    <td>{code.duration} days</td>
                                    <td>{code.redeemed_by}</td>
                                    <td>{code.redeemed_at}</td>
                                    <td>
                                        {code.redeemed_at ? (
                                            ""
                                        ) : (
                                            <button className="sm" onClick={() => deleteCode(code)}>
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="add-codes-form">
                <h3>Add Codes</h3>
                <form onSubmit={handleSubmit}>
                    <label>Quantity: </label>
                    <input type="number" value={qty} onChange={handleQtyChange} />
                    <br />
                    <label>Duration: </label>
                    <input type="number" value={duration} onChange={handleDurationChange} /> days
                    <br />
                    <label>Level: </label>
                    <select value={level} onChange={handleLevelChange}>
                        <option value="aji">Aji</option>
                        <option value="hane">Hane</option>
                        <option value="tenuki">Tenuki</option>
                        <option value="meijin">Meijin</option>
                    </select>
                    <input type="submit" value="Add Codes" />
                </form>
            </div>
            <div className="print-tickets">
                <button onClick={handlePrint}>Print Tickets</button>
            </div>
        </div>
    );
};
