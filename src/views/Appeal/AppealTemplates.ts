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

import { pgettext } from "@/lib/translate";

export type TemplateCategory = "acknowledgment" | "denial" | "welcome_back";

export type OffenseType =
    | "ai_use"
    | "escaping"
    | "score_cheating"
    | "stalling"
    | "sandbagging"
    | "thrown_game"
    | "harassment"
    | "inappropriate_content"
    | "ban_evasion"
    | "other"
    | "unknown";

export interface AppealTemplate {
    id: string;
    title: string;
    category: TemplateCategory;
    offenseTypes: OffenseType[] | "all";
    text: string;
    builtIn: boolean;
}

/**
 * Map a ban_reason string to a normalized offense type.
 *
 * Community moderation suspensions follow the pattern:
 *   "Community moderation vote for suspension based on {ReportType.label} reports"
 *
 * Other sources use specific strings like "AI Use detected" or "Ban evasion".
 */
export function getOffenseType(ban_reason: string | null): OffenseType {
    if (!ban_reason) {
        return "unknown";
    }

    if (ban_reason === "AI Use detected") {
        return "ai_use";
    }
    if (ban_reason === "Ban evasion") {
        return "ban_evasion";
    }

    // Community moderation pattern — match the report type label
    if (ban_reason.includes("Stopped Playing")) {
        return "escaping";
    }
    if (ban_reason.includes("AI use") || ban_reason.includes("Assess AI play")) {
        return "ai_use";
    }
    if (ban_reason.includes("Score cheating")) {
        return "score_cheating";
    }
    if (ban_reason.includes("Stalling")) {
        return "stalling";
    }
    if (ban_reason.includes("Sandbagging")) {
        return "sandbagging";
    }
    if (ban_reason.includes("Thrown Game")) {
        return "thrown_game";
    }
    if (ban_reason.includes("Harassment")) {
        return "harassment";
    }
    if (ban_reason.includes("Inappropriate content")) {
        return "inappropriate_content";
    }

    return "other";
}

export const APPEAL_TEMPLATES: AppealTemplate[] = [
    // --- Acknowledgment templates ---
    {
        id: "ack_general",
        title: pgettext(
            "Appeal response template title",
            "Thanks for appealing — what happens next",
        ),
        category: "acknowledgment",
        offenseTypes: "all",
        builtIn: true,
        text: pgettext(
            "Appeal response template sent to a suspended user",
            `Thank you for your appeal.

Your case will be reviewed by our moderation team. We take appeals seriously and will look at the circumstances carefully.

Please allow some time for us to review — we will respond here when we have an update.`,
        ),
    },
    {
        id: "ack_ai_use",
        title: pgettext(
            "Appeal response template title",
            "Thanks — AI use appeal process (with prior warning)",
        ),
        category: "acknowledgment",
        offenseTypes: ["ai_use"],
        builtIn: true,
        text: pgettext(
            "Appeal response template sent to a user suspended for AI use who had a prior warning",
            `Thanks for your appeal. The process from here is:

  - We ask you to double check and refresh your memory.

If you recall that you were in fact tempted and did use AI assistance, and agree not to do that again, we can restore your account.

 - If you still don’t recall using AI in games since we asked you not to do that, and you insist that you have not, we can ask the AI detection team for a detailed analysis to rule out false positive from the detection system.

If they conclude that there is little doubt that AI was used, then you will have to find somewhere else to play go, that is the end of the road.

If they conclude that a false positive is possible, we’ll restore your account.

Please advise.

( https://github.com/online-go/online-go.com/wiki/Moderation-at-OGS#minimizing-ai-cheating )
`,
        ),
    },
    {
        id: "ack_ai_use_no_warning",
        title: pgettext(
            "Appeal response template title",
            "Thanks — AI use appeal process (no prior warning)",
        ),
        category: "acknowledgment",
        offenseTypes: ["ai_use"],
        builtIn: true,
        text: pgettext(
            "Appeal response template sent to a user suspended for AI use without a prior warning",
            `Thanks for your appeal. The process from here is:

  - We ask you to double check and refresh your memory.

If you recall that you were in fact tempted and did use AI assistance, and agree not to do that again, we can restore your account.

 - If you still don’t recall using AI in games, and you insist that you have not, we can ask the AI detection team for a detailed analysis to rule out false positive from the detection system.

If they conclude that there is little doubt that AI was used, then you will have to find somewhere else to play go, that is the end of the road.

If they conclude that a false positive is possible, we’ll restore your account.

Please advise.

( https://github.com/online-go/online-go.com/wiki/Moderation-at-OGS#minimizing-ai-cheating )
`,
        ),
    },

    // --- Denial templates ---
    {
        id: "denial_general",
        title: pgettext("Appeal response template title", "Appeal denied - generic"),
        category: "denial",
        offenseTypes: "all",
        builtIn: true,
        text: pgettext(
            "Appeal response template sent to deny a suspended user’s appeal",
            `We have reviewed your appeal and unfortunately we will not be restoring this account.
`,
        ),
    },
    {
        id: "denial_ai_use",
        title: pgettext("Appeal response template title", "Appeal denied — AI use"),
        category: "denial",
        offenseTypes: ["ai_use"],
        builtIn: true,
        text: pgettext(
            "Appeal response template sent to deny a user’s appeal against an AI use suspension",
            `A review of the detection process says that AI was definitely used.

If this is not the case, we regret this, but we have to act on what we see.

Your questions about this are answered here:

https://github.com/online-go/online-go.com/wiki/Moderation-at-OGS#minimizing-ai-cheating

You will need to find somewhere else to play Go.`,
        ),
    },

    // --- Welcome back templates ---
    {
        id: "welcome_back_general",
        title: pgettext("Appeal response template title", "Welcome back"),
        category: "welcome_back",
        offenseTypes: "all",
        builtIn: true,
        text: pgettext(
            "Appeal response template sent when restoring a suspended user’s account",
            `Your account has been restored. Welcome back to OGS!

We trust that you understand what led to the suspension and that it will not be repeated. Please review our terms of service if you are unsure.

We hope you enjoy your time on OGS.`,
        ),
    },
    {
        id: "welcome_back_ai_use",
        title: pgettext("Appeal response template title", "Welcome back — after AI use"),
        category: "welcome_back",
        offenseTypes: ["ai_use"],
        builtIn: true,
        text: pgettext(
            "Appeal response template sent when restoring a user suspended for AI use",
            `Your account has been restored. Welcome back to OGS!

Please remember that all games must be played without any form of AI assistance, or any outside assistance.

We’re committed to minimizing AI cheating, and any further detection of AI use will result in a permanent suspension.

We hope you enjoy playing on OGS fairly.`,
        ),
    },
];

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
    acknowledgment: pgettext("Appeal template category", "Acknowledgment"),
    denial: pgettext("Appeal template category", "Denial"),
    welcome_back: pgettext("Appeal template category", "Welcome back"),
};

export function getCategoryLabel(category: TemplateCategory): string {
    return CATEGORY_LABELS[category];
}

/**
 * Filter templates to those relevant for a given offense type.
 * Returns templates where offenseTypes is "all" or includes the given type.
 */
export function getTemplatesForOffense(offenseType: OffenseType): AppealTemplate[] {
    return APPEAL_TEMPLATES.filter(
        (t) => t.offenseTypes === "all" || t.offenseTypes.includes(offenseType),
    );
}
