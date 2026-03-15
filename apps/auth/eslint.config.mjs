import { nodeConfig } from "@repo/eslint-config/node";
import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
    ...nodeConfig,
]);

export default eslintConfig;
