import { nextJsConfig } from "@repo/eslint-config/next-js";
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    ...nextJsConfig,
]);

export default eslintConfig;
