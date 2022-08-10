/*
 * Copyright (C) 2012-2022  Online-Go.com
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

export function InfoBall({ children, className }: InfoBallProps): JSX.Element {
    const [show, setShow] = React.useState(false);

    if (!className) {
        className = "fa fa-info-circle";
    }
    return (
        <span
            className={"InfoBall" + (show ? " force-show-details" : "")}
            onClick={() => {
                setShow(!show);
            }}
        >
            <i className={className} />
            <div className="details">{children}</div>
            {show ? <div className="backdrop" onClick={() => setShow(false)} /> : null}
        </span>
    );
}
