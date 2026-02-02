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
import { useParams, useNavigate } from "react-router-dom";
import { get, post, del } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { Player } from "@/components/Player";
import QRCode from "qrcode";
import { toast } from "@/lib/toast";
import { interpolate, pgettext } from "@/lib/translate";
import "./PrizeBatch.css";
interface PrizeBatch {
    id: string;
    created_at: string;
    expiration_date: string;
    created_by: number;
    notes: string;
    codes: any[];
}

interface PrizeBatchLine {
    id: string;
    level: number;
    duration: number;
    quantity: number;
    maxUses: number;
    specificExpiration?: string;
    isCustomCode: boolean;
    originalCustomCode?: string;
    newCustomCode?: string;
}

interface PrizeBatchParams {
    id: string;
}

export function PrizeBatch(): React.ReactElement {
    const params = useParams<keyof PrizeBatchParams>();
    const navigate = useNavigate();
    const [batch, setBatch] = useState<PrizeBatch>();
    const [qty, setQty] = useState(1);
    const [duration, setDuration] = useState(30);
    const [level, setLevel] = useState(1); // 1=Aji, 2=Hane, 3=Tenuki, 4=Meijin
    const [showModal, setShowModal] = useState(false);
    const [maxUses, setMaxUses] = useState(1);
    const [customCode, setCustomCode] = useState("");
    const [specificExpiration, setSpecificExpiration] = useState("");
    const [isCustomCode, setIsCustomCode] = useState(false);
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneNotes, setCloneNotes] = useState("");
    const [cloneExpiration, setCloneExpiration] = useState("");
    const [cloneBatchLines, setCloneBatchLines] = useState<PrizeBatchLine[]>([]);
    const [isCloning, setIsCloning] = useState(false);

    const user = useUser();

    // Helper function to convert numeric level to name
    const getLevelName = (level: number): string => {
        switch (level) {
            case 1:
                return pgettext("OGS supporter level name", "Aji");
            case 2:
                return pgettext("OGS supporter level name", "Hane");
            case 3:
                return pgettext("OGS supporter level name", "Tenuki");
            case 4:
                return pgettext("OGS supporter level name", "Meijin");
            default:
                return pgettext("OGS supporter level name", "Aji");
        }
    };

    useEffect(() => {
        // Reset state when navigating to a new batch
        setBatch(undefined);
        setShowModal(false);
        setShowCloneModal(false);
        setIsCloning(false);

        const url = "prizes/batches/" + params.id;
        get(url)
            .then((data: PrizeBatch) => {
                setBatch(data);
                setCloneNotes(data.notes || "");
                // Set default expiration to 1 year from now
                const oneYearLater = new Date();
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                const defaultExpiration = oneYearLater.toISOString().split("T")[0];
                setCloneExpiration(defaultExpiration);
                // Initialize clone batch lines from existing codes
                // Pass the original batch expiration date explicitly
                const lines = analyzeBatchCodes(
                    data.codes,
                    defaultExpiration,
                    data.expiration_date,
                );
                setCloneBatchLines(lines);
            })
            .catch((error) => console.error("Error fetching prize batches:", error));
    }, [params.id]);

    // Analyze existing codes to create batch lines
    const analyzeBatchCodes = (
        codes: any[],
        newBatchExpiration: string,
        originalBatchExpiration?: string,
    ): PrizeBatchLine[] => {
        const lines: PrizeBatchLine[] = [];
        const groupMap = new Map<string, PrizeBatchLine>();

        // Use the provided original batch expiration or fall back to the current batch's expiration
        const origBatchExpiry = originalBatchExpiration || batch?.expiration_date;

        codes.forEach((code) => {
            // Check if this is a custom code (codes that don't match the standard 6-character pattern)
            const isCustomCode = code.code && !/^[cdefhjkmnprtwxy23456789]{6}$/i.test(code.code); // cspell:disable-line

            // For custom codes, always create a separate line
            if (isCustomCode) {
                // Calculate the expiration delta if a custom expiration exists
                let specificExpiration: string | undefined;
                if (code.specific_expiration && origBatchExpiry) {
                    const batchExpiry = new Date(origBatchExpiry);
                    const codeExpiry = new Date(code.specific_expiration);
                    const deltaDays = Math.round(
                        (codeExpiry.getTime() - batchExpiry.getTime()) / (1000 * 60 * 60 * 24),
                    );

                    // Apply the delta to the new batch expiration
                    const newBatchExpiry = new Date(newBatchExpiration);
                    const newCodeExpiry = new Date(newBatchExpiry);
                    newCodeExpiry.setDate(newCodeExpiry.getDate() + deltaDays);
                    specificExpiration = newCodeExpiry.toISOString().split("T")[0];
                }

                lines.push({
                    id: Math.random().toString(36).substr(2, 9),
                    level: code.supporter_level,
                    duration: code.duration,
                    quantity: 1,
                    maxUses: code.max_uses || 1,
                    specificExpiration: specificExpiration,
                    isCustomCode: true,
                    originalCustomCode: code.code,
                    newCustomCode: "", // User must provide new custom code
                });
            } else {
                // For non-custom codes, group by all distinguishing properties
                const expirationKey = code.specific_expiration || "batch";
                const key = `${code.supporter_level}-${code.duration}-${
                    code.max_uses || 1
                }-${expirationKey}`;

                if (groupMap.has(key)) {
                    const line = groupMap.get(key)!;
                    line.quantity += 1;
                } else {
                    // Calculate the expiration delta if a custom expiration exists
                    let specificExpiration: string | undefined;
                    if (code.specific_expiration && origBatchExpiry) {
                        const batchExpiry = new Date(origBatchExpiry);
                        const codeExpiry = new Date(code.specific_expiration);
                        const deltaDays = Math.round(
                            (codeExpiry.getTime() - batchExpiry.getTime()) / (1000 * 60 * 60 * 24),
                        );

                        // Apply the delta to the new batch expiration
                        const newBatchExpiry = new Date(newBatchExpiration);
                        const newCodeExpiry = new Date(newBatchExpiry);
                        newCodeExpiry.setDate(newCodeExpiry.getDate() + deltaDays);
                        specificExpiration = newCodeExpiry.toISOString().split("T")[0];
                    }

                    groupMap.set(key, {
                        id: Math.random().toString(36).substr(2, 9),
                        level: code.supporter_level,
                        duration: code.duration,
                        quantity: 1,
                        maxUses: code.max_uses || 1,
                        specificExpiration: specificExpiration,
                        isCustomCode: false,
                    });
                }
            }
        });

        // Combine the custom code lines with the grouped regular lines
        return [...lines, ...Array.from(groupMap.values())];
    };

    const handleQtyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setQty(parseInt(event.target.value));
    };

    const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDuration(parseInt(event.target.value));
    };

    const handleLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLevel(parseInt(event.target.value));
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();
        const data: any = {
            qty: isCustomCode ? 1 : qty,
            duration: duration,
            level: level,
            max_uses: maxUses,
        };

        if (isCustomCode && customCode) {
            data.custom_code = customCode;
        }

        if (specificExpiration) {
            data.specific_expiration = new Date(specificExpiration).toISOString();
        }

        post("prizes/batches/" + params.id, data)
            .then((res) => {
                setBatch(res);
                setShowModal(false);
                // Reset form
                setQty(1);
                setDuration(30);
                setLevel(1); // Reset to Aji
                setMaxUses(1);
                setCustomCode("");
                setSpecificExpiration("");
                setIsCustomCode(false);
            })
            .catch((err) => {
                console.error(err);
                alert(
                    pgettext(
                        "Prize batch error - duplicate custom code",
                        "Error creating code. Custom codes must be unique.",
                    ),
                );
            });
    };

    function deleteCode(code: any) {
        if (
            confirm(
                interpolate(pgettext("Prize code deletion confirmation", "Delete code: {{code}}"), {
                    code: code.code,
                }),
            ) === true
        ) {
            del("prizes/" + code.code)
                .then((res) => {
                    setBatch(res);
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }

    const handleCloneBatch = async () => {
        // Validate that all custom codes have new codes provided
        for (const line of cloneBatchLines) {
            if (line.isCustomCode && (!line.newCustomCode || line.newCustomCode.trim() === "")) {
                alert(
                    interpolate(
                        pgettext(
                            "Prize batch cloning - missing custom code error",
                            "Please provide a new custom code for the prize that had code '{{code}}'",
                        ),
                        { code: line.originalCustomCode },
                    ),
                );
                return;
            }
        }

        setIsCloning(true);
        try {
            // Step 1: Create new batch
            const newBatch = await post("prizes/batches", {
                expiration: cloneExpiration,
                notes: cloneNotes,
            });

            // Step 2: Add codes to the new batch for each line
            for (const line of cloneBatchLines) {
                const data: any = {
                    qty: line.quantity,
                    duration: line.duration,
                    level: line.level,
                    max_uses: line.maxUses,
                };

                // Add custom code if this is a custom code line
                if (line.isCustomCode && line.newCustomCode) {
                    data.custom_code = line.newCustomCode;
                }

                // Add specific expiration if it exists
                if (line.specificExpiration) {
                    data.specific_expiration = new Date(line.specificExpiration).toISOString();
                }

                await post("prizes/batches/" + newBatch.id, data);
            }

            // Close modal and navigate to the new batch
            setShowCloneModal(false);
            void navigate(`/prize-batches/${newBatch.id}`);
        } catch (err) {
            console.error("Error cloning batch:", err);
            alert(
                pgettext("Prize batch cloning error", "Failed to clone batch. Please try again."),
            );
            setIsCloning(false);
        }
    };

    const updateCloneBatchLine = (id: string, field: keyof PrizeBatchLine, value: any) => {
        setCloneBatchLines((lines) =>
            lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)),
        );
    };

    // Helper to sort codes by level, duration, and redeemed_at (descending order)
    const sortCodes = (codes: any[]) => {
        return [...codes].sort((a, b) => {
            // First sort by level (descending - Meijin first)
            // supporter_level is now an integer (1=Aji, 2=Hane, 3=Tenuki, 4=Meijin)
            const levelDiff = b.supporter_level - a.supporter_level;
            if (levelDiff !== 0) {
                return levelDiff;
            }

            // Then by duration (descending - longest first)
            const durationDiff = b.duration - a.duration;
            if (durationDiff !== 0) {
                return durationDiff;
            }

            // Then by redemption status (unredeemed first)
            const aRedeemed = (a.times_used || 0) > 0;
            const bRedeemed = (b.times_used || 0) > 0;
            if (!aRedeemed && bRedeemed) {
                return -1;
            }
            if (aRedeemed && !bRedeemed) {
                return 1;
            }
            return 0;
        });
    };

    // Get prize summary grouped by level and duration
    const getPrizeSummary = (codes: any[]) => {
        const summary = new Map<
            string,
            { level: number; duration: number; total: number; redeemed: number }
        >();

        codes.forEach((code) => {
            const key = `${code.supporter_level}-${code.duration}`;
            if (summary.has(key)) {
                const item = summary.get(key)!;
                item.total += 1;
                if ((code.times_used || 0) > 0) {
                    item.redeemed += 1;
                }
            } else {
                summary.set(key, {
                    level: code.supporter_level,
                    duration: code.duration,
                    total: 1,
                    redeemed: (code.times_used || 0) > 0 ? 1 : 0,
                });
            }
        });

        // Sort summary by level then duration (descending order)
        // Sort by level (descending) then duration (descending)
        return Array.from(summary.values()).sort((a, b) => {
            // Level is now an integer, so direct comparison
            const levelDiff = b.level - a.level;
            if (levelDiff !== 0) {
                return levelDiff;
            }
            return b.duration - a.duration;
        });
    };

    const addCloneBatchLine = () => {
        setCloneBatchLines((lines) => [
            ...lines,
            {
                id: Math.random().toString(36).substr(2, 9),
                level: 1, // Default to Aji
                duration: 30,
                quantity: 1,
                maxUses: 1,
                isCustomCode: false,
            },
        ]);
    };

    const removeCloneBatchLine = (id: string) => {
        setCloneBatchLines((lines) => lines.filter((line) => line.id !== id));
    };

    const generateTicketHTML = async () => {
        let html = "";
        const baseUrl = "https://online-go.com/redeem";

        if (batch?.codes.length) {
            for (const code of batch.codes) {
                const redemptionUrl = `${baseUrl}/${code.code}`;
                const isMultiUse = code.max_uses && code.max_uses > 1;

                // Generate QR code
                let qrCodeDataUrl = "";
                try {
                    qrCodeDataUrl = await QRCode.toDataURL(redemptionUrl, {
                        width: 200,
                        margin: 1,
                        color: {
                            dark: "#000000",
                            light: "#FFFFFF",
                        },
                    });
                } catch (err) {
                    console.error("Error generating QR code:", err);
                }

                if (isMultiUse) {
                    // Multi-use voucher layout - Public poster design
                    html += `
                        <div class="voucher-container multi-use">
                            <div class="voucher multi-use-voucher">
                                <div class="header-multi">
                                    <img src="https://cdn.online-go.com/assets/ogs_bw.svg" alt="OGS Logo" class="logo-multi" />
                                    <h2 class="title-right">${interpolate(
                                        pgettext(
                                            "Voucher title",
                                            "Free {{days}} Day AI Access Code",
                                        ),
                                        { days: code.duration },
                                    )}</h2>
                                </div>
                                
                                <div class="content-multi">
                                    <div class="level-banner">
                                        <h3>${interpolate(
                                            pgettext(
                                                "Voucher subtitle",
                                                "Free {{level}} Level Access",
                                            ),
                                            { level: getLevelName(code.supporter_level) },
                                        )}</h3>
                                        <p class="level-description">
                                            ${interpolate(
                                                pgettext(
                                                    "Voucher description",
                                                    "Use this code to get a free {{days}} days of {{level}} level AI reviews at Online-Go.com. Existing supporters will be upgraded to the next level or {{level}}, whichever is higher.*",
                                                ),
                                                {
                                                    days: code.duration,
                                                    level: getLevelName(code.supporter_level),
                                                },
                                            )}
                                        </p>
                                    </div>
                                    
                                    <div class="redemption-row">
                                        <div class="qr-section-multi">
                                            ${
                                                qrCodeDataUrl
                                                    ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code-multi" />`
                                                    : ""
                                            }
                                            <p class="scan-text">${pgettext(
                                                "QR instruction",
                                                "Scan to redeem",
                                            )}</p>
                                        </div>
                                        
                                        <div class="divider-multi">
                                            <span>${pgettext("Divider", "OR")}</span>
                                        </div>
                                        
                                        <div class="manual-section">
                                            <p class="manual-instruction">${pgettext(
                                                "Manual instruction",
                                                "Redeem this code at",
                                            )}</p>
                                            <p class="manual-url">online-go.com/redeem</p>
                                            <div class='code-multi'>${code.code}</div>
                                        </div>
                                    </div>
                                    
                                    <div class="ai-description">
                                        <h3>${pgettext(
                                            "About section title",
                                            "About AI Reviews at Online-Go.com",
                                        )}</h3>
                                        <p>
                                            ${pgettext(
                                                "AI description",
                                                "Our advanced AI analysis engine provides superhuman analysis of each move after your games, allowing you to spot key mistakes, explore variations, and see how your opponent might have responded if different decisions were made. It is perfect for players of all levels looking to understand their games more deeply and accelerate their improvement. The tool can be used to analyze games played on Online-Go.com or games played on other platforms using the SGF upload feature.",
                                            )}
                                        </p>
                                    </div>
                                </div>
                                
                                <div class="footer-multi">
                                    <div class="footer-left-multi">
                                        <span class="website">online-go.com</span>
                                        <span class="footnote-multi">*${pgettext(
                                            "Footnote",
                                            "Maximum level: Meijin",
                                        )}</span>
                                    </div>
                                    <span class="expiry">${interpolate(
                                        pgettext("Expiry label", "Valid until: {{date}}"),
                                        {
                                            date: formatDate(
                                                code.specific_expiration || batch?.expiration_date,
                                            ),
                                        },
                                    )}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Single-use voucher layout - Personal prize certificate
                    html += `
                        <div class="voucher-container single-use">
                            <div class="voucher single-use-voucher">
                                <div class="certificate-header">
                                    <div class="corner-flourish left"></div>
                                    <div class="header-content">
                                        <img src="https://cdn.online-go.com/assets/ogs_bw.svg" alt="OGS Logo" class="logo-certificate" />
                                        <h1>${pgettext(
                                            "Certificate title",
                                            "Prize Certificate",
                                        )}</h1>
                                        <div class="decorative-line"></div>
                                    </div>
                                    <div class="corner-flourish right"></div>
                                </div>
                                
                                <div class="congratulations-section">
                                    <h2>${pgettext(
                                        "Congratulations message",
                                        "Congratulations!",
                                    )}</h2>
                                    <p class="recipient-message">
                                        ${interpolate(
                                            pgettext(
                                                "Certificate message",
                                                "You have been awarded full access to Online-Go.com's advanced AI features! Use this code to get {{days}} days of {{level}} level AI reviews. Existing supporters will be upgraded to the next level or {{level}}, whichever is higher.*",
                                            ),
                                            {
                                                days: code.duration,
                                                level: getLevelName(code.supporter_level),
                                            },
                                        )}
                                    </p>
                                </div>
                                
                                <div class="prize-details">
                                    <div class="detail-row">
                                        <span class="detail-label">${pgettext(
                                            "Detail label",
                                            "Prize Level",
                                        )}:</span>
                                        <span class="detail-value level-badge ${getLevelName(
                                            code.supporter_level,
                                        ).toLowerCase()}">${getLevelName(
                                            code.supporter_level,
                                        )}</span>
                                    </div>
                                    <div class="detail-row">
                                        <span class="detail-label">${pgettext(
                                            "Detail label",
                                            "Duration",
                                        )}:</span>
                                        <span class="detail-value">${interpolate(
                                            pgettext("Duration format", "{{days}} Days"),
                                            { days: code.duration },
                                        )}</span>
                                    </div>
                                </div>
                                
                                <div class="redemption-section">
                                    <div class="qr-container">
                                        ${
                                            qrCodeDataUrl
                                                ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code-certificate" />`
                                                : ""
                                        }
                                        <p class="qr-label">${pgettext(
                                            "QR instruction",
                                            "Scan to Redeem",
                                        )}</p>
                                    </div>
                                    
                                    <div class="divider-ornament">
                                        <span>${pgettext("Divider", "OR")}</span>
                                    </div>
                                    
                                    <div class="code-container">
                                        <p class="code-instruction">${pgettext(
                                            "Manual instruction",
                                            "Redeem this code at",
                                        )}</p>
                                        <p class="code-url">online-go.com/redeem</p>
                                        <div class='prize-code'>${code.code}</div>
                                    </div>
                                </div>
                                
                                <div class="certificate-footer">
                                    <div class="footer-left">
                                        <p class="website-url">online-go.com</p>
                                        <p class="footnote">*${pgettext(
                                            "Footnote",
                                            "Maximum level: Meijin",
                                        )}</p>
                                    </div>
                                    <div class="validity-seal">
                                        <p class="valid-label">${pgettext(
                                            "Validity label",
                                            "Valid Until",
                                        )}</p>
                                        <p class="valid-date">${formatDate(
                                            code.specific_expiration || batch?.expiration_date,
                                        )}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } else {
            html = `<p>${pgettext("Empty state", "No codes available.")}</p>`;
        }
        return html;
    };

    const handlePrint = async () => {
        const printWindow = window.open("", "_blank");
        const ticketHTML = await generateTicketHTML();
        const htmlContent = `
            <html>
                <head>
                    <title>${pgettext("Print title", "Prize Vouchers")}</title>
                    <style>
                        @media screen {
                            body {
                                display: none;
                            }
                        }

                        @media print {
                            @page {
                                margin: 0;
                                size: A4;
                            }

                            body {
                                margin: 0;
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", "Noto Sans CJK", "Helvetica Neue", "PingFang SC", "Hiragino Sans", "Microsoft YaHei", sans-serif;
                            }

                            .voucher-container {
                                width: 210mm;
                                height: 297mm;
                                position: relative;
                                page-break-after: always;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 15mm;
                                box-sizing: border-box;
                            }

                            /* ===== MULTI-USE VOUCHER - PUBLIC POSTER STYLE ===== */
                            .multi-use-voucher {
                                width: 100%;
                                max-width: 180mm;
                                border: 2px solid #2563eb;
                                border-radius: 12px;
                                overflow: hidden;
                                background: white;
                                box-shadow: 0 4px 24px rgba(37, 99, 235, 0.1);
                            }

                            .header-multi {
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 25px 30px;
                                border-bottom: 2px solid #2563eb;
                                background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
                            }

                            .logo-multi {
                                width: 80px;
                                height: auto;
                            }

                            .header-multi h2 {
                                margin: 0;
                                font-size: 28px;
                                font-weight: 700;
                                color: #2563eb;
                            }

                            .title-right {
                                text-align: right;
                                flex: 1;
                            }

                            .content-multi {
                                padding: 30px;
                            }

                            .level-banner {
                                text-align: center;
                                padding: 20px;
                                background: #f0f7ff;
                                border-radius: 8px;
                                margin-bottom: 30px;
                            }

                            .level-banner h3 {
                                margin: 0 0 10px 0;
                                font-size: 24px;
                                font-weight: 700;
                                color: #1e40af;
                            }

                            .level-description {
                                margin: 0;
                                font-size: 14px;
                                color: #475569;
                                line-height: 1.6;
                            }

                            .redemption-row {
                                display: flex;
                                align-items: center;
                                justify-content: space-around;
                                margin: 40px 0;
                                padding: 30px;
                                background: #fafbfc;
                                border-radius: 8px;
                            }

                            .qr-section-multi {
                                text-align: center;
                            }

                            .qr-code-multi {
                                width: 180px;
                                height: 180px;
                                padding: 10px;
                                background: white;
                                border: 2px solid #2563eb;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
                            }

                            .scan-text {
                                margin: 15px 0 0 0;
                                font-size: 16px;
                                color: #2563eb;
                                font-weight: 600;
                            }

                            .divider-multi {
                                display: flex;
                                align-items: center;
                                padding: 0 30px;
                            }

                            .divider-multi span {
                                font-size: 18px;
                                font-weight: 600;
                                color: #94a3b8;
                                padding: 10px 20px;
                                background: white;
                                border-radius: 20px;
                                border: 2px solid #e2e8f0;
                            }

                            .manual-section {
                                text-align: center;
                            }

                            .manual-instruction {
                                margin: 0 0 4px 0;
                                font-size: 12px;
                                color: #475569;
                            }

                            .manual-url {
                                margin: 0 0 12px 0;
                                font-size: 12px;
                                color: #2563eb;
                                font-weight: 600;
                            }

                            .code-multi {
                                font-size: 36px;
                                font-weight: 900;
                                letter-spacing: 0.3rem;
                                color: #2563eb;
                                margin: 15px 0;
                                font-family: "Courier New", monospace;
                            }

                            .ai-description {
                                margin: 30px 0;
                                padding: 25px;
                                background: #f8fafc;
                                border-radius: 8px;
                                border: 1px solid #e2e8f0;
                            }

                            .ai-description h3 {
                                margin: 0 0 15px 0;
                                font-size: 18px;
                                font-weight: 700;
                                color: #1e40af;
                            }

                            .ai-description p {
                                margin: 0;
                                font-size: 14px;
                                color: #475569;
                                line-height: 1.6;
                                text-align: justify;
                            }

                            .footer-multi {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 20px 30px;
                                border-top: 2px solid #e2e8f0;
                                background: #f8fafc;
                            }

                            .footer-left-multi {
                                display: flex;
                                flex-direction: column;
                                gap: 4px;
                            }

                            .footer-multi .website {
                                font-size: 16px;
                                font-weight: 600;
                                color: #2563eb;
                            }

                            .footnote-multi {
                                font-size: 11px;
                                color: #64748b;
                                font-style: italic;
                            }

                            .footer-multi .expiry {
                                font-size: 14px;
                                color: #2563eb;
                                font-weight: 600;
                            }

                            /* ===== SINGLE-USE VOUCHER - CERTIFICATE STYLE ===== */
                            .single-use-voucher {
                                width: 100%;
                                max-width: 180mm;
                                border: 2px solid #d4af37;
                                border-radius: 8px;
                                background: linear-gradient(135deg, #fffef7 0%, #fffdf5 100%);
                                position: relative;
                                overflow: hidden;
                                box-shadow: 0 4px 24px rgba(212, 175, 55, 0.15);
                            }

                            .certificate-header {
                                position: relative;
                                padding: 30px;
                                background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.03));
                                border-bottom: 2px solid rgba(212, 175, 55, 0.2);
                            }

                            .corner-flourish {
                                position: absolute;
                                width: 60px;
                                height: 60px;
                                border: 2px solid #d4af37;
                                opacity: 0.3;
                            }

                            .corner-flourish.left {
                                top: 10px;
                                left: 10px;
                                border-right: none;
                                border-bottom: none;
                            }

                            .corner-flourish.right {
                                top: 10px;
                                right: 10px;
                                border-left: none;
                                border-bottom: none;
                            }

                            .header-content {
                                text-align: center;
                            }

                            .logo-certificate {
                                width: 80px;
                                height: 80px;
                                margin-bottom: 16px;
                                opacity: 0.8;
                            }

                            .certificate-header h1 {
                                margin: 0;
                                font-size: 32px;
                                font-weight: 300;
                                letter-spacing: 4px;
                                text-transform: uppercase;
                                color: #78350f;
                            }

                            .decorative-line {
                                width: 100px;
                                height: 2px;
                                background: linear-gradient(90deg, transparent, #d4af37, transparent);
                                margin: 12px auto 0;
                            }

                            .congratulations-section {
                                text-align: center;
                                padding: 30px 40px;
                            }

                            .congratulations-section h2 {
                                margin: 0;
                                font-size: 36px;
                                font-weight: 700;
                                color: #d4af37;
                                text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.2);
                            }

                            .recipient-message {
                                margin: 12px 0 0 0;
                                font-size: 16px;
                                color: #451a03;
                                font-style: italic;
                            }

                            .prize-details {
                                padding: 0 40px;
                                margin-bottom: 30px;
                            }

                            .detail-row {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                padding: 12px 0;
                                border-bottom: 1px dotted #d4af37;
                            }

                            .detail-label {
                                font-size: 14px;
                                color: #78350f;
                                font-weight: 500;
                            }

                            .detail-value {
                                font-size: 16px;
                                font-weight: 700;
                                color: #451a03;
                            }

                            .level-badge {
                                padding: 4px 12px;
                                border-radius: 4px;
                                background: linear-gradient(135deg, #d4af37, #b8860b);
                                color: white;
                            }

                            .redemption-section {
                                padding: 30px;
                                background: rgba(212, 175, 55, 0.03);
                                display: flex;
                                align-items: center;
                                justify-content: space-around;
                                gap: 30px;
                            }

                            .qr-container {
                                text-align: center;
                            }

                            .qr-code-certificate {
                                width: 150px;
                                height: 150px;
                                padding: 8px;
                                background: white;
                                border: 2px solid #d4af37;
                                border-radius: 8px;
                            }

                            .qr-label {
                                margin: 8px 0 0 0;
                                font-size: 12px;
                                color: #78350f;
                                font-weight: 600;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            }

                            .divider-ornament {
                                position: relative;
                                width: 60px;
                                text-align: center;
                            }

                            .divider-ornament span {
                                display: inline-block;
                                padding: 8px 16px;
                                background: white;
                                border: 1px solid #d4af37;
                                border-radius: 20px;
                                color: #78350f;
                                font-size: 14px;
                                font-weight: 600;
                            }

                            .code-container {
                                text-align: center;
                            }

                            .code-instruction {
                                margin: 0 0 4px 0;
                                font-size: 12px;
                                color: #78350f;
                            }

                            .code-url {
                                margin: 0 0 12px 0;
                                font-size: 12px;
                                color: #d4af37;
                                font-weight: 600;
                            }

                            .prize-code {
                                font-size: 36px;
                                font-weight: 900;
                                letter-spacing: 6px;
                                color: #d4af37;
                                font-family: "Courier New", monospace;
                                text-shadow: 1px 1px 2px rgba(212, 175, 55, 0.2);
                            }

                            .terms-section {
                                padding: 20px 40px;
                                background: rgba(0, 0, 0, 0.02);
                                border-top: 1px solid rgba(212, 175, 55, 0.2);
                            }

                            .terms-text {
                                margin: 0;
                                font-size: 11px;
                                color: #78350f;
                                line-height: 1.6;
                                text-align: justify;
                            }

                            .certificate-footer {
                                display: flex;
                                justify-content: space-between;
                                align-items: flex-end;
                                padding: 20px 40px;
                                background: linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.03));
                                border-top: 2px solid rgba(212, 175, 55, 0.2);
                            }

                            .footer-left p {
                                margin: 0;
                                font-size: 12px;
                                color: #78350f;
                            }

                            .website-url {
                                font-weight: 700;
                                font-size: 14px !important;
                            }

                            .footnote {
                                margin-top: 4px !important;
                                font-size: 10px !important;
                                opacity: 0.7;
                            }

                            .validity-seal {
                                text-align: center;
                                padding: 12px 20px;
                                border: 2px solid #d4af37;
                                border-radius: 8px;
                                background: white;
                            }

                            .valid-label {
                                margin: 0;
                                font-size: 10px;
                                text-transform: uppercase;
                                letter-spacing: 1px;
                                color: #78350f;
                                opacity: 0.7;
                            }

                            .valid-date {
                                margin: 4px 0 0 0;
                                font-size: 16px;
                                font-weight: 700;
                                color: #d4af37;
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
                    <div id="tickets-container">${ticketHTML}</div>
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

    const copyRedemptionUrl = (code: string) => {
        const url = `${window.location.origin}/redeem/${code}`;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                toast(
                    <div>
                        {pgettext(
                            "Prize redemption URL copy success",
                            "Redemption URL copied to clipboard",
                        )}
                    </div>,
                    2000,
                );
            })
            .catch((err) => {
                console.error("Failed to copy URL:", err);
                toast(
                    <div>{pgettext("Prize redemption URL copy error", "Failed to copy URL")}</div>,
                    2000,
                );
            });
    };

    return (
        <div className="prize-batch">
            <div className="batch-info">
                <h2>{pgettext("Prize batch details section heading", "Batch Details")}</h2>
                <p>
                    <strong>{pgettext("Prize batch ID label", "Batch ID")}:</strong> {batch?.id}
                </p>
                <p>
                    <strong>{pgettext("Prize batch creator label", "Created By")}:</strong>{" "}
                    <Player user={batch?.created_by} />
                </p>
                <p>
                    <strong>{pgettext("Prize batch expiration label", "Valid until")}:</strong>{" "}
                    {batch?.expiration_date ? formatDate(batch?.expiration_date) : ""}
                </p>
                <p>
                    <strong>{pgettext("Prize batch notes label", "Notes")}:</strong> {batch?.notes}
                </p>
                {batch?.codes && batch.codes.length > 0 && (
                    <div className="prize-summary">
                        <h3>{pgettext("Section title", "Prize Summary")}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>{pgettext("Table header", "Level")}</th>
                                    <th>{pgettext("Table header", "Duration")}</th>
                                    <th>{pgettext("Table header", "Total")}</th>
                                    <th>{pgettext("Table header", "Redeemed")}</th>
                                    <th>{pgettext("Table header", "Available")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getPrizeSummary(batch.codes).map((item, i) => (
                                    <tr key={i}>
                                        <td>{getLevelName(item.level)}</td>
                                        <td>
                                            {interpolate(
                                                pgettext("Duration format", "{{days}} days"),
                                                { days: item.duration },
                                            )}
                                        </td>
                                        <td>{item.total}</td>
                                        <td>{item.redeemed}</td>
                                        <td>{item.total - item.redeemed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="codes">
                <div className="codes-header">
                    <h3>{pgettext("Section title", "Codes")}</h3>
                    <div className="actions">
                        <button className="print-btn" onClick={handlePrint}>
                            {pgettext("Button action", "Print Vouchers")}
                        </button>
                        {user.is_superuser && (
                            <>
                                <button
                                    className="add-codes-btn"
                                    onClick={() => setShowModal(true)}
                                >
                                    {pgettext("Button action", "Add Codes")}
                                </button>
                                <button
                                    className="clone-btn"
                                    onClick={() => setShowCloneModal(true)}
                                >
                                    {pgettext("Button action", "Clone Batch")}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th></th>
                            <th>{pgettext("Table header", "Code")}</th>
                            <th>{pgettext("Table header", "Level")}</th>
                            <th>{pgettext("Table header", "Duration")}</th>
                            <th>{pgettext("Table header", "Uses")}</th>
                            <th>{pgettext("Table header", "Expires")}</th>
                            <th>{pgettext("Table header", "First Redeemed By")}</th>
                            <th>{pgettext("Table header", "Last Redeemed")}</th>
                            {user.is_superuser && <th>{pgettext("Table header", "Actions")}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {batch &&
                            sortCodes(batch.codes).map((code, i) => (
                                <tr key={i}>
                                    <td>
                                        <button
                                            className="link-icon-btn"
                                            onClick={() => copyRedemptionUrl(code.code)}
                                            title={pgettext(
                                                "Button tooltip",
                                                "Copy redemption URL",
                                            )}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: "0.25rem",
                                                color: "#4a90e2",
                                                fontSize: "1.2rem",
                                            }}
                                        >
                                            🔗
                                        </button>
                                    </td>
                                    <td>{code.code}</td>
                                    <td>{getLevelName(code.supporter_level)}</td>
                                    <td>
                                        {interpolate(pgettext("Duration format", "{{days}} days"), {
                                            days: code.duration,
                                        })}
                                    </td>
                                    <td>
                                        {code.times_used || 0}/{code.max_uses || 1}
                                    </td>
                                    <td>
                                        {code.specific_expiration
                                            ? formatDate(code.specific_expiration)
                                            : formatDate(batch?.expiration_date)}
                                    </td>
                                    <td>
                                        {code.redemptions && code.redemptions.length > 0 ? (
                                            <Player user={code.redemptions[0].redeemed_by} />
                                        ) : (
                                            pgettext("Not available abbreviation", "N/A")
                                        )}
                                    </td>
                                    <td>
                                        {code.redemptions && code.redemptions.length > 0
                                            ? formatDate(
                                                  code.redemptions[code.redemptions.length - 1]
                                                      .redeemed_at,
                                              )
                                            : "N/A"}
                                    </td>
                                    {user.is_superuser && (
                                        <td>
                                            {code.times_used > 0 ? (
                                                ""
                                            ) : (
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => deleteCode(code)}
                                                >
                                                    {pgettext("Button action", "Delete")}
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
                        <h3>{pgettext("Modal title", "Add Codes")}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={isCustomCode}
                                        onChange={(e) => setIsCustomCode(e.target.checked)}
                                    />{" "}
                                    {pgettext("Form label", "Use custom code")}
                                </label>
                            </div>
                            {isCustomCode ? (
                                <div className="form-group">
                                    <label>{pgettext("Form label", "Custom Code")}:</label>
                                    <input
                                        type="text"
                                        value={customCode}
                                        onChange={(e) =>
                                            setCustomCode(e.target.value.toUpperCase())
                                        }
                                        placeholder={pgettext("Input placeholder", "e.g., FUN4U")}
                                        maxLength={20}
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>{pgettext("Form label", "Quantity")}:</label>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={handleQtyChange}
                                        min="1"
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>{pgettext("Form label", "Max Uses (per code)")}:</label>
                                <input
                                    type="number"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(parseInt(e.target.value))}
                                    min="1"
                                />{" "}
                                <span className="hint">
                                    {pgettext(
                                        "Help text",
                                        "(How many times can this code be redeemed)",
                                    )}
                                </span>
                            </div>
                            <div className="form-group">
                                <label>{pgettext("Form label", "Duration")}:</label>
                                <input
                                    type="number"
                                    value={duration}
                                    onChange={handleDurationChange}
                                    min="1"
                                />{" "}
                                {pgettext("Time unit", "days")}
                            </div>
                            <div className="form-group">
                                <label>{pgettext("Form label", "Level")}:</label>
                                <select value={level} onChange={handleLevelChange}>
                                    <option value="1">Aji</option>
                                    <option value="2">Hane</option>
                                    <option value="3">Tenuki</option>
                                    <option value="4">Meijin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>
                                    {pgettext("Form label", "Specific Expiration (optional)")}:
                                </label>
                                <input
                                    type="date"
                                    value={specificExpiration}
                                    onChange={(e) => setSpecificExpiration(e.target.value)}
                                />{" "}
                                <span className="hint">
                                    {pgettext("Help text", "(Leave blank to use batch expiration)")}
                                </span>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="add-codes-btn">
                                    {pgettext("Button action", "Add Codes")}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowModal(false)}
                                >
                                    {pgettext("Button action", "Cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showCloneModal && (
                <div className="modal-overlay">
                    <div className="modal clone-modal">
                        <h3>{pgettext("Modal title", "Clone Prize Batch")}</h3>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void handleCloneBatch();
                            }}
                        >
                            <div className="form-group">
                                <label>{pgettext("Form label", "Notes")}:</label>
                                <textarea
                                    value={cloneNotes}
                                    onChange={(e) => setCloneNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>{pgettext("Form label", "Expiration Date")}:</label>
                                <input
                                    type="date"
                                    value={cloneExpiration}
                                    onChange={(e) => {
                                        const newExpiration = e.target.value;
                                        setCloneExpiration(newExpiration);
                                        // Recalculate custom expiration dates when batch expiration changes
                                        // but preserve any custom codes that were entered
                                        if (batch) {
                                            // Create a map to preserve entered custom codes
                                            const customCodeMap = new Map<string, string>();
                                            cloneBatchLines.forEach((line) => {
                                                if (
                                                    line.isCustomCode &&
                                                    line.originalCustomCode &&
                                                    line.newCustomCode
                                                ) {
                                                    customCodeMap.set(
                                                        line.originalCustomCode,
                                                        line.newCustomCode,
                                                    );
                                                }
                                            });

                                            const lines = analyzeBatchCodes(
                                                batch.codes,
                                                newExpiration,
                                            );

                                            // Restore the entered custom codes
                                            lines.forEach((line) => {
                                                if (
                                                    line.isCustomCode &&
                                                    line.originalCustomCode &&
                                                    customCodeMap.has(line.originalCustomCode)
                                                ) {
                                                    line.newCustomCode = customCodeMap.get(
                                                        line.originalCustomCode,
                                                    );
                                                }
                                            });

                                            setCloneBatchLines(lines);
                                        }
                                    }}
                                />
                            </div>

                            <div className="batch-lines">
                                <h4>{pgettext("Section title", "Prize Lines")}</h4>
                                {cloneBatchLines.some((line) => line.isCustomCode) && (
                                    <p
                                        style={{
                                            color: "#d4af37",
                                            fontStyle: "italic",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        ⚠️{" "}
                                        {pgettext(
                                            "Warning message",
                                            "Custom codes require new unique codes to be entered",
                                        )}
                                    </p>
                                )}
                                <table>
                                    <thead>
                                        <tr>
                                            <th>{pgettext("Table header", "Type")}</th>
                                            <th>{pgettext("Table header", "Custom Code")}</th>
                                            <th>{pgettext("Table header", "Level")}</th>
                                            <th>{pgettext("Table header", "Duration (days)")}</th>
                                            <th>{pgettext("Table header", "Quantity")}</th>
                                            <th>{pgettext("Table header", "Max Uses")}</th>
                                            <th>{pgettext("Table header", "Custom Expiration")}</th>
                                            <th>{pgettext("Table header", "Actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cloneBatchLines.map((line) => (
                                            <tr key={line.id}>
                                                <td>
                                                    {line.isCustomCode ? (
                                                        <span
                                                            style={{
                                                                color: "#d4af37",
                                                                fontWeight: "bold",
                                                            }}
                                                        >
                                                            {pgettext("Code type", "Custom")}
                                                        </span>
                                                    ) : (
                                                        pgettext("Code type", "Regular")
                                                    )}
                                                </td>
                                                <td>
                                                    {line.isCustomCode ? (
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontSize: "0.85em",
                                                                    color: "#666",
                                                                    marginBottom: "4px",
                                                                }}
                                                            >
                                                                {interpolate(
                                                                    pgettext(
                                                                        "Previous value",
                                                                        "Was: {{code}}",
                                                                    ),
                                                                    {
                                                                        code: line.originalCustomCode,
                                                                    },
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={line.newCustomCode || ""}
                                                                onChange={(e) =>
                                                                    updateCloneBatchLine(
                                                                        line.id,
                                                                        "newCustomCode",
                                                                        e.target.value.toUpperCase(),
                                                                    )
                                                                }
                                                                placeholder={pgettext(
                                                                    "Input placeholder",
                                                                    "REQUIRED",
                                                                )}
                                                                style={{
                                                                    width: "120px",
                                                                    border: !line.newCustomCode
                                                                        ? "2px solid #ff4444"
                                                                        : "1px solid #ccc",
                                                                    backgroundColor:
                                                                        !line.newCustomCode
                                                                            ? "#fff5f5"
                                                                            : "white",
                                                                }}
                                                                required
                                                            />
                                                        </div>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td>
                                                    <select
                                                        value={line.level}
                                                        onChange={(e) =>
                                                            updateCloneBatchLine(
                                                                line.id,
                                                                "level",
                                                                parseInt(e.target.value),
                                                            )
                                                        }
                                                    >
                                                        <option value="1">Aji</option>
                                                        <option value="2">Hane</option>
                                                        <option value="3">Tenuki</option>
                                                        <option value="4">Meijin</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={line.duration}
                                                        onChange={(e) =>
                                                            updateCloneBatchLine(
                                                                line.id,
                                                                "duration",
                                                                parseInt(e.target.value),
                                                            )
                                                        }
                                                        min="1"
                                                        style={{ width: "60px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={line.quantity}
                                                        onChange={(e) =>
                                                            updateCloneBatchLine(
                                                                line.id,
                                                                "quantity",
                                                                parseInt(e.target.value),
                                                            )
                                                        }
                                                        min="1"
                                                        disabled={line.isCustomCode}
                                                        style={{ width: "60px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={line.maxUses}
                                                        onChange={(e) =>
                                                            updateCloneBatchLine(
                                                                line.id,
                                                                "maxUses",
                                                                parseInt(e.target.value),
                                                            )
                                                        }
                                                        min="1"
                                                        style={{ width: "60px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        value={line.specificExpiration || ""}
                                                        onChange={(e) =>
                                                            updateCloneBatchLine(
                                                                line.id,
                                                                "specificExpiration",
                                                                e.target.value || undefined,
                                                            )
                                                        }
                                                        style={{ width: "140px" }}
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="remove-line-btn"
                                                        onClick={() =>
                                                            removeCloneBatchLine(line.id)
                                                        }
                                                    >
                                                        {pgettext("Button action", "Remove")}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <button
                                    type="button"
                                    className="add-line-btn"
                                    onClick={addCloneBatchLine}
                                    disabled={isCloning}
                                >
                                    {pgettext("Button action", "Add Prize Line")}
                                </button>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="clone-submit-btn"
                                    disabled={isCloning}
                                >
                                    {isCloning
                                        ? pgettext("Button state", "Cloning...")
                                        : pgettext("Button action", "Clone Batch")}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowCloneModal(false)}
                                    disabled={isCloning}
                                >
                                    {pgettext("Button action", "Cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
