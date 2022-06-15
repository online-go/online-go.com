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

import React from "react";
import ReactResizeDetector from "react-resize-detector";

/**
 * Some OGS users have browsers (mostly Safari <12) that don't support
 * ResizeObserver.  This class is a wrapper that just does no resize handling
 * on these older browsers.
 */
export function OgsResizeDetector(props: ReactResizeDetector["props"]): JSX.Element {
    return window.ResizeObserver ? <ReactResizeDetector {...props} /> : <React.Fragment />;
}
