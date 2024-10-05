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

import { _, interpolate, llm_pgettext } from "@/lib/translate";

// These are the "canned messages" that Community Moderators can vote for.

export const CANNED_MESSAGES: rest_api.warnings.WarningMessages = {
    warn_beginner_score_cheat: (game_id) =>
        interpolate(
            _(`
It appears that you delayed the end of game #{{game_id}}, by clicking \
on the board to change the score incorrectly.   This can frustrate your \
opponent and prevent them from moving on to the next game.

Since you are a new player, no action will be taken against \
your account. We simply ask that you learn when to end a game.

Until you develop the experience to judge better, if your \
opponent passes and there are no open borders between your \
stones then you should also pass.

After passing, promptly accept the correct score.

If in doubt about this sort of situation. please ask for help in chat \
or the forums.`),
            { game_id },
        ),
    warn_score_cheat: (game_id) =>
        interpolate(
            _(`
We noticed that you incorrectly changed the score at the end of game #{{game_id}}.

While this might be a genuine mistake, please review the game and be sure you understand the final score.

In future, we hope that you will end your games properly by first closing all the borders of your territory \
and secondly by accepting the correct score immediately after passing.

In case of a disagreement over what the correct score is, we ask you to contact a moderator.

Unfortunately, some users use this form of score manipulation to cheat, if this happens repeatedly \
we’ll have no alternative than to suspend your account.`),
            { game_id },
        ),
    ack_educated_beginner_score_cheat: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}.

It seems that person was a complete beginner - we have tried to explain that games should \
be ended correctly, to pass when their opponent passes, and to accept promptly, \
trusting the auto-score.`),
            { reported },
        ),
    ack_educated_beginner_score_cheat_and_annul: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}.

It seems that person was a complete beginner - we have tried to explain that games should \
be ended correctly, to pass when their opponent passes, and to accept promptly, \
trusting the auto-score.

That incorrectly scored game has been annulled.`),
            { reported },
        ),
    ack_warned_score_cheat: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about scoring properly.`),
            { reported },
        ),
    ack_warned_score_cheat_and_annul: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about scoring properly, \
and that cheated game annulled.`),
            { reported },
        ),
    no_score_cheating_evident: (reported) =>
        interpolate(
            _(`
Thank you for bringing the possible instance of score cheating by {{reported}} to \
our attention. We looked into the report and couldn't see evidence of score cheating.

It may be that you need to report a different type of problem, or provide more explanation - \
you are welcome to raise a new report if that is the case.

Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
    warn_beginner_escaper: (game_id) =>
        interpolate(
            _(`
Hi, welcome to OGS!

Please consider resigning games rather than letting them time out, as this is fairer to your opponents \
than making them wait for your clock to run out. Thank you.
        `),
            { game_id },
        ),
    warn_escaper: (game_id) =>
        interpolate(
            _(`
It has come to our attention that you abandoned game #{{game_id}} and allowed it to time out rather than resigning.

Players are required to end their games properly, as letting them time out can cause opponents to wait unnecessarily, \
and prevent them from moving on to the next game.

Please ensure that you end your games properly by accepting the correct score immediately after passing, \
or by resigning if you feel the position is hopeless.

This helps maintain a positive gaming environment for everyone involved.`),
            { game_id },
        ),
    ack_educated_beginner_escaper: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}, we've asked your newcomer opponent to be more respectful of people’s time.`),
            { reported },
        ),
    ack_educated_beginner_escaper_and_annul: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}, we've asked your newcomer opponent to be more respectful of people’s time.

That incorrectly scored game has been annulled.`),
            { reported },
        ),
    ack_warned_escaper: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about finishing games properly.`),
            { reported },
        ),
    ack_warned_escaper_and_annul: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about finishing games properly, \
and that abandoned game annulled.`),
            { reported },
        ),
    no_escaping_evident: (reported) =>
        interpolate(
            _(`
Thank you for bringing the possible instance of {{reported}} abandoning the game to
our attention.

We looked into the game and did not see them failing to finish the game properly.

It may be that you need to report a different type of problem, or provide more explanation -
you are welcome to raise a new report if that is the case.

Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
    not_escaping_cancel: (reported) =>
        interpolate(
            _(`
Thank you for bringing the possible instance of {{reported}} abandoning the game \
to our attention.

We looked into the game and see that they used "Cancel".

Players are allowed to "Cancel" a game during the first moves.

If you think the person is abusing this feature, please file a report with more details.

Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
    warn_beginner_staller: (game_id) =>
        interpolate(
            _(`
Hi, welcome to OGS!

It appears that you delayed the end of game #{{game_id}}, which can frustrate your opponent and \
prevent them from moving on to the next game.

Since you are a new player, no action will be taken against your account. We simply ask that you \
learn when to end a game.

Until you develop the experience to judge better, if your opponent passes and there are no open borders \
between your stones then you should also pass.

After passing, promptly accept the correct score.

If in doubt about this sort of situation. please ask for help in chat or the forums.
        `),
            { game_id },
        ),
    warn_staller: (game_id) =>
        interpolate(
            _(`
It has come to our attention that you delayed the end of game #{{game_id}}, which can frustrate your \
opponent and prevent them from moving on to their next game.

Players are required to end their games properly, as letting them time out can cause opponents to wait \
unnecessarily, and prevent them from moving on to the next game.

Please ensure that you end your games properly by accepting the correct score immediately after passing, \
or by resigning if you feel the position is hopeless.

This helps maintain a positive gaming environment for everyone involved.`),
            { game_id },
        ),
    ack_educated_beginner_staller: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}, we've asked your newcomer opponent to be more respectful of people’s time.`),
            { reported },
        ),
    ack_educated_beginner_staller_and_annul: (reported) =>
        interpolate(
            _(`
Thanks for the report about {{reported}}, we've asked your newcomer opponent to be more respectful of people’s time.

That incorrectly scored game has been annulled.`),
            { reported },
        ),
    ack_warned_staller: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about finishing games properly.`),
            { reported },
        ),
    ack_warned_staller_and_annul: (reported) =>
        interpolate(
            _(`
Thank you for your report, {{reported}} has been given a formal warning about finishing games properly, \
and that abandoned game annulled.`),
            { reported },
        ),
    no_stalling_evident: (reported) =>
        interpolate(
            _(`
Thank you for bringing the possible instance of stalling play by {{reported}} to \
our attention. We looked into the report and don't see evidence of stalling.

Note that the correct way to signal the game has finished is to pass.  If you didn't pass, \
then your opponent is entitled to keep playing.

It may be that you need to report a different type of problem, or provide more explanation - \
you are welcome to raise a new report if that is the case.

Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
    warn_duplicate_report: (reported) =>
        interpolate(
            _(`
Thanks for your additional report about {{reported}}.

Please don't file multiple reports for the same thing - that creates a lot of work for us tidying up, \
which could be time spent better on other reports.

We appreciate hearing about problems, but one report is enough for each incident - more than that will slow us down.

Thanks!`),
            { reported },
        ),
    report_type_changed: (change) =>
        interpolate(
            _(`
Thanks for your recent report.   We've had to change the 'report type':

    {{change}}.

It makes it easier and quicker to process reports if they are raised with the \
correct type - if you could help with that we'd appreciate it.

If this change seems wrong, we'd welcome feedback about that - please contact a \
moderator to let them know.
`),
            { change },
        ),
    bot_owner_notified: (bot) =>
        interpolate(
            llm_pgettext(
                "Message to acknowledge a report of a bot",
                `
Thanks for your recent report about {{bot}}.

We've notified the owner of that bot.
`,
            ),
            { bot },
        ),
    ack_suspended: (reported) =>
        interpolate(
            llm_pgettext(
                "Message to acknowledge a report of a repeat offender",
                `
Thank you for your report.  {{reported}} is a repeat offender, their account has been suspended.
`,
            ),
            { reported },
        ),

    ack_suspended_and_annul: (reported) =>
        interpolate(
            llm_pgettext(
                "Message to acknowledge a report of a repeat offender and annul a game",
                `
Thank you for your report.  {{reported}} is a repeat offender, their has been suspended. \
The reported game has been annulled.
`,
            ),
            { reported },
        ),
};
