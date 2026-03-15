import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Node.js/Hono backend applications.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nodeConfig = [
    ...baseConfig,
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2022,
            },
        },
    },
    {
        rules: {
            // Backend-specific: Console logging is normal for servers
            "no-console": "off",

            // Backend-specific: Stricter async/promise handling (critical for servers)
            "require-await": "error",

            // Backend-specific: Process and error handling
            "no-process-exit": "warn",
        },
    },
    {
        files: ["**/*.ts"],
        rules: {
            // Backend-specific: Stricter async/promise handling for TypeScript files
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/await-thenable": "error",
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        }
    }
];
