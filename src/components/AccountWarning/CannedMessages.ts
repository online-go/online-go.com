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

import { _, interpolate } from "translate";

export const CANNED_MESSAGES: rest_api.warnings.WarningMessages = {
    warn_beginner_score_cheat: (game_id) =>
        interpolate(
            _(`
        It appears that you delayed the end of game #{{game_id}}, by clicking
        on the board to change the score incorrectly.   This can frustrate your
        opponent and prevent them from moving on to the next game.

        Since you are a new player, no action will be taken against
        your account. We simply ask that you learn when to end a game.

        Until you develop the experience to judge better, if your
        opponent passes and there are no open borders between your
        stones then you should also pass.

        After passing, promptly accept the correct score.

        If in doubt about this sort of situation. please ask for help in chat
        or the forums.`),
            { game_id },
        ),
    warn_score_cheat: (game_id) =>
        interpolate(
            _(`
    Our records show that you attempted to illegally change the score at the end of
    game #{{game_id}}. This is a form of cheating and is prohibited by the
    OGS Terms of Service.

    https://online-go.com/docs/terms-of-service

    We ask that you end your games properly by accepting the correct score
    immediately after passing. Further instances of score cheating will result
    in suspension of your account.`),
            { game_id },
        ),
    ack_educated_beginner_score_cheat: (reported) =>
        interpolate(
            _(`
            Thanks for the report about {{reported}}. It seems you were playing against a
            complete beginner - we have tried to explain that games should
            be ended correctly, to pass when their opponent passes, and to accept promptly,
            trusting the auto-score.`),
            { reported },
        ),
    ack_educated_beginner_score_cheat_and_annul: (reported) =>
        interpolate(
            _(`
            Thanks for the report about {{reported}}. It seems you were playing against a
            complete beginner - we have tried to explain that games should
            be ended correctly, to pass when their opponent passes, and to accept promptly,
            trusting the auto-score.   That incorrectly scored game has been annulled.`),
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
            Thank you for your report, {{reported}} has been given a formal warning about scoring properly, and that cheated game annulled.`),
            reported,
        ),
    no_score_cheating_evident: (reported) =>
        interpolate(
            _(`
        Thank you for bringing the possible instance of score cheating by {{reported}} to
        our attention. We looked into the report and their actions seemed approprate. If a pattern of
        complaints emerges, we will investigate further.

        Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
    warn_beginner_escaper: (game_id) =>
        interpolate(
            _(`
        Hi, welcome to OGS!

        Please consider resigning games rather than letting them time out, as this is fairer to your opponents than making them wait for your clock to run out. Thank you.
        `),
            { game_id },
        ),
    warn_escaper: (game_id) =>
        interpolate(
            _(`
        It has come to our attention that you abandoned game #{{game_id}} and allowed it to time out rather than resigning.

        Players are required to end their games properly, as letting them time out can cause opponents to wait unnecessarily,
        and prevent them from moving on to the next game.

        Please ensure that you end your games properly by accepting the correct score immediately after passing,
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
        Thank you for your report, {{reported}} has been given a formal warning about finishing games properly, and that abandonned game annulled.`),
            reported,
        ),
    no_escaping_evident: (reported) =>
        interpolate(
            _(`
        Thank you for bringing the possible instance of escaping by {{reported}} to
        our attention. We looked into the report and their actions seemed approprate. If a pattern of
        complaints emerges, we will investigate further.

        Thank you for helping keep OGS enjoyable for everyone. We appreciate it.`),
            { reported },
        ),
};
