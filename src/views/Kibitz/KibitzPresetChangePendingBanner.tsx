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

function computeSecondsRemaining(deadlineMs: number): number {
    return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

export function KibitzPresetChangePendingBanner({
    changeEffectiveAt,
}: KibitzPresetChangePendingBannerProps): React.ReactElement {
    const deadlineMs = React.useMemo(
        () => new Date(changeEffectiveAt).getTime(),
        [changeEffectiveAt],
    );

    const [secondsRemaining, setSecondsRemaining] = React.useState(() =>
        computeSecondsRemaining(deadlineMs),
    );

    React.useEffect(() => {
        const tick = () => {
            const remaining = computeSecondsRemaining(deadlineMs);
            setSecondsRemaining(remaining);
            if (remaining <= 0) {
                window.clearInterval(interval);
            }
        };
        const interval = window.setInterval(tick, 1000);
        tick();
        return () => window.clearInterval(interval);
    }, [deadlineMs]);

    const text =
        secondsRemaining > 0
            ? interpolate(
                  pgettext(
                      "Kibitz preset room banner shown while a new game is being switched in",
                      "Switching to a new game in {{seconds}}s",
                  ),
                  { seconds: secondsRemaining },
              )
            : pgettext("Kibitz preset room banner when the switch is happening now", "Switching…");

    return (
        <div className="KibitzPresetChangePendingBanner" role="status">
            {text}
        </div>
    );
}
