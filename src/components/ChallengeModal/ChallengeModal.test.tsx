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

/* cspell: words groupadmin cotsen */
import * as React from "react";

import * as ChallengeModal from "./ChallengeModal";
import * as Modal from "./../Modal";
import { render } from "@testing-library/react";
import { ModalConsumer, ModalProvider, ModalTypes } from "../Modal/ModalProvider";

jest.mock("./../Modal", () => {
    return {
        ...jest.requireActual("./../Modal"),
    };
});

describe("ChallengeModal", () => {
    it("should do a computer challenge via provider", () => {
        const challengeModalSpy = jest
            .spyOn(ChallengeModal, "ChallengeModal")
            .mockImplementation(jest.fn());

        render(
            <ModalProvider>
                <ModalConsumer>
                    {({ showModal }) => {
                        showModal(ModalTypes.Challenge);
                        return <div />;
                    }}
                </ModalConsumer>
            </ModalProvider>,
        );
        expect(challengeModalSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                game_record_mode: true,
                mode: "open",
            }),
            {},
        );
    });

    it("should do a computer challenge via modal", () => {
        const modalSpy = jest.spyOn(Modal, "openModal").mockReturnValue(true);
        ChallengeModal.challengeComputer();
        expect(modalSpy).toHaveBeenCalledWith(
            <ChallengeModal.ChallengeModal initialState={null} mode="computer" />,
        );
    });
});
