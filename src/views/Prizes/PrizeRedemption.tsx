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

import React, { useState, useRef, useEffect } from "react";
import { get, post } from "@/lib/requests";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@/lib/hooks";
import { interpolate, pgettext } from "@/lib/translate";
import "./PrizeRedemption.css";

interface Prize {
    batch: string;
    id: number;
    duration: number;
    code: string;
    redeemed_ad: string;
    redeemed_by: number;
    supporter_level: number;
    times_used?: number;
    max_uses?: number;
    is_available?: boolean;
    user_has_redeemed?: boolean;
}

interface UpgradeInfo {
    current_level: number;
    prize_level: number;
    new_level: number;
    duration_days: number;
}

// Helper function to get supporter level name from numeric level
function getSupporterLevelName(level: number): string {
    switch (level) {
        case 0:
            return "";
        case 1:
            return pgettext("OGS supporter level name", "Aji");
        case 2:
            return pgettext("OGS supporter level name", "Hane");
        case 3:
            return pgettext("OGS supporter level name", "Tenuki");
        case 4:
            return pgettext("OGS supporter level name", "Meijin");
        default:
            return "";
    }
}

export function PrizeRedemption(): React.ReactElement {
    const params = useParams<{ code?: string }>();
    const [code, setCode] = useState("");
    const [prizeInfo, setPrizeInfo] = useState<Prize>();
    const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo>();
    const [codeValidated, setCodeValidated] = useState(false);
    const [showForm, setShowForm] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [redeemed, setRedeemed] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const user = useUser();

    if (user.anonymous) {
        void navigate("/sign-in");
    }

    // Handle URL-based code redemption - pre-fill only, no auto-submit
    useEffect(() => {
        if (params.code) {
            setCode(params.code.toUpperCase());

            // Focus on the submit button to draw user's attention
            // They can review their account before submitting
            setTimeout(() => {
                const submitButton = document.querySelector(
                    'button[type="submit"]',
                ) as HTMLButtonElement;
                submitButton?.focus();
            }, 100);
        }
    }, [params.code]);

    const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Don't allow changes while loading
        if (loading) {
            return;
        }
        // Allow alphanumeric codes, remove spaces and convert to uppercase
        const cleanedCode = event.target.value.replace(/\s/g, "").toUpperCase();
        setCode(cleanedCode);
        setError(""); // Clear error when user types
        setCodeValidated(false); // Reset validation when code changes
        setPrizeInfo(undefined); // Clear prize info when code changes
        setUpgradeInfo(undefined); // Clear upgrade info when code changes
    };

    // Auto-fetch prize details when code looks complete
    useEffect(() => {
        if (code.length >= 4) {
            const timer = setTimeout(() => {
                fetchPrizeDetails(code);
            }, 500);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [code]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit(event as any);
        }
    };

    const fetchPrizeDetails = (codeToCheck: string, isManualCheck: boolean = false) => {
        if (!codeToCheck || codeToCheck.length < 1) {
            return;
        }

        // Only show loading state for manual checks
        if (isManualCheck) {
            setLoading(true);
            setError("");
        }

        get("prizes/redeem", { code: codeToCheck })
            .then((res) => {
                setPrizeInfo(res.voucher);
                // Process upgrade info from API
                const upgradeData = res.upgrade_info;
                setUpgradeInfo(upgradeData);

                // For automatic checks, if code is valid, update state and focus button
                if (!isManualCheck && res.voucher.is_available && !res.voucher.user_has_redeemed) {
                    setCodeValidated(true);
                    // Focus the submit button for easy redemption
                    setTimeout(() => {
                        const submitButton = document.querySelector(
                            'button[type="submit"]',
                        ) as HTMLButtonElement;
                        submitButton?.focus();
                    }, 100);
                }

                // Only update validation state for manual checks
                if (isManualCheck) {
                    setCodeValidated(true);

                    // Check if user has already redeemed this code
                    if (res.voucher.user_has_redeemed) {
                        setError(
                            pgettext(
                                "Prize redemption error - code already used",
                                "You have already redeemed this code.",
                            ),
                        );
                    }
                    // Check if code is already redeemed or unavailable
                    else if (!res.voucher.is_available) {
                        if (res.voucher.times_used >= res.voucher.max_uses) {
                            setError(
                                pgettext(
                                    "Prize redemption error - max uses reached",
                                    "This code has reached its maximum usage limit.",
                                ),
                            );
                        } else {
                            setError(
                                pgettext(
                                    "Prize redemption error - expired code",
                                    "This code has expired.",
                                ),
                            );
                        }
                    }
                    // Note: We don't set an error for max level here because
                    // the UI handles it through the button text and upgrade preview
                }
            })
            .catch((err) => {
                console.error(err);
                if (isManualCheck) {
                    setError(
                        pgettext("Prize redemption error - invalid code", "Invalid prize code."),
                    );
                    setCodeValidated(false);
                }
            })
            .finally(() => {
                if (isManualCheck) {
                    setLoading(false);
                }
            });
    };

    const handleSubmit = (event: any) => {
        event.preventDefault();

        const enteredCode = code.trim();

        if (enteredCode.length < 1) {
            setError(
                pgettext("Prize redemption error - empty input", "Please enter a prize code."),
            );
            return;
        }

        // If we haven't validated the code yet, fetch details first
        if (!codeValidated) {
            fetchPrizeDetails(enteredCode, true);
            return;
        }

        // If code is validated and available, proceed with redemption
        if (prizeInfo?.is_available && !prizeInfo?.user_has_redeemed) {
            onRedeem();
        }
    };

    const onRedeem = () => {
        setLoading(true);
        setError("");

        const enteredCode = code.trim();
        const data = { code: enteredCode };

        post("prizes/redeem", data)
            .then((res) => {
                if (res.success || res === 200) {
                    setRedeemed(true);
                    setShowForm(false);
                }
            })
            .catch((err) => {
                console.error(err);
                // Check for specific error codes from the API
                if (
                    err?.error === "You have already redeemed this code." ||
                    err?.error_code === "PRIZE_CODE_ALREADY_REDEEMED"
                ) {
                    setError(pgettext("Error message", "You have already redeemed this code."));
                } else if (err?.error_code === "PRIZE_CODE_EXPIRED") {
                    setError(pgettext("Error message", "This code has expired."));
                } else if (err?.error_code === "PRIZE_CODE_MAX_USES_REACHED") {
                    setError(
                        pgettext("Error message", "This code has reached its maximum usage limit."),
                    );
                } else {
                    setError(
                        pgettext(
                            "Prize redemption error - generic failure",
                            "Failed to redeem the prize. Please try again.",
                        ),
                    );
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onCancel = () => {
        void navigate("/");
    };

    return (
        <div className="prize-redemption">
            <h2>{pgettext("Prize redemption page heading", "Prize Redemption")}</h2>
            {showForm && (
                <form onSubmit={handleSubmit}>
                    <p>
                        {pgettext(
                            "Prize redemption form instructions",
                            "Enter your prize code below to redeem your prize.",
                        )}
                    </p>

                    <div className="code-input-container">
                        <label htmlFor="prize-code-input">
                            {pgettext("Prize code input field label", "Prize Code:")}
                        </label>
                        <div className="input-wrapper">
                            <input
                                id="prize-code-input"
                                type="text"
                                className={`prize-code-input ${loading ? "loading" : ""} ${
                                    codeValidated && prizeInfo?.is_available ? "valid" : ""
                                }`}
                                placeholder={pgettext(
                                    "Prize code input placeholder text",
                                    "Enter code (e.g., FUN4U or ABC123)",
                                )}
                                value={code}
                                onChange={handleCodeChange}
                                onKeyPress={handleKeyPress}
                                ref={inputRef}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                            />
                            {codeValidated && prizeInfo?.is_available && (
                                <span className="valid-checkmark">✓</span>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={
                            prizeInfo?.user_has_redeemed
                                ? "already-redeemed"
                                : upgradeInfo && upgradeInfo.current_level >= 4
                                  ? "max-level"
                                  : codeValidated && prizeInfo?.is_available
                                    ? "success redeem-ready"
                                    : "primary check-code"
                        }
                        disabled={
                            loading ||
                            (codeValidated && !prizeInfo?.is_available) ||
                            prizeInfo?.user_has_redeemed ||
                            (upgradeInfo && upgradeInfo.current_level >= 4)
                        }
                    >
                        {loading
                            ? pgettext("Prize redemption button - loading state", "Loading...")
                            : prizeInfo?.user_has_redeemed
                              ? pgettext(
                                    "Prize redemption button - already used",
                                    "Already Redeemed",
                                )
                              : upgradeInfo && upgradeInfo.current_level >= 4
                                ? pgettext(
                                      "Prize redemption button - max level reached",
                                      "Maximum Level",
                                  )
                                : codeValidated && prizeInfo?.is_available
                                  ? pgettext(
                                        "Prize redemption button - ready to redeem",
                                        "Redeem Prize",
                                    )
                                  : pgettext(
                                        "Prize redemption button - validate code",
                                        "Check Code",
                                    )}
                    </button>
                </form>
            )}
            {error && <p className="error">{error}</p>}

            {/* Show prize details when available */}
            {prizeInfo && upgradeInfo && prizeInfo.is_available && !prizeInfo.user_has_redeemed && (
                <div className="prize-preview visible">
                    <div className="prize-header">
                        <h3>{pgettext("Prize preview section heading", "Prize Details")}</h3>
                    </div>

                    <div className="prize-content">
                        <div className="prize-info-card">
                            <div className="info-row highlight">
                                <span className="info-label">
                                    {pgettext(
                                        "Prize details - support level label",
                                        "Support Level",
                                    )}
                                </span>
                                <span className="info-value strong">
                                    {upgradeInfo.new_level > upgradeInfo.current_level ? (
                                        <>
                                            <span className="strikethrough">
                                                {getSupporterLevelName(upgradeInfo.current_level)}
                                            </span>{" "}
                                            →{" "}
                                            <span className="new-level">
                                                {getSupporterLevelName(upgradeInfo.new_level)}
                                            </span>
                                        </>
                                    ) : upgradeInfo.current_level >= 4 ? (
                                        getSupporterLevelName(upgradeInfo.current_level)
                                    ) : (
                                        getSupporterLevelName(upgradeInfo.prize_level)
                                    )}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">
                                    {pgettext("Prize details - duration label", "Duration")}
                                </span>
                                <span className="info-value">
                                    {upgradeInfo.duration_days}{" "}
                                    {pgettext("Time unit plural for prize duration", "days")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="upgrade-details">
                        {upgradeInfo.current_level === 0 &&
                            /*
                            <div className="upgrade-card new-supporter">
                                <div className="card-icon">
                                    <span>●</span>
                                </div>
                                <div className="card-content">
                                    <h4>
                                        {pgettext(
                                            "New supporter welcome heading",
                                            "Welcome to the Community!",
                                        )}
                                    </h4>
                                    <p className="upgrade-message">
                                        {interpolate(
                                            pgettext(
                                                "Prize redemption - new supporter upgrade message",
                                                "You'll become a {{level}} supporter for {{days}} days",
                                            ),
                                            {
                                                level: getSupporterLevelName(
                                                    upgradeInfo.prize_level,
                                                ),
                                                days: upgradeInfo.duration_days,
                                            },
                                        )}
                                    </p>
                                </div>
                            </div>
                            */
                            null}

                        {upgradeInfo.new_level > upgradeInfo.current_level &&
                            upgradeInfo.current_level > 0 && (
                                <div className="upgrade-card level-up">
                                    <div className="card-icon">
                                        <span>↑</span>
                                    </div>
                                    <div className="card-content">
                                        <h4>
                                            {pgettext(
                                                "Existing supporter level upgrade heading",
                                                "Level Upgrade!",
                                            )}
                                        </h4>
                                        <p className="upgrade-message">
                                            <span className="upgrade-flow">
                                                <span className="from-level">
                                                    {getSupporterLevelName(
                                                        upgradeInfo.current_level,
                                                    )}
                                                </span>
                                                <span className="arrow">→</span>
                                                <span className="to-level">
                                                    {getSupporterLevelName(upgradeInfo.new_level)}
                                                </span>
                                            </span>
                                            <span className="duration-note">
                                                {interpolate(
                                                    pgettext(
                                                        "Prize duration suffix phrase",
                                                        "for {{days}} days",
                                                    ),
                                                    {
                                                        days: upgradeInfo.duration_days,
                                                    },
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}

                        {upgradeInfo.current_level >= 4 && (
                            <div className="upgrade-card max-level">
                                <div className="card-icon">
                                    <span>■</span>
                                </div>
                                <div className="card-content">
                                    <h4>
                                        {pgettext(
                                            "Maximum supporter level heading",
                                            "Maximum Level",
                                        )}
                                    </h4>
                                    <p className="upgrade-message">
                                        {pgettext(
                                            "Prize redemption - already at max level message",
                                            "You are already at the maximum supporter level. Please contact anoek to work something else out for you.",
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {upgradeInfo.current_level > 0 &&
                            upgradeInfo.new_level === upgradeInfo.current_level &&
                            upgradeInfo.current_level < 4 && (
                                <div className="upgrade-card extend">
                                    <div className="card-icon">
                                        <span>○</span>
                                    </div>
                                    <div className="card-content">
                                        <h4>
                                            {pgettext(
                                                "Support duration extension heading",
                                                "Extension",
                                            )}
                                        </h4>
                                        <p className="upgrade-message">
                                            {interpolate(
                                                pgettext(
                                                    "Prize redemption - support extension message",
                                                    "Extends your {{level}} support by {{days}} days",
                                                ),
                                                {
                                                    level: getSupporterLevelName(
                                                        upgradeInfo.current_level,
                                                    ),
                                                    days: upgradeInfo.duration_days,
                                                },
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}
            {redeemed && (
                <div className="success-message">
                    <h3>
                        {pgettext(
                            "Prize redemption success heading",
                            "Prize Redeemed Successfully",
                        )}
                    </h3>
                    <p>
                        {pgettext(
                            "Prize redemption success message",
                            "Your prize has been successfully redeemed. Enjoy!",
                        )}
                    </p>
                    <button className="primary" onClick={onCancel}>
                        {pgettext("Close success dialog button", "Close")}
                    </button>
                </div>
            )}
        </div>
    );
}
