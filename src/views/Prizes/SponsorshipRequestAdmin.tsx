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
import { _ } from "@/lib/translate";
import { toast } from "@/lib/toast";
import {
    calculateRowCost,
    DURATION_OPTIONS,
    getLevelName,
    SponsorshipRequestData,
    SupporterPricing,
} from "./SponsorshipRequestTypes";
import { EditModal } from "./EditModal";
import "./SponsorshipRequestAdmin.css";

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
