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
import { useNavigate, useLocation } from "react-router-dom";

let globalNavigate: ((to: string, options?: { replace?: boolean }) => void) | null = null;
let globalLocation: any = null;
const listeners: Array<(location: any) => void> = [];

const initializeNavigation = (navigate: any, location: any) => {
    globalNavigate = navigate;
    globalLocation = location;
};

const notifyLocationChange = (location: any) => {
    globalLocation = location;
    listeners.forEach((listener) => listener(location));
};

/* This should only be called by our AppLayout component */
export const useOGSNavigationInitializer = () => {
    const navigate = useNavigate();
    const location = useLocation();

    React.useEffect(() => {
        initializeNavigation(navigate, location);
    }, [navigate, location]);

    React.useEffect(() => {
        notifyLocationChange(location);
    }, [location]);

    return { navigate, location };
};

/* Compatibility layer for old browserHistory usage */
export const browserHistory = {
    push: (path: string) => {
        if (globalNavigate) {
            globalNavigate(path);
        } else {
            console.warn("Navigation not initialized yet");
        }
    },

    back: () => {
        if (window.history && window.history.back) {
            window.history.back();
        }
    },

    listen: (callback: (obj: { location: any }) => void) => {
        const wrappedCallback = (location: any) => {
            // Provide the expected object structure
            callback({ location });
        };
        listeners.push(wrappedCallback);
        return () => {
            const index = listeners.indexOf(wrappedCallback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    },

    get location() {
        return globalLocation || window.location;
    },
};

window.browserHistory = browserHistory;
