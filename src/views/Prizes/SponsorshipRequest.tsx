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
import { _, pgettext } from "@/lib/translate";
import { toast } from "@/lib/toast";
import "./SponsorshipRequest.css";

interface PrizeRow {
    level: number; // 2=Hane, 3=Tenuki, 4=Meijin
    duration: number; // days
    quantity: number;
}

interface SupporterPricing {
    hane: { monthly_price_usd: number };
    tenuki: { monthly_price_usd: number };
    meijin: { monthly_price_usd: number };
}

const DURATION_OPTIONS = [
    { days: 30, months: 1, label: "30 days" },
    { days: 60, months: 2, label: "60 days" },
    { days: 90, months: 3, label: "90 days" },
    { days: 120, months: 4, label: "120 days" },
    { days: 180, months: 6, label: "180 days" },
    { days: 365, months: 12, label: "365 days" },
];

function getLevelName(level: number): string {
    switch (level) {
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

function getMonthlyPrice(pricing: SupporterPricing, level: number): number {
    switch (level) {
        case 2:
            return pricing.hane.monthly_price_usd / 100;
        case 3:
            return pricing.tenuki.monthly_price_usd / 100;
        case 4:
            return pricing.meijin.monthly_price_usd / 100;
        default:
            return 0;
    }
}

function getDurationMonths(days: number): number {
    const option = DURATION_OPTIONS.find((o) => o.days === days);
    return option ? option.months : days / 30;
}

function calculateRowCost(pricing: SupporterPricing, row: PrizeRow): number {
    return getMonthlyPrice(pricing, row.level) * getDurationMonths(row.duration) * row.quantity;
}

export function SponsorshipRequest(): React.ReactElement {
    const navigate = useNavigate();

    const [pricing, setPricing] = useState<SupporterPricing | null>(null);

    const dev = process.env.NODE_ENV === "development";

    // Form fields
    const [name, setName] = useState(dev ? "Test Organizer" : "");
    const [email, setEmail] = useState(dev ? "test@example.com" : "");
    const [organization, setOrganization] = useState(dev ? "Test Go Club" : "");
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
    const [prizeRows, setPrizeRows] = useState<PrizeRow[]>([
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
        return <div className="sponsorship-request">{_("Loading...")}</div>;
    }

    const budgetPerPlayer = pricing.hane.monthly_price_usd / 100 / 2;
    const totalBudget = Math.max(100, budgetPerPlayer * expectedPlayers);
    const totalCost = prizeRows.reduce((sum, row) => sum + calculateRowCost(pricing, row), 0);
    const overBudget = totalCost > totalBudget;

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

    function updateRow(index: number, updates: Partial<PrizeRow>) {
        setPrizeRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...updates } : row)));
    }

    function removeRow(index: number) {
        setPrizeRows((rows) => rows.filter((_, i) => i !== index));
    }

    function addRow() {
        setPrizeRows((rows) => [...rows, { level: 2, duration: 30, quantity: 1 }]);
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
                        {_(
                            "Your tournament prize request has been submitted! You will be notified when it is reviewed.",
                        )}
                    </div>,
                );
                void navigate("/");
            })
            .catch((err: unknown) => {
                console.error("Error submitting request:", err);
                setSubmitting(false);
            });
    }

    return (
        <div className="sponsorship-request">
            <h2>{_("Request Tournament Prizes")}</h2>

            <p className="form-description">
                {_(
                    "OGS is happy to support in-person Go tournaments by providing supporter-level prizes. Fill out the form below with your tournament details and configure the prizes you'd like to offer. Once submitted, your request will be reviewed and you'll be notified when it's approved.",
                )}
            </p>

            <div className="form-section">
                <h3>{_("Organizer Information")}</h3>
                <div className="form-row">
                    <label>
                        {_("Your Name")} *
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>
                    <label>
                        {_("Email Address")} *
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {_("Club or Organization")}
                        <input
                            type="text"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                        />
                    </label>
                    <label>
                        {_("Tournament Location")} *
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{_("Tournament Information")}</h3>
                <div className="form-row">
                    <label>
                        {_("Tournament Name")} *
                        <input
                            type="text"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {_("Start Date")} *
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </label>
                    <label>
                        {_("End Date")} *
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </label>
                </div>
                <div className="form-row">
                    <label>
                        {_("Expected Number of Players")} *
                        <input
                            type="number"
                            min={1}
                            value={expectedPlayers || ""}
                            onChange={(e) => setExpectedPlayers(parseInt(e.target.value) || 0)}
                        />
                    </label>
                    <label>
                        {_("Number of Players Last Year")}
                        <input
                            type="number"
                            min={0}
                            value={previousYearPlayers}
                            onChange={(e) => setPreviousYearPlayers(e.target.value)}
                            placeholder={_("If applicable")}
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{_("Custom Prize Code")}</h3>
                <p className="help-text">
                    {_(
                        "This code will be given to all attendees. Choose something unique and memorable related to your tournament.",
                    )}
                </p>
                <div className="form-row">
                    <label>
                        {_("Prize Code")} *
                        <input
                            type="text"
                            value={customPrizeCode}
                            onChange={(e) => setCustomPrizeCode(e.target.value.toUpperCase())}
                            maxLength={20}
                            placeholder={_("e.g. MACHAMP25")}
                        />
                    </label>
                </div>
            </div>

            <div className="form-section">
                <h3>{_("Prize Configuration")}</h3>
                <p className="help-text">
                    {_("Budget per player")}: ${budgetPerPlayer.toFixed(2)} | {_("Total budget")}: $
                    {totalBudget.toFixed(2)} ({expectedPlayers} {_("players")})
                </p>

                <table className="prize-table">
                    <thead>
                        <tr>
                            <th>{_("Prize Level")}</th>
                            <th>{_("Duration")}</th>
                            <th>{_("Quantity")}</th>
                            <th>{_("Value")}</th>
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
                                                {opt.label}
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
                    {_("Add Prize")}
                </button>

                <div className={`budget-summary ${overBudget ? "over-budget" : ""}`}>
                    <div>
                        <strong>{_("Total Value")}:</strong> ${totalCost.toFixed(2)}
                    </div>
                    <div>
                        <strong>{_("Budget")}:</strong> ${totalBudget.toFixed(2)}
                    </div>
                    {overBudget && (
                        <div className="over-budget-warning">
                            {_("Total value exceeds your budget. Please adjust your prizes.")}
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
                    {submitting ? _("Submitting...") : _("Request Prizes")}
                </button>
            </div>
        </div>
    );
}
