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
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { Player } from "@/components/Player";
import "./PrizeBatchList.css";

interface PrizeBatch {
    id: string;
    created_at: string;
    expiration_date: string;
    created_by: number;
    notes: string;
}

interface TournamentRequest {
    id: string;
    requester: number;
    name: string;
    tournament_name: string;
    status: string;
    created_at: string;
    expected_players: number;
}

export function PrizeBatchList(): React.ReactElement {
    const [prizeBatches, setPrizeBatches] = useState<PrizeBatch[]>([]);
    const [tournamentRequests, setTournamentRequests] = useState<TournamentRequest[]>([]);
    const [showNewBatchForm, setShowNewBatchForm] = useState<boolean>(false);
    const [expirationDate, setExpirationDate] = useState<string>(calculateExpirationDate());
    const [notes, setNotes] = useState<string>("");
    const navigate = useNavigate();
    const user = useUser();

    useEffect(() => {
        if (!user.is_superuser) {
            void navigate("/");
        }
        get("prizes/batches")
            .then((data: PrizeBatch[]) => setPrizeBatches(data))
            .catch((error) => console.error("Error fetching prize batches:", error));
        get("prizes/sponsorship-requests")
            .then((data: TournamentRequest[]) => setTournamentRequests(data))
            .catch((error) => console.error("Error fetching tournament requests:", error));
    }, []);

    const handleExpirationDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setExpirationDate(event.target.value);
    };

    const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNotes(event.target.value);
    };

    const handleCreateBatch = () => {
        post("prizes/batches", {
            expiration: expirationDate,
            notes: notes,
        })
            .then((res) => {
                const url = "/prize-batches/" + res.id;
                void navigate(url);
            })
            .catch((error: any) => console.error("Error creating prize batch:", error));
    };

    function calculateExpirationDate(): string {
        const currentDate = new Date();
        const oneYearLater = new Date(
            currentDate.getFullYear() + 1,
            currentDate.getMonth(),
            currentDate.getDate(),
        );
        return oneYearLater.toISOString().split("T")[0];
    }

    const toggleNewBatchForm = () => {
        setShowNewBatchForm(!showNewBatchForm);
    };

    const pendingRequests = tournamentRequests.filter((r) => r.status === "pending");
    const otherRequests = tournamentRequests.filter((r) => r.status !== "pending");

    return (
        <div className="prize-batch-list">
            {pendingRequests.length > 0 && (
                <div className="sponsorship-requests-section">
                    <h2>Pending Tournament Prize Requests</h2>
                    <ul className="batch-list">
                        {pendingRequests.map((req) => (
                            <li key={req.id} className="batch-item request-pending">
                                <div className="batch-details">
                                    <strong>{req.tournament_name}</strong>
                                    <br />
                                    <span>
                                        Organizer: {req.name} | Players: {req.expected_players} |{" "}
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <Link
                                    to={`/sponsorship-requests/${req.id}`}
                                    className="view-batch-link"
                                >
                                    Review
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {otherRequests.length > 0 && (
                <div className="sponsorship-requests-section">
                    <h2>Past Tournament Prize Requests</h2>
                    <ul className="batch-list">
                        {otherRequests.map((req) => (
                            <li key={req.id} className="batch-item">
                                <div className="batch-details">
                                    <strong>{req.tournament_name}</strong> [{req.status}]
                                    <br />
                                    <span>
                                        Organizer: {req.name} |{" "}
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <Link
                                    to={`/sponsorship-requests/${req.id}`}
                                    className="view-batch-link"
                                >
                                    View
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="header">
                <h2>Prize Batches</h2>
                <button className="new-batch-btn" onClick={toggleNewBatchForm}>
                    Create New Batch
                </button>
            </div>
            <ul className="batch-list">
                {prizeBatches.map((batch) => (
                    <li key={batch.id} className="batch-item">
                        <div className="batch-details">
                            <strong>Date Created:</strong>{" "}
                            {new Date(batch.created_at).toLocaleString()} <br />
                            <strong>Created by:</strong> <Player user={batch.created_by} /> <br />
                            <strong>Notes:</strong> {batch.notes}
                        </div>
                        <Link to={`/prize-batches/${batch.id}`} className="view-batch-link">
                            View Batch
                        </Link>
                    </li>
                ))}
            </ul>
            {showNewBatchForm && (
                <div className="popup">
                    <div className="popup-content">
                        <NewBatchForm
                            expirationDate={expirationDate}
                            notes={notes}
                            handleExpirationDateChange={handleExpirationDateChange}
                            handleNotesChange={handleNotesChange}
                            handleCreateBatch={handleCreateBatch}
                            onClose={toggleNewBatchForm}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

const NewBatchForm: React.FC<{
    expirationDate: string;
    notes: string;
    handleExpirationDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleNotesChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handleCreateBatch: () => void;
    onClose: () => void;
}> = ({
    expirationDate,
    notes,
    handleExpirationDateChange,
    handleNotesChange,
    handleCreateBatch,
    onClose,
}) => {
    return (
        <div className="new-batch-form">
            <h3>Create New Batch</h3>
            <form>
                <label>
                    Expiration Date:
                    <input
                        type="date"
                        value={expirationDate}
                        onChange={handleExpirationDateChange}
                    />
                </label>
                <br />
                <label>
                    Notes:
                    <br />
                    <textarea value={notes} onChange={handleNotesChange} rows={4} cols={50} />
                </label>
                <br />
                <div className="form-buttons">
                    <button type="button" onClick={handleCreateBatch}>
                        Create Batch
                    </button>
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};
