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

import { HelpFlow, HelpItem } from "react-dynamic-help";

import { pgettext } from "translate";

/**
 * Help flows for people who just got Community Moderator powers
 */

export function CommunityModeratorIntro(): JSX.Element {
    return (
        <>
            <HelpFlow
                id="community-moderator-with-reports-intro"
                showInitially={false /* it's triggered by getting powers */}
                description={pgettext(
                    "Name of a dynamic help flow",
                    "Community Moderator Introduction To Reports",
                )}
            >
                <HelpItem target="incident-report-indicator" position={"bottom-left"}>
                    <div>
                        {pgettext(
                            "A message describing the community moderator incident report indicator",
                            "Incident report indicator - click it to see your report list",
                        )}
                    </div>
                </HelpItem>
            </HelpFlow>

            <HelpFlow
                id="community-moderator-no-reports-intro"
                showInitially={false /* it's triggered by getting powers */}
                description={pgettext(
                    "Name of a dynamic help flow",
                    "Community Moderator Introduction (no reports yet)",
                )}
            >
                <HelpItem target="incident-report-indicator" position={"bottom-left"}>
                    <div>
                        {pgettext(
                            "A message describing the community moderator incident report indicator",
                            "The Incident Report Indicator will display here when you have reports to look at!",
                        )}
                    </div>
                </HelpItem>
            </HelpFlow>
        </>
    );
}
