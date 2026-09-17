import { randomInt } from "node:crypto";
import { newTestUsername } from "../e2e-tests/helpers/test-username";

jest.mock("node:crypto", () => ({ randomInt: jest.fn() }));

test.each([0, 123456789, 9999999999])("keeps numeric suffix %i and the readable role", (value) => {
    jest.mocked(randomInt).mockImplementation(() => value);

    expect(newTestUsername("kibBlk")).toBe(`e2ekibBlk_${String(value).padStart(10, "0")}`);
});

test("accepts the longest existing test role without exceeding the server limit", () => {
    jest.mocked(randomInt).mockImplementation(() => 123456789);
    const name = newTestUsername("aiDetVSAReported");
    expect(name).toMatch(/^e2eaiDetVSAReported_\d+$/);
    expect(name).toHaveLength(30);
});

test("checks the length before registration", () => {
    jest.mocked(randomInt).mockImplementation(() => 0);
    const role = "x".repeat(16);

    expect(newTestUsername(role)).toHaveLength(30);
    expect(() => newTestUsername(`${role}x`)).toThrow("within the OGS 30-char limit");
});
