/* Pin a timezone so unit tests are reproducible and, more importantly, capable of
 * failing. Assertions about local wall-clock handling cannot distinguish correct
 * code from a UTC-based implementation when the offset is zero, and CI runners
 * default to UTC.
 *
 * The zone is arbitrary - nothing in OGS depends on Adelaide. It is chosen for three
 * testing properties: a non-zero offset, a half-hour offset (whole-hour zones mask a
 * class of bug), and DST (UTC+10:30 in January, UTC+9:30 in July). Any zone with
 * those properties is an equally valid choice.
 *
 * This is set here, rather than in setupFiles, because it must be in the environment
 * before Jest constructs any Date, which happens before setupFiles runs. */
process.env.TZ = "Australia/Adelaide";

module.exports = {
    roots: ["<rootDir>"],
    testEnvironment: "jsdom",
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)", // directories named __test__
        "**/?(*.)+(spec|test).+(ts|tsx|js)", // files with the test.ts/test.tsx/test.js extension
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/",
        "/doc/",
        "/submodules/",
        "/i18n/",
        "/e2e-tests/",
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest",
        "^.+goscorer.js$": "ts-jest",
        goscorer: "ts-jest",
        "^.+\\.css$": "jest-transform-stub",
    },
    moduleFileExtensions: ["js", "json", "jsx", "ts", "tsx", "d.ts", "node"],
    modulePaths: [
        "src/lib",
        "src/components",
        "src/views",
        "src/data",
        "src/compatibility",
        "src",
        "node_modules",
    ],
    moduleNameMapper: {
        "^@/lib/GobanSocketProxy$": "<rootDir>/src/lib/__mocks__/GobanSocketProxy.ts",
        "^@/(.*)": "<rootDir>/src/$1",
        "^react-dynamic-help$": "<rootDir>/submodules/react-dynamic-help/src",
        "^goban$": "<rootDir>/submodules/goban/src",
        "^goscorer$": "<rootDir>/submodules/goban/src/third_party/goscorer/goscorer",
        "^d3$": "<rootDir>/src/stubs/d3.ts",
        "^@moderator-ui/(.*)": "<rootDir>/src/stubs/moderator-ui/$1",
    },
    setupFiles: ["./setup-jest.cjs"],
    setupFilesAfterEnv: ["jest-chain", "@testing-library/jest-dom"],
    globalTeardown: "<rootDir>/teardown-jest.cjs",
    silent: true,
};
