module.exports = {
    "roots": [
        "<rootDir>"
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)", // directories named __test__
        "**/?(*.)+(spec|test).+(ts|tsx|js)", // files with the test.ts/test.tsx/test.js extension
    ],
    "testPathIgnorePatterns": [
        "/node_modules/",
        "/dist/",
        "/doc/"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
    "moduleFileExtensions": ["js", "json", "jsx", "ts", "tsx", "d.ts", "node"],
    "modulePaths": [
        "src/lib",
        "src/components",
        "src/views",
        "src/data",
        "src/compatibility",
        "src",
        "node_modules"
    ],
    "setupFiles": ["./setup-jest.js"],
}
