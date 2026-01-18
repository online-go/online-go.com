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
import { _ } from "@/lib/translate";

interface FullReviewButtonProps {
    onStartFullReview: () => void;
    showBecomeSupporterText?: boolean;
}

export function FullReviewButton({
    onStartFullReview,
    showBecomeSupporterText,
}: FullReviewButtonProps): React.ReactElement {
    return (
        <div className="full-review-button-container">
            <button className="primary" onClick={onStartFullReview}>
                {_("Full AI Review")}
            </button>
            {showBecomeSupporterText && (
                <div className="fakelink become-a-site-supporter-line" onClick={onStartFullReview}>
                    {_("Become a site supporter today for in-depth interactive AI reviews")}
                </div>
            )}
        </div>
    );
}
