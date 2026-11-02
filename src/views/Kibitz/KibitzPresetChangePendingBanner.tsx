/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { interpolate, pgettext } from "@/lib/translate";
import "./KibitzPresetChangePendingBanner.css";

interface KibitzPresetChangePendingBannerProps {
    changeEffectiveAt: string;
}

export function KibitzPresetChangePendingBanner({
    changeEffectiveAt,
}: KibitzPresetChangePendingBannerProps): React.ReactElement | null {
    const deadlineMs = React.useMemo(
        () => new Date(changeEffectiveAt).getTime(),
        [changeEffectiveAt],
    );

    const [now, setNow] = React.useState(Date.now);

    React.useEffect(() => {
        let interval: number | undefined;
        const tick = () => {
            const currentTime = Date.now();
            const remaining = Math.max(0, Math.ceil((deadlineMs - currentTime) / 1000));
            setNow(currentTime);
            if (remaining <= 0 && interval !== undefined) {
                window.clearInterval(interval);
                interval = undefined;
            }
            return remaining;
        };

        const remaining = tick();
        if (Number.isFinite(deadlineMs) && remaining > 0) {
            interval = window.setInterval(tick, 1000);
        }

        return () => window.clearInterval(interval);
    }, [deadlineMs]);

    if (!Number.isFinite(deadlineMs)) {
        return null;
    }
    const secondsRemaining = Math.max(0, Math.ceil((deadlineMs - now) / 1000));
    const text =
        secondsRemaining > 0
            ? interpolate(
                  pgettext(
                      "Kibitz preset room countdown before a game change",
                      "Next game in {{time}}",
                  ),
                  {
                      time: `${Math.floor(secondsRemaining / 60)}:${String(secondsRemaining % 60).padStart(2, "0")}`,
                  },
              )
            : pgettext(
                  "Kibitz preset room banner while waiting for a game change",
                  "Waiting for the next game…",
              );

    return (
        <div className="KibitzPresetChangePendingBanner" role="timer" aria-live="off">
            {text}
        </div>
    );
}
