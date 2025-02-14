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

import { ModalTypes } from "@/components/ModalProvider/ModalTypes";
import { ForkModal } from "@/components/ChallengeModal/ForkModal";
import { LanguagePickerModal } from "@/components/LanguagePicker/LanguagePicker";
import { GameLogModal } from "@/components/GameLogModal";

interface ModalRegistry {
    [key: string]: React.ComponentType<any>;
}

export const modalRegistry: ModalRegistry = {
    [ModalTypes.Fork]: ForkModal,
    [ModalTypes.LanguagePicker]: LanguagePickerModal,
    [ModalTypes.GameLog]: GameLogModal,
};

export function registerModal(modalType: string, component: React.ComponentType<any>): void {
    modalRegistry[modalType] = component;
}

export function unregisterModal(modalType: string): void {
    delete modalRegistry[modalType];
}
