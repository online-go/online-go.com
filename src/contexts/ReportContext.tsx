/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
import * as React from "react";
import * as player_cache from "@/lib/player_cache";

type ReportContextType = {
    reporter: player_cache.PlayerCacheEntry;
    reported: player_cache.PlayerCacheEntry;
    moderator_powers: number;
};

export const ReportContext = React.createContext<ReportContextType | null>(null);
