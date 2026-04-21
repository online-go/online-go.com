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
import { get, post } from "@/lib/requests";
import { useNavigate } from "react-router-dom";
import { _, interpolate, llm_pgettext } from "@/lib/translate";
import { toast } from "@/lib/toast";
import {
    calculateRowCost,
    DURATION_OPTIONS,
    getDurationLabel,
    getLevelName,
    getMonthlyPrice,
    PrizeConfig,
    SupporterPricing,
} from "./SponsorshipRequestTypes";
import "./SponsorshipRequest.css";
import { LoadingPage } from "@/components/Loading";

export function SponsorshipRequest(): React.ReactElement {
    const navigate = useNavigate();

    const [pricing, setPricing] = useState<SupporterPricing | null>(null);

    React.useEffect(() => {
        window.document.title = _("Sponsorship Request");
    }, []);

    const dev = process.env.NODE_ENV === "development";

    // Form fields
    const [name, setName] = useState(dev ? "Test Organizer" : "");
    const [email, setEmail] = useState(dev ? "test@example.com" : "");
    const [organization, setOrganization] = useState(dev ? "Test Go Club" : "");
    const [website, setWebsite] = useState(dev ? "https://example.com/tournament" : "");
    const [location, setLocation] = useState(dev ? "Test City, USA" : "");
    const [tournamentName, setTournamentName] = useState(dev ? "Test Go Tournament" : "");
    const [startDate, setStartDate] = useState(dev ? "2026-06-01" : "");
    const [endDate, setEndDate] = useState(dev ? "2026-06-03" : "");
    const [expectedPlayers, setExpectedPlayers] = useState<number>(dev ? 50 : 0);
    const [previousYearPlayers, setPreviousYearPlayers] = useState<string>(dev ? "40" : "");
    const [customPrizeCode, setCustomPrizeCode] = useState(
        dev ? Math.random().toString(36).substring(2, 8).toUpperCase() : "",
    );

    // Prize rows - default one of each level
    const [prizeRows, setPrizeConfigs] = useState<PrizeConfig[]>([
        { level: 4, duration: 30, quantity: 1 },
        { level: 3, duration: 30, quantity: 1 },
        { level: 2, duration: 30, quantity: 1 },
    ]);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        get("prizes/pricing")
            .then((data: SupporterPricing) => setPricing(data))
            .catch((err: unknown) => console.error("Error fetching pricing:", err));
    }, []);

    if (!pricing) {
        return <LoadingPage />;
    }

    const haneMonthlyPrice = pricing.hane.monthly_price_usd / 100;
    const attendeeHaneValue = haneMonthlyPrice * expectedPlayers;
    const budgetPerPlayer = haneMonthlyPrice / 2;
    const totalBudget = Math.max(100, budgetPerPlayer * expectedPlayers);
    const prizeCost = prizeRows.reduce((sum, row) => sum + calculateRowCost(pricing, row), 0);
    const totalValue = attendeeHaneValue + prizeCost;
    const overBudget = prizeCost > totalBudget;

    const formValid =
        name.trim() &&
        email.trim() &&
        location.trim() &&
        tournamentName.trim() &&
        startDate &&
        endDate &&
        expectedPlayers > 0 &&
        customPrizeCode.trim() &&
        prizeRows.length > 0 &&
        !overBudget;

    function updateRow(index: number, updates: Partial<PrizeConfig>) {
        setPrizeConfigs((rows) =>
            rows.map((row, i) => (i === index ? { ...row, ...updates } : row)),
        );
    }

    function removeRow(index: number) {
        setPrizeConfigs((rows) => rows.filter((_, i) => i !== index));
    }

    function addRow() {
        setPrizeConfigs((rows) => [...rows, { level: 2, duration: 30, quantity: 1 }]);
    }

    function handleSubmit() {
        if (!formValid || submitting) {
            return;
        }
        setSubmitting(true);

        const payload = {
            name: name.trim(),
            email: email.trim(),
            organization: organization.trim(),
            website: website.trim(),
            location: location.trim(),
            tournament_name: tournamentName.trim(),
            tournament_start_date: startDate,
            tournament_end_date: endDate,
            expected_players: expectedPlayers,
            previous_year_players: previousYearPlayers ? parseInt(previousYearPlayers) : null,
            custom_prize_code: customPrizeCode.trim().toUpperCase(),
            prizes: prizeRows.map((row) => ({
                level: row.level,
                duration: row.duration,
                quantity: row.quantity,
            })),
        };

        post("prizes/sponsorship-requests", payload)
            .then(() => {
                toast(
                    <div>
                        {llm_pgettext(
                            "",
                            "Your tournament prize request has been submitted! You will be notified when it is reviewed.",
                        )}
                    </div>,
                );
                void navigate("/");
            })
            .catch((err: unknown) => {
                console.error("Error submitting request:", err);
                toast(<div>{llm_pgettext("", "Failed to submit request. Please try again.")}</div>);
                setSubmitting(false);
            });
    }

    return (
        <div className="sponsorship-request">
            <h2>{llm_pgettext("", "Request Tournament Prizes")}</h2>

            <p className="form-description">
                {llm_pgettext(
                    "",
                    "OGS is happy to support in-person Go tournaments by providing supporter-level prizes. Fill out the form below with your tournament details and configure the prizes you'd like to offer. Once submitted, your request will be reviewed and you'll be notified when it's approved.",
                )}
            </p>

            <div className="form-section">
                <h3>{llm_pgettext("", "Organizer Information")}</h3>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Your Name")} *
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label>
                        {llm_pgettext("", "Email Address")} *
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Club or Organization")}
                        <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                        />
                    </label>
                    <label>
                        {llm_pgettext("", "Tournament Location")} *
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Website")}
                        <input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://"
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{llm_pgettext("", "Tournament Information")}</h3>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Tournament Name")} *
                        <input
                            type="text"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Start Date")} *
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>
                    <label>
                        {llm_pgettext("", "End Date")} *
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Expected Number of Players")} *
                        <input
                            type="number"
                            min={1}
                            value={expectedPlayers || ""}
                            onChange={(e) => setExpectedPlayers(parseInt(e.target.value) || 0)}
                        />
                    </label>
                    <label>
                        {llm_pgettext("", "Number of Players Last Year")}
                        <input
                            type="number"
                            min={0}
                            value={previousYearPlayers}
                            onChange={(e) => setPreviousYearPlayers(e.target.value)}
                            placeholder={llm_pgettext("", "If applicable")}
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{llm_pgettext("", "Custom Prize Code")}</h3>
                <p className="help-text">
                    {llm_pgettext(
                        "Hane is a japanese word for our supporter level, do not translate it",
                        "This code can be used by all attendees for a free month of Hane level access. If they are already a supporter, they can use it to upgrade their supporter level to the next tier for a month.",
                    )}
                </p>
                <div className="form-row">
                    <label>
                        {llm_pgettext("", "Prize Code")} *
                        <input
                            type="text"
                            value={customPrizeCode}
                            onChange={(e) => setCustomPrizeCode(e.target.value.toUpperCase())}
                            maxLength={20}
                            placeholder={"e.g. MACHAMP25"}
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{llm_pgettext("", "Prize Configuration")}</h3>
                <p className="help-text">
                    {llm_pgettext(
                        "Hane is a japanese word for our supporter level, do not translate it",
                        "Configure additional winner/placement prizes below. All attendees automatically receive a free month of Hane access via your custom prize code.",
                    )}
                </p>
                <p className={`help-text${overBudget ? " over-budget-text" : ""}`}>
                    {llm_pgettext("", "Winner prize budget")}: ${prizeCost.toFixed(2)} / $
                    {totalBudget.toFixed(2)}
                </p>

                <table className="prize-table">
                    <thead>
                        <tr>
                            <th>{llm_pgettext("", "Prize Level")}</th>
                            <th>{llm_pgettext("", "Duration")}</th>
                            <th>{llm_pgettext("", "Quantity")}</th>
                            <th>{llm_pgettext("", "Value")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prizeRows.map((row, index) => (
                            <tr key={index}>
                                <td>
                                    <select
                                        value={row.level}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                level: parseInt(e.target.value),
                                            })
                                        }
                                    >
                                        <option value={4}>
                                            {getLevelName(4)} ($
                                            {getMonthlyPrice(pricing, 4).toFixed(2)}/mo)
                                        </option>
                                        <option value={3}>
                                            {getLevelName(3)} ($
                                            {getMonthlyPrice(pricing, 3).toFixed(2)}/mo)
                                        </option>
                                        <option value={2}>
                                            {getLevelName(2)} ($
                                            {getMonthlyPrice(pricing, 2).toFixed(2)}/mo)
                                        </option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={row.duration}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                duration: parseInt(e.target.value),
                                            })
                                        }
                                    >
                                        {DURATION_OPTIONS.map((opt) => (
                                            <option key={opt.days} value={opt.days}>
                                                {getDurationLabel(opt.days)}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <div className="quantity-control">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateRow(index, {
                                                    quantity: Math.max(1, row.quantity - 1),
                                                })
                                            }
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            min={1}
                                            value={row.quantity}
                                            onChange={(e) =>
                                                updateRow(index, {
                                                    quantity: Math.max(
                                                        1,
                                                        parseInt(e.target.value) || 1,
                                                    ),
                                                })
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateRow(index, {
                                                    quantity: row.quantity + 1,
                                                })
                                            }
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>
                                <td className="cost-cell">
                                    ${calculateRowCost(pricing, row).toFixed(2)}
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeRow(index)}
                                    >
                                        x
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" className="add-row-btn" onClick={addRow}>
                    {llm_pgettext("", "Add Prize")}
                </button>

                <div className={`budget-summary ${overBudget ? "over-budget" : ""}`}>
                    <div className="budget-line">
                        <div>
                            <div>
                                {llm_pgettext(
                                    "Hane is a japanese word for our supporter level, do not translate it",
                                    "Attendee Hane codes",
                                )}
                                :
                            </div>
                            <div className="help-text">
                                {interpolate(
                                    llm_pgettext(
                                        "Do not translate the %s in the string, it is a placeholder for the expected player count",
                                        `(Note, %s extra uses will be provided in case the turnout is higher than expected)`,
                                    ),
                                    [Math.round(expectedPlayers / 2)],
                                )}
                                :
                            </div>
                        </div>
                        <span>
                            ${haneMonthlyPrice.toFixed(2)} x {expectedPlayers}{" "}
                            {llm_pgettext(
                                "player count, this will be part of $cost x num players",
                                "players",
                            )}{" "}
                            = ${attendeeHaneValue.toFixed(2)}
                        </span>
                    </div>
                    <div className="budget-line">
                        <span>{llm_pgettext("", "Winner prizes")}:</span>
                        <span>${prizeCost.toFixed(2)}</span>
                    </div>
                    <div className="budget-line budget-line-total">
                        <span>{llm_pgettext("", "Total sponsorship value")}:</span>
                        <span>${totalValue.toFixed(2)}</span>
                    </div>
                    {overBudget && (
                        <div className="over-budget-warning">
                            {llm_pgettext(
                                "",
                                "Winner prize value exceeds your budget. Please adjust your prizes.",
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="submit-btn"
                    disabled={!formValid || submitting}
                    onClick={handleSubmit}
                >
                    {submitting
                        ? llm_pgettext("", "Submitting...")
                        : llm_pgettext("", "Request Prizes")}
                </button>
            </div>
        </div>
    );
}
