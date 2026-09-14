import { randomInt } from "node:crypto";

const MAX_USERNAME_LENGTH = 30;
const SUFFIX_LENGTH = 10;

/** Numeric suffixes avoid random words and acronyms rejected by the name filter. */
export function newTestUsername(role: string): string {
    const maxRoleLength = MAX_USERNAME_LENGTH - "e2e_".length - SUFFIX_LENGTH;
    if (role.length > maxRoleLength) {
        throw new Error(
            `user_role must be ${maxRoleLength} characters or less ` +
                `to keep the generated username within the OGS ${MAX_USERNAME_LENGTH}-char limit`,
        );
    }
    const suffix = String(randomInt(10 ** SUFFIX_LENGTH)).padStart(SUFFIX_LENGTH, "0");
    return `e2e${role}_${suffix}`;
}
