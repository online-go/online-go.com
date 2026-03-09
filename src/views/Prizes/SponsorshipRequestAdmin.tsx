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
import { useParams, useNavigate, Link } from "react-router-dom";
import { get, post, put } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { Player } from "@/components/Player";
import { _, pgettext } from "@/lib/translate";
import { toast } from "@/lib/toast";
import "./SponsorshipRequestAdmin.css";

interface PrizeConfig {
    level: number;
    duration: number;
    quantity: number;
}

interface SponsorshipRequestData {
    id: string;
    requester: number;
    name: string;
    email: string;
    organization: string;
    location: string;
    tournament_name: string;
    tournament_start_date: string;
    tournament_end_date: string;
    expected_players: number;
    previous_year_players: number | null;
    custom_prize_code: string;
    prizes: PrizeConfig[];
    status: string;
    created_at: string;
    approved_at: string | null;
    approved_by: number | null;
    batch: string | null;
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
            return "Level " + level;
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

function calculateRowCost(pricing: SupporterPricing, row: PrizeConfig): number {
    return getMonthlyPrice(pricing, row.level) * getDurationMonths(row.duration) * row.quantity;
}

export function SponsorshipRequestDetail(): React.ReactElement {
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useUser();
    const [request, setRequest] = useState<SponsorshipRequestData | null>(null);
    const [pricing, setPricing] = useState<SupporterPricing | null>(null);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<SponsorshipRequestData>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!user.is_superuser) {
            void navigate("/");
            return;
        }
        get(`prizes/sponsorship-requests/${params.id}`)
            .then((data: SponsorshipRequestData) => setRequest(data))
            .catch((err: unknown) => console.error("Error fetching request:", err));
        get("prizes/pricing")
            .then((data: SupporterPricing) => setPricing(data))
            .catch((err: unknown) => console.error("Error fetching pricing:", err));
    }, [params.id]);

    if (!request || !pricing) {
        return <div className="sponsorship-request-admin">{_("Loading...")}</div>;
    }

    const budgetPerPlayer = pricing.hane.monthly_price_usd / 100 / 2;
    const totalBudget = Math.max(100, budgetPerPlayer * request.expected_players);
    const totalCost = request.prizes.reduce((sum, row) => sum + calculateRowCost(pricing, row), 0);

    function handleApprove() {
        setProcessing(true);
        post(`prizes/sponsorship-requests/${params.id}`, { action: "approve" })
            .then((res: { batch_id: string; request: SponsorshipRequestData }) => {
                setRequest(res.request);
                toast(<div>{_("Request approved! Prize batch created.")}</div>);
                void navigate(`/prize-batches/${res.batch_id}`);
            })
            .catch((err: unknown) => {
                console.error("Error approving request:", err);
                setProcessing(false);
            });
    }

    function handleReject() {
        setProcessing(true);
        post(`prizes/sponsorship-requests/${params.id}`, { action: "reject" })
            .then((res: { request: SponsorshipRequestData }) => {
                setRequest(res.request);
                toast(<div>{_("Request rejected.")}</div>);
                setProcessing(false);
            })
            .catch((err: unknown) => {
                console.error("Error rejecting request:", err);
                setProcessing(false);
            });
    }

    function handleSaveEdit() {
        setProcessing(true);
        put(`prizes/sponsorship-requests/${params.id}`, editData)
            .then((data: SponsorshipRequestData) => {
                setRequest(data);
                setEditing(false);
                setProcessing(false);
                toast(<div>{_("Request updated.")}</div>);
            })
            .catch((err: unknown) => {
                console.error("Error updating request:", err);
                setProcessing(false);
            });
    }

    function startEdit() {
        setEditData({ ...request });
        setEditing(true);
    }

    return (
        <div className="sponsorship-request-admin">
            <h2>
                {_("Tournament Prize Request")}: {request.tournament_name}
            </h2>

            <div className="status-badge" data-status={request.status}>
                {request.status.toUpperCase()}
            </div>

            <div className="detail-section">
                <h3>{_("Organizer Information")}</h3>
                <div className="detail-grid">
                    <div>
                        <strong>{_("Name")}:</strong> {request.name}
                    </div>
                    <div>
                        <strong>{_("Email")}:</strong> {request.email}
                    </div>
                    <div>
                        <strong>{_("Organization")}:</strong> {request.organization || "-"}
                    </div>
                    <div>
                        <strong>{_("Location")}:</strong> {request.location}
                    </div>
                    <div>
                        <strong>{_("Requester")}:</strong> <Player user={request.requester} />
                    </div>
                    <div>
                        <strong>{_("Submitted")}:</strong>{" "}
                        {new Date(request.created_at).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="detail-section">
                <h3>{_("Tournament Information")}</h3>
                <div className="detail-grid">
                    <div>
                        <strong>{_("Tournament")}:</strong> {request.tournament_name}
                    </div>
                    <div>
                        <strong>{_("Dates")}:</strong> {request.tournament_start_date} to{" "}
                        {request.tournament_end_date}
                    </div>
                    <div>
                        <strong>{_("Expected Players")}:</strong> {request.expected_players}
                    </div>
                    <div>
                        <strong>{_("Previous Year Players")}:</strong>{" "}
                        {request.previous_year_players ?? "-"}
                    </div>
                    <div>
                        <strong>{_("Custom Prize Code")}:</strong> {request.custom_prize_code}
                    </div>
                </div>
            </div>

            <div className="detail-section">
                <h3>{_("Prize Configuration")}</h3>
                <table className="prize-table">
                    <thead>
                        <tr>
                            <th>{_("Prize Level")}</th>
                            <th>{_("Duration")}</th>
                            <th>{_("Quantity")}</th>
                            <th>{_("Value")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {request.prizes.map((prize, index) => (
                            <tr key={index}>
                                <td>{getLevelName(prize.level)}</td>
                                <td>
                                    {DURATION_OPTIONS.find((o) => o.days === prize.duration)
                                        ?.label ?? prize.duration + " days"}
                                </td>
                                <td>{prize.quantity}</td>
                                <td>${calculateRowCost(pricing, prize).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="budget-summary">
                    <div>
                        <strong>{_("Total Value")}:</strong> ${totalCost.toFixed(2)}
                    </div>
                    <div>
                        <strong>{_("Budget")}:</strong> ${totalBudget.toFixed(2)}
                    </div>
                </div>
            </div>

            {request.batch && (
                <div className="detail-section">
                    <Link to={`/prize-batches/${request.batch}`}>{_("View Prize Batch")}</Link>
                </div>
            )}

            {request.status === "pending" && (
                <div className="action-buttons">
                    <button className="approve-btn" onClick={handleApprove} disabled={processing}>
                        {_("Approve")}
                    </button>
                    <button className="reject-btn" onClick={handleReject} disabled={processing}>
                        {_("Reject")}
                    </button>
                    <button className="edit-btn" onClick={startEdit} disabled={processing}>
                        {_("Edit")}
                    </button>
                </div>
            )}

            {editing && (
                <EditModal
                    request={request}
                    editData={editData}
                    setEditData={setEditData}
                    onSave={handleSaveEdit}
                    onCancel={() => setEditing(false)}
                    processing={processing}
                    pricing={pricing}
                />
            )}
        </div>
    );
}

function EditModal({
    request,
    editData,
    setEditData,
    onSave,
    onCancel,
    processing,
    pricing,
}: {
    request: SponsorshipRequestData;
    editData: Partial<SponsorshipRequestData>;
    setEditData: (data: Partial<SponsorshipRequestData>) => void;
    onSave: () => void;
    onCancel: () => void;
    processing: boolean;
    pricing: SupporterPricing;
}): React.ReactElement {
    function updatePrize(index: number, updates: Partial<PrizeConfig>) {
        const prizes = [...(editData.prizes || request.prizes)];
        prizes[index] = { ...prizes[index], ...updates };
        setEditData({ ...editData, prizes });
    }

    function removePrize(index: number) {
        const prizes = [...(editData.prizes || request.prizes)];
        prizes.splice(index, 1);
        setEditData({ ...editData, prizes });
    }

    function addPrize() {
        const prizes = [...(editData.prizes || request.prizes)];
        prizes.push({ level: 2, duration: 30, quantity: 1 });
        setEditData({ ...editData, prizes });
    }

    const prizes = editData.prizes || request.prizes;

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal">
                <h3>{_("Edit Request")}</h3>

                <label>
                    {_("Expected Players")}
                    <input
                        type="number"
                        value={editData.expected_players ?? request.expected_players}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                expected_players: parseInt(e.target.value) || 0,
                            })
                        }
                    />
                </label>

                <label>
                    {_("Custom Prize Code")}
                    <input
                        type="text"
                        value={editData.custom_prize_code ?? request.custom_prize_code}
                        onChange={(e) =>
                            setEditData({
                                ...editData,
                                custom_prize_code: e.target.value.toUpperCase(),
                            })
                        }
                    />
                </label>

                <h4>{_("Prizes")}</h4>
                <table className="prize-table">
                    <thead>
                        <tr>
                            <th>{_("Level")}</th>
                            <th>{_("Duration")}</th>
                            <th>{_("Qty")}</th>
                            <th>{_("Value")}</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prizes.map((prize, index) => (
                            <tr key={index}>
                                <td>
                                    <select
                                        value={prize.level}
                                        onChange={(e) =>
                                            updatePrize(index, {
                                                level: parseInt(e.target.value),
                                            })
                                        }
                                    >
                                        <option value={4}>{getLevelName(4)}</option>
                                        <option value={3}>{getLevelName(3)}</option>
                                        <option value={2}>{getLevelName(2)}</option>
                                    </select>
                                </td>
                                <td>
                                    <select
                                        value={prize.duration}
                                        onChange={(e) =>
                                            updatePrize(index, {
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
                                    <input
                                        type="number"
                                        min={1}
                                        value={prize.quantity}
                                        onChange={(e) =>
                                            updatePrize(index, {
                                                quantity: Math.max(
                                                    1,
                                                    parseInt(e.target.value) || 1,
                                                ),
                                            })
                                        }
                                    />
                                </td>
                                <td>${calculateRowCost(pricing, prize).toFixed(2)}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removePrize(index)}
                                    >
                                        x
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={addPrize}>
                    {_("Add Prize")}
                </button>

                <div className="modal-actions">
                    <button onClick={onSave} disabled={processing}>
                        {_("Save")}
                    </button>
                    <button onClick={onCancel}>{_("Cancel")}</button>
                </div>
            </div>
        </div>
    );
}
