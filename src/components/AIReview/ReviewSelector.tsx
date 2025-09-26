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

import * as React from "react";
import moment from "moment";
import Select, { components } from "react-select";
import { JGOFAIReview } from "goban";
import { _, pgettext, interpolate } from "@/lib/translate";
import { ReviewStrengthIcon } from "./ReviewStrengthIcon";
import { engineName, extractShortNetworkVersion } from "./utils";

interface ReviewSelectorProps {
    reviews: Array<JGOFAIReview>;
    selectedReview?: JGOFAIReview;
    onReviewSelect: (review: JGOFAIReview) => void;
    onStartNewReview?: (type: "full" | "fast", engine: "leela_zero" | "katago") => void;
    showNewReviewButton?: boolean;
    winRate: number;
    score: number;
    useScore: boolean;
    hasScores: boolean;
    isProcessing?: boolean;
}

export function ReviewSelector({
    reviews,
    selectedReview,
    onReviewSelect,
    onStartNewReview,
    showNewReviewButton,
    winRate,
    score,
    useScore,
    hasScores,
    isProcessing: _isProcessing, // Currently unused
}: ReviewSelectorProps): React.ReactElement | null {
    if (reviews.length === 0) {
        return null;
    }

    const win_rate_p = winRate * 100.0;

    return (
        <Select
            classNamePrefix="ogs-react-select"
            value={selectedReview}
            options={reviews}
            onChange={(value) => value && onReviewSelect(value)}
            isClearable={false}
            blurInputOnSelect={true}
            isSearchable={false}
            components={{
                Option: ({ innerRef, innerProps, isFocused, data, getValue }) => {
                    const value = getValue();
                    const isSelected = value && value[0].id === data.id;

                    return (
                        <div
                            ref={innerRef}
                            {...innerProps}
                            className={
                                "ai-review-option-container " +
                                (isFocused ? "focused " : "") +
                                (isSelected ? "selected" : "")
                            }
                        >
                            <ReviewStrengthIcon review={data} />
                            <div className="ai-review-information">
                                <div>
                                    {interpolate(
                                        pgettext(
                                            "AI Review technical information",
                                            "{{engine}} {{engine_version}} using the {{network_size}} network {{network}}.",
                                        ),
                                        {
                                            engine: engineName(data.engine),
                                            engine_version: data.engine_version,
                                            network_size: data.network_size,
                                            network: extractShortNetworkVersion(data.network),
                                        },
                                    )}
                                </div>
                                <div className="ai-review-strength-info">
                                    {data.playouts && data.visits && (
                                        <span>
                                            {interpolate(
                                                pgettext(
                                                    "AI Review strength information",
                                                    "{{playouts}} playouts, {{visits}} visits",
                                                ),
                                                {
                                                    playouts: data.playouts.toLocaleString(),
                                                    visits: data.visits.toLocaleString(),
                                                },
                                            )}
                                        </span>
                                    )}
                                </div>
                                <div className="date">
                                    {moment(new Date(data.date)).format("lll")}
                                </div>
                            </div>
                        </div>
                    );
                },
                SingleValue: ({ data }) => (
                    <React.Fragment>
                        <ReviewStrengthIcon review={data} />
                        {winRate >= 0 && winRate <= 1.0 ? (
                            useScore && hasScores ? (
                                <div className="progress">
                                    {score > 0 ? (
                                        <div
                                            className="progress-bar black-background"
                                            style={{ width: "100%" }}
                                        >
                                            {interpolate(
                                                pgettext(
                                                    "AI Review: Black ahead by {score}",
                                                    "B+{{score}}",
                                                ),
                                                { score: score.toFixed(1) },
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="progress-bar white-background"
                                            style={{ width: "100%" }}
                                        >
                                            {interpolate(
                                                pgettext(
                                                    "AI Review: White ahead by {score}",
                                                    "W+{{score}}",
                                                ),
                                                { score: (-score).toFixed(1) },
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="progress">
                                    <div
                                        className="progress-bar black-background"
                                        style={{ width: win_rate_p + "%" }}
                                    >
                                        {win_rate_p.toFixed(1)}%
                                    </div>
                                    <div
                                        className="progress-bar white-background"
                                        style={{ width: 100.0 - win_rate_p + "%" }}
                                    >
                                        {(100 - win_rate_p).toFixed(1)}%
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="pending">
                                <i className="fa fa-desktop slowstrobe"></i>
                                {_("Processing")}
                            </div>
                        )}
                    </React.Fragment>
                ),
                ValueContainer: ({ children }) => (
                    <div className="ai-review-win-rate-container">{children}</div>
                ),
                MenuList: (props) => {
                    const MenuList = components.MenuList as any;

                    return (
                        <MenuList {...props}>
                            {props.children}
                            {showNewReviewButton && onStartNewReview && (
                                <div className="ai-review-new-review">
                                    <button
                                        onClick={() => {
                                            onStartNewReview("full", "katago");
                                            props.selectProps.onMenuClose?.();
                                        }}
                                    >
                                        <i className="fa fa-plus" /> {_("New Full Review")}
                                    </button>
                                </div>
                            )}
                        </MenuList>
                    );
                },
            }}
        />
    );
}
