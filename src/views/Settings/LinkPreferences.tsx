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

import { _, pgettext } from "@/lib/translate";

import * as data from "@/lib/data";
import { put } from "@/lib/requests";
import { errorAlerter, Timeout } from "@/lib/misc";

import { Toggle } from "@/components/Toggle";

import { SettingGroupPageProps, PreferenceLine } from "@/lib/SettingsCommon";

import { IAssociation, associations } from "@/lib/associations";
import { allRanks, IRankInfo } from "@/lib/rank_utils";

let update_link_preferences_debounce: Timeout | undefined;

export function LinkPreferences(props: SettingGroupPageProps): React.ReactElement {
    const link = props.state.self_reported_account_linkages || {};

    function set(key: string): (value: any) => void {
        return (value: any) => {
            if (typeof value === "object") {
                value = value.target.value; // event
            }

            link[key] = value;
            props.updateSelfReportedAccountLinkages(link);
            if (update_link_preferences_debounce) {
                clearTimeout(update_link_preferences_debounce);
            }
            update_link_preferences_debounce = setTimeout(() => {
                clearTimeout(update_link_preferences_debounce);
                update_link_preferences_debounce = undefined;
                put("me/settings", {
                    self_reported_account_linkages: props.state.self_reported_account_linkages,
                })
                    .then((res) => console.log(res))
                    .catch(errorAlerter);
            }, 500);
        };
    }

    return (
        <div id="LinkPreferences">
            <div className="LinkPreferencesDescription">
                {_(
                    "Here you can list other places you play and have a rating or a rank. You can choose to publicly display this information or not. Providing this even if you don't want it publicly known helps us tune our ranking algorithm and provide guidance on converting ranks between servers and organizations for the community, so the information is important and greatly appreciated.",
                )}
            </div>

            <PreferenceLine title={_("Show this information on your profile page")}>
                <Toggle checked={!link.hidden} onChange={(tf) => set("hidden")(!tf)} />
            </PreferenceLine>

            <PreferenceLine title={_("Only show ranks, not ids and usernames")}>
                <Toggle
                    disabled={link.hidden}
                    checked={!!link.hidden_ids && !link.hidden}
                    onChange={(tf) => set("hidden_ids")(tf)}
                />
            </PreferenceLine>

            <h2>{_("Associations")}</h2>

            <PreferenceLine title={<AssociationSelect value={link.org1} onChange={set("org1")} />}>
                <input
                    type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org1_id || ""}
                    onChange={set("org1_id")}
                />
                <RankSelect value={link.org1_rank} onChange={set("org1_rank")} />
            </PreferenceLine>

            <PreferenceLine title={<AssociationSelect value={link.org2} onChange={set("org2")} />}>
                <input
                    type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org2_id || ""}
                    onChange={set("org2_id")}
                />
                <RankSelect value={link.org2_rank} onChange={set("org2_rank")} />
            </PreferenceLine>

            <PreferenceLine title={<AssociationSelect value={link.org3} onChange={set("org3")} />}>
                <input
                    type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org3_id || ""}
                    onChange={set("org3_id")}
                />
                <RankSelect value={link.org3_rank} onChange={set("org3_rank")} />
            </PreferenceLine>

            <h2>{_("Servers")}</h2>
            <PreferenceLine title={_("KGS")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.kgs_username || ""}
                    onChange={set("kgs_username")}
                />
                <RankSelect value={link.kgs_rank} onChange={set("kgs_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("IGS / PandaNet")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.igs_username || ""}
                    onChange={set("igs_username")}
                />
                <RankSelect value={link.igs_rank} onChange={set("igs_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("DGS")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.dgs_username || ""}
                    onChange={set("dgs_username")}
                />
                <RankSelect value={link.dgs_rank} onChange={set("dgs_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("Little Golem")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.golem_username || ""}
                    onChange={set("golem_username")}
                />
                <RankSelect value={link.golem_rank} onChange={set("golem_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("WBaduk")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.wbaduk_username || ""}
                    onChange={set("wbaduk_username")}
                />
                <RankSelect value={link.wbaduk_rank} onChange={set("wbaduk_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("Tygem")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.tygem_username || ""}
                    onChange={set("tygem_username")}
                />
                <RankSelect value={link.tygem_rank} onChange={set("tygem_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("Fox")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.fox_username || ""}
                    onChange={set("fox_username")}
                />
                <RankSelect value={link.fox_rank} onChange={set("fox_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("Yike Weiqi")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.yike_username || ""}
                    onChange={set("yike_username")}
                />
                <RankSelect value={link.yike_rank} onChange={set("yike_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("GoQuest")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.goquest_username || ""}
                    onChange={set("goquest_username")}
                />
                <RankSelect value={link.goquest_rank} onChange={set("goquest_rank")} />
            </PreferenceLine>
            <PreferenceLine title={_("BadukPop")}>
                <input
                    type="text"
                    placeholder={_("Username")}
                    value={link.badukpop_username || ""}
                    onChange={set("badukpop_username")}
                />
                <RankSelect value={link.badukpop_rank} onChange={set("badukpop_rank")} />
            </PreferenceLine>
        </div>
    );
}

const rank_select_ranks = allRanks();
function RankSelect({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}): React.ReactElement {
    return (
        <select
            className="RankSelect"
            value={value}
            onChange={(ev) => onChange(parseInt(ev.target.value))}
        >
            <option value={-999}>{_("-- Select Rank --")}</option>
            {rank_select_ranks.map((rank: IRankInfo) => (
                <option key={rank.rank} value={rank.rank}>
                    {rank.label}
                </option>
            ))}
        </select>
    );
}

function AssociationSelect({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}): React.ReactElement {
    let user_countries: string[] = [];
    try {
        if (data.get("user").country) {
            /* If there's an association for the user's country, we put it at the top of the list */
            if (associations.filter((a) => a.country === data.get("user").country).length > 0) {
                user_countries.push(data.get("user").country);
            }
        }
    } catch {
        // pass
    }

    if (user_countries.length === 0 || user_countries[0] === "un") {
        /* Couldn't figure out a best association to put up top? Put the most common ones up on top */
        user_countries = ["us", "eu", "jp", "cn", "kr"];
    }

    associations.sort((a: IAssociation, b: IAssociation) => {
        if (user_countries.indexOf(a.country) >= 0) {
            if (user_countries.indexOf(b.country) >= 0) {
                return a.name < b.name ? -1 : 1;
            }
            return -1;
        }
        if (user_countries.indexOf(b.country) >= 0) {
            return 1;
        }

        return a.country < b.country ? -1 : 1;
    });

    return (
        <select
            className="AssociationSelect"
            value={value}
            onChange={(ev) => onChange(ev.target.value)}
        >
            <option value={""}>{_("-- Select Association --")}</option>
            {associations.map((association: IAssociation) => (
                <option key={association.country} value={association.country}>
                    {association.name}
                </option>
            ))}
        </select>
    );
}
