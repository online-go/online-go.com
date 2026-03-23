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
import * as preferences from "@/lib/preferences";
import { ValidPreference } from "@/lib/preferences";
import { useUser } from "@/lib/hooks";
import "./HomeDebug.css";

const FORCE_SHOW_STORAGE_KEY = "home-debug-force-show";

export const COMPONENT_NAMES = [
    "SupporterProblems",
    "PriceIncreaseMessage",
    "FreeTrialBanner",
    "FreeTrialSurvey",
    "DismissableMessages",
    "EmailBanner",
    "PaymentProblemBanner",
    "ActiveAnnouncements",
    "ModerationOffer",
    "ChallengesList",
    "InviteList",
    "ActiveDroppedGameList",
    "ProfileCard",
    "WhatsNewBanner",
    "TournamentList",
    "LadderList",
    "GroupList",
    "HomeFriendList",
    "PlayButtons",
    "GameCount",
] as const;

export type HomeComponentName = (typeof COMPONENT_NAMES)[number];

function prefKey(name: string): ValidPreference {
    return `home-show-${name}` as ValidPreference;
}

function loadForceShow(): Set<string> {
    try {
        const stored = localStorage.getItem(FORCE_SHOW_STORAGE_KEY);
        if (stored) {
            return new Set(JSON.parse(stored) as string[]);
        }
    } catch (e) {
        console.error(e);
    }
    return new Set();
}

function saveForceShow(forceSet: Set<string>): void {
    localStorage.setItem(FORCE_SHOW_STORAGE_KEY, JSON.stringify([...forceSet]));
}

interface HomeDebugProps {
    forceShowSet: Set<string>;
    setForceShowSet: (s: Set<string>) => void;
}

export function HomeDebug({
    forceShowSet,
    setForceShowSet,
}: HomeDebugProps): React.ReactElement | null {
    const [open, setOpen] = React.useState(false);
    const [, forceRender] = React.useState(0);
    const user = useUser();

    if (process.env.NODE_ENV !== "development" || !user || user.id !== 1) {
        return null;
    }

    const hasOverrides = COMPONENT_NAMES.some(
        (name) => !preferences.get(prefKey(name)) || forceShowSet.has(name),
    );

    const cycleState = (name: string) => {
        const visible = preferences.get(prefKey(name));
        const forced = forceShowSet.has(name);

        if (visible && !forced) {
            // visible → forced
            const next = new Set(forceShowSet);
            next.add(name);
            setForceShowSet(next);
            saveForceShow(next);
        } else if (forced) {
            // forced → hidden
            const next = new Set(forceShowSet);
            next.delete(name);
            setForceShowSet(next);
            saveForceShow(next);
            preferences.set(prefKey(name), false as never);
        } else {
            // hidden → visible
            preferences.set(prefKey(name), true as never);
        }
        forceRender((n) => n + 1);
    };

    const resetAll = () => {
        for (const name of COMPONENT_NAMES) {
            preferences.set(prefKey(name), true as never);
        }
        setForceShowSet(new Set());
        saveForceShow(new Set());
        forceRender((n) => n + 1);
    };

    return (
        <div className="HomeDebug">
            {open && (
                <div className="HomeDebug-dropdown">
                    {hasOverrides && (
                        <div className="HomeDebug-reset" onClick={resetAll}>
                            Reset All
                        </div>
                    )}
                    {COMPONENT_NAMES.map((name) => {
                        const visible = preferences.get(prefKey(name));
                        const forced = forceShowSet.has(name);
                        let state: string;
                        if (forced) {
                            state = "on";
                        } else if (!visible) {
                            state = "off";
                        } else {
                            state = "default";
                        }
                        return (
                            <div
                                key={name}
                                className={`HomeDebug-item ${state}`}
                                onClick={() => cycleState(name)}
                            >
                                <span className={`HomeDebug-state ${state}`}>
                                    {state === "on" ? "ON" : state === "off" ? "OFF" : "--"}
                                </span>
                                <span className="HomeDebug-name">{name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
            <button className="HomeDebug-toggle" onClick={() => setOpen(!open)}>
                DBG
            </button>
        </div>
    );
}

export function useHomeDebugState(): [Set<string>, (s: Set<string>) => void] {
    const [forceShowSet, setForceShowSet] = React.useState<Set<string>>(loadForceShow);
    return [forceShowSet, setForceShowSet];
}

export function shouldRender(name: string): boolean {
    return !!preferences.get(prefKey(name));
}

export function isForced(forceShowSet: Set<string>, name: string): boolean {
    return forceShowSet.has(name);
}
