module.exports = {
    env: {
        browser: true,
        node: true,
        es2021: true,
    },
    extends: "eslint:recommended",
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
    },
    rules: {
        "no-unused-vars": "warn",  // Warn for unused variables
        "no-undef": "error",       // Error for undefined variables
        "eqeqeq": "warn"           // Warn if '==' is used instead of '==='
    },
};
