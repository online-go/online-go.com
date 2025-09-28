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
import { JGOFAIReview } from "goban";

export function ReviewStrengthIcon({
    review,
}: {
    review: (JGOFAIReview | rest_api.AIReviewParams) & { cheat_detection?: boolean };
}): React.ReactElement {
    let strength: string;
    let content = "";

    if (review.type === "fast") {
        strength = "ai-review-fast";
        content = "";
    } else if (review.cheat_detection) {
        strength = "ai-cheat-detection-review";
        if (review.strength > 2000) {
            strength += " ai-cheat-detection-review-plus";
            content = "DD";
        } else if (review.strength >= 500) {
            strength += " ai-cheat-detection-review-plus";
            content = "D+";
        } else {
            content = "D";
        }
    } else {
        // Full review strength calculation
        if (review.network_size === "20x256") {
            if (review.strength >= 10000) {
                strength = "ai-review-strength-4";
                content = "IV";
            } else if (review.strength >= 1600) {
                strength = "ai-review-strength-3";
                content = "III";
            } else if (review.strength >= 800) {
                strength = "ai-review-strength-2";
                content = "II";
            } else if (review.strength >= 300) {
                strength = "ai-review-strength-1";
                content = "I";
            } else {
                strength = "ai-review-strength-0";
                content = "";
            }
        } else {
            if (review.strength >= 6000) {
                strength = "ai-review-strength-4";
                content = "IV";
            } else if (review.strength >= 1500) {
                strength = "ai-review-strength-3";
                content = "III";
            } else if (review.strength >= 500) {
                strength = "ai-review-strength-2";
                content = "II";
            } else if (review.strength >= 200) {
                strength = "ai-review-strength-1";
                content = "I";
            } else {
                strength = "ai-review-strength-0";
                content = "";
            }
        }
    }

    return <span className={"ai-review-strength-icon " + strength}>{content}</span>;
}
