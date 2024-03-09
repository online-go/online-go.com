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
import { Link } from "react-router-dom";

interface PrizeBatch {
    id: string;
    created_at: string;
    created_by: { username: string };
    notes: string;
}

export const PrizeBatchList: React.FC = () => {
    const [prizeBatches, setPrizeBatches] = useState<PrizeBatch[]>([]);

    useEffect(() => {
        fetch("prizes/batches")
            .then((response) => response.json())
            .then((data: PrizeBatch[]) => setPrizeBatches(data))
            .catch((error) => console.error("Error fetching prize batches:", error));
    }, []);

    return (
        <div>
            <h2>Prize Batches</h2>
            <ul>
                {prizeBatches.map((batch) => (
                    <li key={batch.id}>
                        <strong>Date Created:</strong> {new Date(batch.created_at).toLocaleString()}{" "}
                        <br />
                        <strong>Created by:</strong> {batch.created_by.username} <br />
                        <strong>Notes:</strong> {batch.notes} <br />
                        <Link to={`/prize-batches/${batch.id}`}>View Batch</Link>
                    </li>
                ))}
            </ul>
            <Link to="/prize-batches/create">Create New Batch</Link>
        </div>
    );
};
