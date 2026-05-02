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
import "./GameHistoryFilterPopover.css";

export type SizeFilter = "all" | "9x9" | "13x13" | "19x19";
export type RankedFilter = "all" | "ranked" | "unranked";
export type BotFilter = "humans" | "bots";
export type AnnulledFilter = "all" | "hide";

interface GameHistoryFilterPopoverProps {
    sizeFilter: SizeFilter;
    onSizeChange: (size: SizeFilter) => void;
    rankedFilter: RankedFilter;
    onRankedChange: (ranked: RankedFilter) => void;
    botFilter: BotFilter;
    onBotChange: (bot: BotFilter) => void;
    botDisabled?: boolean;
    annulledFilter: AnnulledFilter;
    onAnnulledChange: (annulled: AnnulledFilter) => void;
}

export function GameHistoryFilterPopover(props: GameHistoryFilterPopoverProps) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const rankedDisabled = props.botFilter === "bots";
    const hasActiveFilter =
        props.sizeFilter !== "all" ||
        (!props.botDisabled && props.botFilter !== "humans") ||
        (!rankedDisabled && props.rankedFilter !== "all") ||
        props.annulledFilter !== "all";

    React.useEffect(() => {
        if (!open) {
            return;
        }
        function handleClickOutside(ev: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
                setOpen(false);
            }
        }
        window.addEventListener("click", handleClickOutside);
        return () => window.removeEventListener("click", handleClickOutside);
    }, [open]);

    function toggleSize(size: Exclude<SizeFilter, "all">) {
        props.onSizeChange(props.sizeFilter === size ? "all" : size);
    }

    function toggleRanked(ranked: Exclude<RankedFilter, "all">) {
        props.onRankedChange(props.rankedFilter === ranked ? "all" : ranked);
    }

    return (
        <div className="GameHistoryFilterPopover" ref={containerRef}>
            <button
                type="button"
                className={
                    "sm GameHistoryFilterPopover-toggle" + (hasActiveFilter ? " filter-active" : "")
                }
                onClick={() => setOpen((v) => !v)}
                aria-label={_("Filters")}
                aria-expanded={open}
            >
                <i className="fa fa-filter" />
            </button>
            {open && (
                <div className="GameHistoryFilterPopover-panel" role="dialog">
                    <div className="btn-group">
                        <button
                            className={props.sizeFilter === "9x9" ? "primary sm" : "sm"}
                            onClick={() => toggleSize("9x9")}
                        >
                            {_("9x9")}
                        </button>
                        <button
                            className={props.sizeFilter === "13x13" ? "primary sm" : "sm"}
                            onClick={() => toggleSize("13x13")}
                        >
                            {_("13x13")}
                        </button>
                        <button
                            className={props.sizeFilter === "19x19" ? "primary sm" : "sm"}
                            onClick={() => toggleSize("19x19")}
                        >
                            {_("19x19")}
                        </button>
                    </div>
                    <div className="btn-group">
                        <button
                            className={
                                !rankedDisabled && props.rankedFilter === "ranked"
                                    ? "primary sm"
                                    : "sm"
                            }
                            disabled={rankedDisabled}
                            onClick={() => toggleRanked("ranked")}
                        >
                            {_("Ranked")}
                        </button>
                        <button
                            className={
                                !rankedDisabled && props.rankedFilter === "unranked"
                                    ? "primary sm"
                                    : "sm"
                            }
                            disabled={rankedDisabled}
                            onClick={() => toggleRanked("unranked")}
                        >
                            {_("Unranked")}
                        </button>
                    </div>
                    <div className="btn-group">
                        <button
                            className={
                                !props.botDisabled && props.botFilter === "humans"
                                    ? "primary sm"
                                    : "sm"
                            }
                            disabled={props.botDisabled}
                            onClick={() => props.onBotChange("humans")}
                        >
                            {_("Humans")}
                        </button>
                        <button
                            className={props.botFilter === "bots" ? "primary sm" : "sm"}
                            disabled={props.botDisabled}
                            onClick={() => props.onBotChange("bots")}
                        >
                            {_("Bots")}
                        </button>
                    </div>
                    <div className="btn-group">
                        <button
                            className={props.annulledFilter === "hide" ? "primary sm" : "sm"}
                            onClick={() =>
                                props.onAnnulledChange(
                                    props.annulledFilter === "hide" ? "all" : "hide",
                                )
                            }
                        >
                            {_("Hide annulled games")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
