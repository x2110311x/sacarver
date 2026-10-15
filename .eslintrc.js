module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "es2021": true
    },
    "ignorePatterns": [
        "structures/DB/models/**",
        "logs/**",
        "coverage/**",
        "node_modules/**"
    ],
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
        "no-useless-escape": "warn",
        "no-empty": ["warn", { "allowEmptyCatch": true }]
    }
};
