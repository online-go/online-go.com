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
import { get, post, del } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { Player } from "@/components/Player";
import { _, interpolate } from "@/lib/translate";
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

export function PrizeBatch(): React.ReactElement {
    const params = useParams<keyof PrizeBatchParams>();
    const [batch, setBatch] = useState<PrizeBatch>();
    const [qty, setQty] = useState(1);
    const [duration, setDuration] = useState(30);
    const [level, setLevel] = useState("Aji");
    const [showModal, setShowModal] = useState(false);

    const user = useUser();

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
                setBatch(res);
                setShowModal(false);
            })
            .catch((err) => {
                console.error(err);
            });
    };

    function deleteCode(code: any) {
        if (confirm(`Delete code: ${code.code}`) === true) {
            del("prizes/" + code.code)
                .then((res) => {
                    setBatch(res);
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    const generateTicketHTML = () => {
        let html = "";
        const redemptionLink =
            '<a href="https://online-go.com/redeem" target="_blank">https://online-go.com/redeem</a>';
        if (batch?.codes.length) {
            batch?.codes.forEach((code) => {
                html += `
                    <div class="voucher-container">
                        <div class="voucher">
                            <div class="header">
                                <img src="https://cdn.online-go.com/assets/ogs_bw.svg" alt="OGS Logo" class="logo" />
                                <span class="right">
                                    <h2>${_("Prize Voucher")}</h2>
                                </span>
                            </div>
                            <div class="content">
                                <p class="congratulations">${_("Congratulations!")}</p>
                                <p class="message">
                                    This voucher entitles you to <span class='emphasis'>${
                                        code.duration
                                    } days</span> of <span class='emphasis'>${
                                        code.supporter_level
                                    }</span> level AI reviews at <span class='emphasis'>Online-Go.com</span>. If you are already a supporter, your current supporter level will be upgraded to the next level or ${
                                        code.supporter_level
                                    }, whichever is higher.<sup>*</sup>
                                </p>
                                <p class="message">${interpolate(
                                    "To redeem, visit {{url}} and enter the code",
                                    {
                                        url: redemptionLink,
                                    },
                                )}
                                </p>
                                <div class="code-info">
                                    <div class='code'>${code.code}</div>
                                </div>
                            </div>
                            <div class="footer">
                                <span class="left">
                                    <sup>*</sup>Up to the maximum plan of Meijin.
                                </span>
                                <span class="right">
                                    Expires ${formatDate(batch?.expiration_date)}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            html = `<p>${_("No codes available.")}</p>`;
        }
        return html;
    };

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        const htmlContent = `
            <html>
                <head>
                    <title>Prize Vouchers</title>
                    <style>
                        @media screen {
                            body {
                                display: none;
                            }
                        }

                        @media print {
                            @page {
                                margin: 0;
                            }

                            body {
                                margin: 0;
                                font-family: Arial, sans-serif;
                            }

                            .voucher-container {
                                padding: 2cm;
                                padding-top: 3cm;
                                page-break-after: always;
                            }

                            .voucher {
                                border: 2px solid #3498db;
                                padding: 20px;
                                max-width: 600px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                                border-radius: 10px;
                                overflow: hidden;
                                page-break-inside: avoid;
                                margin-bottom: 1.6cm;
                            }

                            .header {
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                align-content: center;
                                color: black;
                                margin-bottom: 20px;
                                padding: 10px;
                                border-radius: 5px;
                            }

                            .emphasis {
                                color: #2ecc71;
                                font-weight: bold;

                            }
                            .code {
                                font-size: 30px;
                                font-weight: bold;
                                letter-spacing: 0.3rem;
                                text-align: center;
                                margin-top: 2rem;
                                margin-bottom: 2rem;
                            }

                            .logo {
                                max-width: 100px;
                                height: auto;
                                margin-right: 20px;
                            }

                            .content {
                                line-height: 1.6;
                                text-align: center;
                            }

                            .congratulations {
                                font-size: 28px;
                                font-weight: bold;
                                margin-bottom: 10px;
                            }

                            .message {
                                font-size: 20px;
                                color: #34495e;
                                margin-bottom: 30px;
                                text-align: justify;
                            }

                            .code-info {
                                margin-top: 5rem;
                                margin-bottom: 5rem;
                                text-align: left;
                                border-radius: 5px;
                                border: 1px solid #ddd;
                            }

                            .header, .footer {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                align-content: center;
                                color: black;
                            }
                        }
                    </style>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => {
                                window.close();
                            };
                        };
                    </script>
                </head>
                <body>
                    <div id="tickets-container">${generateTicketHTML()}</div>
                </body>
            </html>
        `;

        printWindow!.document.open();
        printWindow!.document.write(htmlContent);
        printWindow!.document.close();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        let month: string | number = date.getMonth() + 1;
        let day: string | number = date.getDate();
        month = month < 10 ? "0" + month : month;
        day = day < 10 ? "0" + day : day;
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="prize-batch">
            <div className="batch-info">
                <h2>Batch Details</h2>
                <p>
                    <strong>Batch ID:</strong> {batch?.id}
                </p>
                <p>
                    <strong>Created By:</strong> <Player user={batch?.created_by} />
                </p>
                <p>
                    <strong>Expires:</strong>{" "}
                    {batch?.expiration_date ? formatDate(batch?.expiration_date) : ""}
                </p>
                <p>
                    <strong>Notes:</strong> {batch?.notes}
                </p>
            </div>
            <div className="codes">
                <div className="codes-header">
                    <h3>Codes</h3>
                    <div className="actions">
                        <button className="print-btn" onClick={handlePrint}>
                            Print Vouchers
                        </button>
                        {user.is_superuser && (
                            <button className="add-codes-btn" onClick={() => setShowModal(true)}>
                                Add Codes
                            </button>
                        )}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Level</th>
                            <th>Duration</th>
                            <th>Redeemed By</th>
                            <th>Redeemed At</th>
                            {user.is_superuser && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {batch?.codes.map((code, i) => (
                            <tr key={i}>
                                <td>{code.code}</td>
                                <td>{code.supporter_level}</td>
                                <td>{code.duration} days</td>
                                <td>
                                    {code.redeemed_by ? <Player user={code.redeemed_by} /> : "N/A"}
                                </td>
                                <td>{code.redeemed_at}</td>
                                {user.is_superuser && (
                                    <td>
                                        {code.redeemed_at ? (
                                            ""
                                        ) : (
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteCode(code)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Add Codes</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Quantity:</label>
                                <input type="number" value={qty} onChange={handleQtyChange} />
                            </div>
                            <div className="form-group">
                                <label>Duration:</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={handleDurationChange}
                                />{" "}
                                days
                            </div>
                            <div className="form-group">
                                <label>Level:</label>
                                <select value={level} onChange={handleLevelChange}>
                                    <option value="Aji">Aji</option>
                                    <option value="Hane">Hane</option>
                                    <option value="Tenuki">Tenuki</option>
                                    <option value="Meijin">Meijin</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="add-codes-btn">
                                    Add Codes
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
