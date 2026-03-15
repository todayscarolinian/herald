import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
    ...baseConfig,
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommended,
    globalIgnores([
        // Default ignores of eslint-config-next:
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
    {
        ...pluginReact.configs.flat.recommended,
        languageOptions: {
            ...pluginReact.configs.flat.recommended.languageOptions,
            globals: {
                ...globals.serviceworker,
            },
        },
    },
    {
        settings: { react: { version: "detect" } },
        rules: {
            // React scope no longer necessary with new JSX transform
            "react/react-in-jsx-scope": "off",

            // TypeScript handles prop types
            "react/prop-types": "off",

            // Security and best practices
            "react/jsx-no-target-blank": "error",
            "react/jsx-key": "error",
            "react/self-closing-comp": "warn",
            "react/jsx-boolean-value": ["warn", "never"],
            "react/jsx-curly-brace-presence": ["warn", { "props": "never", "children": "never" }],
            "react/no-array-index-key": "warn",
            "react/no-unstable-nested-components": "error",

            // Hooks
            "react-hooks/exhaustive-deps": "warn",

            // Next.js specific
            "@next/next/no-html-link-for-pages": "error",
        },
    },
];
