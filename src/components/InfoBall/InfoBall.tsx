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

/* From https://loading.io/css/ */

import * as React from "react";

interface InfoBallProps {
    children: React.ReactNode;
    className?: string;
}

export function InfoBall({ children, className }: InfoBallProps): React.ReactElement {
    /* The force hide system is to prevent the info box being held open on a
     * mobile device when the details popup is clicked. The expected behavior
     * is to close, and while show does set to close, because the users input
     * focus is now over the details box, the :hover takes over and keeps it
     * open. */
    const [show, setShow] = React.useState(false);
    const [forceHide, setForceHide] = React.useState(false);

    if (!className) {
        className = "fa fa-info-circle";
    }
    return (
        <span
            className={
                "InfoBall" +
                (show ? " force-show-details" : "") +
                (forceHide ? " force-hide-details" : "")
            }
            onClick={() => {
                setShow(!show);
            }}
        >
            <i
                className={className}
                onMouseEnter={() => {
                    setForceHide(false);
                }}
            />
            <div
                className="details"
                onClick={(event) => {
                    setShow(false);
                    setForceHide(true);
                    event.stopPropagation();
                    return false;
                }}
            >
                {children}
            </div>
            {show ? (
                <div
                    className="backdrop"
                    onClick={(event) => {
                        setShow(false);
                        event.stopPropagation();
                    }}
                />
            ) : null}
        </span>
    );
}
