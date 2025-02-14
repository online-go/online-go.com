export default {
    roots: ["<rootDir>"],
    testEnvironment: "jsdom",
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)", // directories named __test__
        "**/?(*.)+(spec|test).+(ts|tsx|js)", // files with the test.ts/test.tsx/test.js extension
    ],
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/doc/", "/submodules/", "/i18n/"],
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
        "^@/(.*)": "<rootDir>/src/$1",
        "^react-dynamic-help$": "<rootDir>/submodules/react-dynamic-help/src",
        "^goban$": "<rootDir>/submodules/goban/src",
        "^goscorer$": "<rootDir>/submodules/goban/src/third_party/goscorer/goscorer",
    },
    setupFiles: ["./setup-jest.js"],

    setupFilesAfterEnv: ["jest-chain", "@testing-library/jest-dom"],
};
