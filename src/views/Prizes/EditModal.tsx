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

import React from "react";
import { _ } from "@/lib/translate";
import {
    calculateRowCost,
    DURATION_OPTIONS,
    getDurationLabel,
    getLevelName,
    PrizeConfig,
    SponsorshipRequestData,
    SupporterPricing,
} from "./SponsorshipRequestTypes";
import "./EditModal.css";

interface EditModalProps {
    request: SponsorshipRequestData;
    editData: Partial<SponsorshipRequestData>;
    setEditData: (data: Partial<SponsorshipRequestData>) => void;
    onSave: () => void;
    onCancel: () => void;
    processing: boolean;
    pricing: SupporterPricing;
}

export function EditModal({
    request,
    editData,
    setEditData,
    onSave,
    onCancel,
    processing,
    pricing,
}: EditModalProps): React.ReactElement {
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
                                                {getDurationLabel(opt.days)}
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
