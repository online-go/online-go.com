/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link} from "react-router";
import {_, pgettext, interpolate} from "translate";
import data from "data";

declare var factorem;

type AdUnitUnit =
    "cdm-zone-01"   | // 728x90    ATF Leaderboard
    "cdm-zone-02"   | // 300x250   ATF Medium Rectangle
    "cdm-zone-03"   | // 300x250   Middle / In Content
    "cdm-zone-04"   | // 728x90    BTF Leaderboard
    "cdm-zone-05"   | // 728x90    Middle / In Content
    "cdm-zone-06"   | // 300x250   BTF Medium Rectangle
    "cdm-zone-skin" ; // Skin slot


interface AdUnitProperties {
    unit: AdUnitUnit;
    nag?: boolean;
}


const never_load_ads = false;
let zone_end = null;
let refresh_delay_timeout = null;

if (never_load_ads) {
    console.info("Ads are currently disabled");
}


function should_show_ads() {
    if (data.get("user").supporter && data.get("user").id !== 1) {
        return false;
    }

    if (data.get("user").is_superuser || data.get("user").is_moderator) {
        return data.get("ad-override", false);
    }

    if (/beta|dev/.test(window.location.hostname)) {
        return false;
    }

    if (data.get("user").anonymous) {
        return true;
    }

    return true;
}


function refresh_ads() {
    if (!should_show_ads()) {
        return;
    }

    if (refresh_delay_timeout) {
        return;
    }


    let failsafe = setTimeout(() => {
        console.log("refresh_ads failsafe triggered");
        refresh_delay_timeout = null;
    }, 60000);

    if (!zone_end) {
        zone_end = $(`<div id="cdm-zone-end"></div>`);
        $(document.body).append(zone_end);
    }

    refresh_delay_timeout = setTimeout(() => {
        if (window["factorem"]) {
            //console.info("Refreshing ads. Current adZones ", factorem.adZones);
            factorem.minimumRefresh = 0;
            factorem.refreshAds();
            //console.info("Refreshed ads. New adZones ", factorem.adZones);
            clearTimeout(failsafe);
            refresh_delay_timeout = null;
            return;
        }

        let script = document.createElement("script");
        let tstamp = new Date();
        script.id = "factorem";
        script.src = "//cdm.cursecdn.com/js/online-go/cdmfactorem_min.js?misc=" + tstamp.getTime();
        script.async = true;
        script.type = "text/javascript";
        script.onerror = (err) => {
            clearTimeout(failsafe);
            refresh_delay_timeout = null;
            console.error(err);
        };
        script.onload = () => {
            clearTimeout(failsafe);
            refresh_delay_timeout = null;
            console.info("CDM Loaded");
            setTimeout(() => {
                console.info("Ad zones: ", factorem.adZones);
            }, 100);
        };
        document.head.appendChild(script);
    }, never_load_ads ? 24 * 3600 * 1000 : 1);
}

export class AdUnit extends React.Component<AdUnitProperties, any> {
    refs: {
        container
    };

    constructor(props) {
        super(props);
        this.state = {
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!should_show_ads()) {
            return false;
        }
        return true;
    }

    componentDidMount() {
        refresh_ads();
    }

    render() {
        if (!should_show_ads()) {
            return null;
        }

        return (
            <div className="AdUnit">
                <div ref="container" className={"ogs-" + this.props.unit + "-container"}><div><div id={this.props.unit}></div></div></div>

                {(!this.props.nag ? null : (
                    <div className="turn-off-ads-note">
                        <Link to="/user/supporter">{_("Turn off ads and better support OGS, become a site supporter today!")}</Link>
                    </div>
                ))}
            </div>
        );
    }
}
