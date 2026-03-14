import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { nextJsConfig } from "@repo/eslint-config/next-js"

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    ...nextJsConfig,
]);

export default eslintConfig;
