import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        plugins: {
            turbo: turboPlugin,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            // Turbo-specific
            "turbo/no-undeclared-env-vars": "warn",

            // Import sorting - automatic organization
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            // TypeScript - Type Safety (Errors)
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "@typescript-eslint/ban-ts-comment": ["error", {
                "ts-expect-error": "allow-with-description",
                "ts-ignore": true,
                "ts-nocheck": true,
            }],

            // TypeScript - Disabled for pragmatism
            "@typescript-eslint/no-floating-promises": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/consistent-type-imports": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-misused-promises": "off",

            // Code Quality - Warnings for improvements
            "no-console": "warn",
            "no-debugger": "warn",
            "prefer-const": "warn",
            "no-var": "error",
            "object-shorthand": "warn",
            "prefer-template": "warn",
            "prefer-arrow-callback": "warn",
            "no-throw-literal": "error",
            "no-return-await": "error",
            "require-await": "warn",
            "eqeqeq": ["error", "always", { "null": "ignore" }],
            "curly": ["warn", "all"],

            // Disabled - Prettier handles these
            "no-extra-semi": "off",
        },
    },
    {
        ignores: ["dist/**", "node_modules/**", ".turbo/**", "coverage/**"],
    },
];
