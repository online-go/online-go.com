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
import { Link } from "react-router-dom";

import { _ } from "@/lib/translate";
import { current_language } from "@/lib/translate";
import * as data from "@/lib/data";
import { useData } from "@/lib/hooks";
import { put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { Card } from "@/components/material";
import "./WhatsNewBanner.css";

interface WhatsNewBannerProps {
    forceShow?: boolean;
}

export function WhatsNewBanner({ forceShow }: WhatsNewBannerProps): React.ReactElement | null {
    const [config] = useData("config");
    const whatsNew = config?.whats_new;

    const dismiss = React.useCallback(() => {
        put("whats_new/mark_read/")
            .then(() => {
                const config = data.get("config");
                if (config) {
                    data.set("config", { ...config, whats_new: undefined });
                }
            })
            .catch(errorAlerter);
    }, []);

    if (!forceShow && !whatsNew) {
        return null;
    }

    const title = whatsNew
        ? whatsNew.title[current_language] || whatsNew.title["en"] || ""
        : "What's New";

    return (
        <Card className="WhatsNewBanner">
            <div className="WhatsNewBanner-content">
                <span className="WhatsNewBanner-label">{_("What's New")}</span>
                <Link to={whatsNew ? `/whats-new/${whatsNew.id}` : "/whats-new"} onClick={dismiss}>
                    {title}
                </Link>
            </div>
            <i className="fa fa-times dismiss" onClick={dismiss} />
        </Card>
    );
}
